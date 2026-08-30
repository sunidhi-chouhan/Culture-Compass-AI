import { GoogleGenerativeAI } from "@google/generative-ai";
import { ZodError } from "zod";
import type { ModelPreset } from "@culturecompass/shared";
import { AiGenerationError, toAiGenerationError } from "./errors";
import { resolveModelName } from "./resolveModel";

const GEMINI_TIMEOUT_MS = 55_000;

let client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiGenerationError("AI service is not configured.");
  }

  if (!client) {
    client = new GoogleGenerativeAI(apiKey);
  }

  return client;
}

export function getModelName(modelPreset?: ModelPreset): string {
  return resolveModelName(modelPreset);
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new AiGenerationError(
          "The request took too long. Try the Fast model or simplify your request.",
        ),
      );
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export interface GenerateJsonOptions {
  modelPreset?: ModelPreset;
  /** Explicit Gemini model id; wins over modelPreset when set. */
  modelName?: string;
  /** Default 2. Use 1 on Vercel Hobby for large itinerary/TripMate calls. */
  attempts?: number;
  timeoutMs?: number;
  temperature?: number;
}

function isFormatError(error: unknown): boolean {
  if (error instanceof ZodError) return true;
  if (!(error instanceof AiGenerationError)) return false;
  const lower = error.message.toLowerCase();
  return lower.includes("unexpected format") || lower.includes("invalid json");
}

export async function generateJson<T>(
  prompt: string,
  parse: (raw: unknown) => T,
  options?: GenerateJsonOptions,
): Promise<T> {
  const genAI = getGeminiClient();
  const attempts = Math.max(1, options?.attempts ?? 2);
  const timeoutMs = options?.timeoutMs ?? GEMINI_TIMEOUT_MS;
  const model = genAI.getGenerativeModel({
    model: options?.modelName || resolveModelName(options?.modelPreset),
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      responseMimeType: "application/json",
    },
  });

  let lastError: AiGenerationError | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await withTimeout(model.generateContent(prompt), timeoutMs);
      const text = result.response.text();
      if (!text?.trim()) {
        throw new AiGenerationError("AI returned an empty response. Please try again.");
      }
      const json = extractJson(text);

      try {
        return parse(json);
      } catch (parseError) {
        if (parseError instanceof ZodError) {
          throw new AiGenerationError("AI returned an unexpected format. Please try again.", {
            cause: parseError,
          });
        }
        throw parseError;
      }
    } catch (error) {
      lastError = toAiGenerationError(error);
      // Schema/JSON misses will not improve with another full generation on a 10s budget.
      if (isFormatError(error) || isFormatError(lastError) || attempt >= attempts - 1) {
        throw lastError;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  throw lastError ?? new AiGenerationError("Unable to generate content right now. Please try again.");
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/```json|```/gi, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new AiGenerationError("AI returned invalid JSON. Please try again.");
  }

  const jsonText = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new AiGenerationError("AI returned invalid JSON. Please try again.");
  }
}
