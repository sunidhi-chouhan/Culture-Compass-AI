"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  charIndexToWordIndex,
  chunkNarrativeForSpeech,
  isSpeechSynthesisSupported,
  tokenizeNarrative,
} from "@/lib/story-speech";

export type StorySpeechStatus = "idle" | "playing" | "paused" | "error";

interface UseStorySpeechOptions {
  rate?: number;
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.startsWith("en") && voice.localService) ??
    voices.find((voice) => voice.lang.startsWith("en")) ??
    voices[0]
  );
}

export function useStorySpeech(narrative: string, options: UseStorySpeechOptions = {}) {
  const { rate = 0.92 } = options;
  const [status, setStatus] = useState<StorySpeechStatus>("idle");
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [readThroughIndex, setReadThroughIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tokens = useMemo(() => tokenizeNarrative(narrative), [narrative]);
  const supported = isSpeechSynthesisSupported();
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkQueueRef = useRef<string[]>([]);
  const absoluteCharOffsetRef = useRef(0);
  const boundaryFiredRef = useRef(false);
  const resumeFromIndexRef = useRef(0);
  const startCharRef = useRef(0);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!supported) return;
    const warm = () => {
      void window.speechSynthesis.getVoices();
    };
    warm();
    window.speechSynthesis.addEventListener("voiceschanged", warm);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", warm);
  }, [supported]);

  const startChromeKeepAlive = useCallback(() => {
    clearKeepAlive();
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }, [clearKeepAlive]);

  const startFallbackHighlightFrom = useCallback(
    (fromIndex: number) => {
      clearFallbackTimer();
      if (tokens.length === 0) return;

      const msPerWord = Math.max(180, Math.round((narrative.length / Math.max(tokens.length, 1)) * 45));
      let index = Math.max(0, fromIndex);
      setActiveWordIndex(index);
      if (index === 0) setReadThroughIndex(-1);

      fallbackTimerRef.current = setInterval(() => {
        if (index >= tokens.length - 1) {
          clearFallbackTimer();
          setReadThroughIndex(tokens.length - 1);
          setActiveWordIndex(-1);
          setStatus("idle");
          clearKeepAlive();
          return;
        }
        setReadThroughIndex(index);
        index += 1;
        setActiveWordIndex(index);
      }, msPerWord);
    },
    [clearFallbackTimer, clearKeepAlive, narrative.length, tokens.length],
  );

  const stop = useCallback(() => {
    if (!supported) return;
    clearFallbackTimer();
    clearKeepAlive();
    chunkQueueRef.current = [];
    window.speechSynthesis.cancel();
    absoluteCharOffsetRef.current = 0;
    startCharRef.current = 0;
    resumeFromIndexRef.current = 0;
    setStatus("idle");
    setActiveWordIndex(-1);
    setReadThroughIndex(-1);
    setErrorMessage(null);
  }, [clearFallbackTimer, clearKeepAlive, supported]);

  const speakNextChunk = useCallback(() => {
    if (!supported) return;
    const next = chunkQueueRef.current.shift();
    if (!next) {
      clearFallbackTimer();
      clearKeepAlive();
      setStatus("idle");
      setReadThroughIndex(tokens.length - 1);
      setActiveWordIndex(-1);
      return;
    }

    boundaryFiredRef.current = false;
    const chunkStart = absoluteCharOffsetRef.current;
    const utterance = new SpeechSynthesisUtterance(next);
    utterance.rate = rate;
    utterance.pitch = 1;
    const voice = pickVoice();
    if (voice) utterance.voice = voice;

    utterance.onboundary = (event) => {
      if (event.name === "word" || event.name === "sentence") {
        boundaryFiredRef.current = true;
        clearFallbackTimer();
        const absoluteChar = chunkStart + event.charIndex;
        const wordIndex = charIndexToWordIndex(tokens, absoluteChar);
        setReadThroughIndex(Math.max(0, wordIndex - 1));
        setActiveWordIndex(wordIndex);
        resumeFromIndexRef.current = wordIndex;
        startCharRef.current = tokens[wordIndex]?.start ?? absoluteChar;
      }
    };

    utterance.onstart = () => {
      setStatus("playing");
      setErrorMessage(null);
      startChromeKeepAlive();
      window.setTimeout(() => {
        if (!boundaryFiredRef.current) {
          startFallbackHighlightFrom(resumeFromIndexRef.current);
        }
      }, 500);
    };

    utterance.onend = () => {
      absoluteCharOffsetRef.current = chunkStart + next.length + 1;
      if (chunkQueueRef.current.length > 0) {
        speakNextChunk();
      } else {
        clearFallbackTimer();
        clearKeepAlive();
        setStatus("idle");
        setReadThroughIndex(tokens.length - 1);
        setActiveWordIndex(-1);
      }
    };

    utterance.onerror = () => {
      clearFallbackTimer();
      clearKeepAlive();
      chunkQueueRef.current = [];
      setStatus("error");
      setErrorMessage("Story playback couldn't start. You can still read the narrative below.");
      setActiveWordIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  }, [
    clearFallbackTimer,
    clearKeepAlive,
    rate,
    startChromeKeepAlive,
    startFallbackHighlightFrom,
    supported,
    tokens,
  ]);

  const play = useCallback(() => {
    if (!supported || !narrative.trim()) return;

    // Speak synchronously inside the click handler so browsers keep user activation.
    window.speechSynthesis.cancel();
    clearFallbackTimer();
    clearKeepAlive();
    setErrorMessage(null);
    absoluteCharOffsetRef.current = 0;
    startCharRef.current = 0;
    resumeFromIndexRef.current = 0;
    setActiveWordIndex(0);
    setReadThroughIndex(-1);

    chunkQueueRef.current = chunkNarrativeForSpeech(narrative);
    if (chunkQueueRef.current.length === 0) return;

    setStatus("playing");
    speakNextChunk();
  }, [clearFallbackTimer, clearKeepAlive, narrative, speakNextChunk, supported]);

  const pause = useCallback(() => {
    if (!supported || status !== "playing") return;
    clearFallbackTimer();
    clearKeepAlive();
    const pausedIndex = activeWordIndex >= 0 ? activeWordIndex : resumeFromIndexRef.current;
    resumeFromIndexRef.current = pausedIndex;
    startCharRef.current = tokens[pausedIndex]?.start ?? 0;
    window.speechSynthesis.pause();
    setStatus("paused");
    setReadThroughIndex((prev) => Math.max(prev, pausedIndex));
  }, [activeWordIndex, clearFallbackTimer, clearKeepAlive, status, supported, tokens]);

  const resume = useCallback(() => {
    if (!supported) return;

    if (status === "paused" && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatus("playing");
      startChromeKeepAlive();
      startFallbackHighlightFrom(resumeFromIndexRef.current);
      return;
    }

    if (status === "paused") {
      const remaining = narrative.slice(startCharRef.current);
      chunkQueueRef.current = chunkNarrativeForSpeech(remaining);
      absoluteCharOffsetRef.current = startCharRef.current;
      setStatus("playing");
      speakNextChunk();
    }
  }, [
    narrative,
    speakNextChunk,
    startChromeKeepAlive,
    startFallbackHighlightFrom,
    status,
    supported,
  ]);

  useEffect(
    () => () => {
      clearFallbackTimer();
      clearKeepAlive();
      if (isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
      }
    },
    [clearFallbackTimer, clearKeepAlive],
  );

  useEffect(() => {
    stop();
  }, [narrative, stop]);

  return {
    tokens,
    status,
    activeWordIndex,
    readThroughIndex,
    supported,
    errorMessage,
    play,
    pause,
    resume,
    stop,
  };
}
