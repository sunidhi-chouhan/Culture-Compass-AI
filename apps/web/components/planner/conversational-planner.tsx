"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, Sparkles, Send } from "lucide-react";
import type { Location } from "@culturecompass/shared";
import {
  ASSISTANT_PROMPTS,
  BUDGET_OPTIONS,
  buildReviewPreferences,
  COMPANION_OPTIONS,
  DURATION_OPTIONS,
  getEditModePrompt,
  getNextPlannerStep,
  getPreviousPlannerStep,
  PLANNER_INTERESTS,
  PLANNER_STEPS,
  trimMessagesToStep,
  type EditablePlannerStep,
  type PlannerAnswers,
  type PlannerStep,
  formatUserAnswer,
} from "@/lib/planner-constants";
import { LocationSearch } from "@/components/location/location-search";
import { PlannerEditModeBanner } from "@/components/planner/planner-edit-mode-banner";
import { PlannerReviewSummary } from "@/components/planner/planner-review-summary";
import { PlannerStepNavigation } from "@/components/planner/planner-step-navigation";
import {
  getPlannerStepIndex,
  initializePlannerState,
  type PlannerChatMessage,
} from "@/lib/initialize-planner-state";
import { writePlannerLocation } from "@/lib/planner-location";
import { plannerStepToStage } from "@/lib/journey-stages";
import { JourneyStageRail } from "@/components/journey/journey-stage-rail";

interface ConversationalPlannerProps {
  initialDestination?: string;
  initialLocation?: Location | null;
  /** Landing entry: create (default) or improve-my-plan path. */
  entryMode?: "create" | "improve";
  onGenerate: (answers: PlannerAnswers) => void;
  generating?: boolean;
}

export function ConversationalPlanner({
  initialDestination = "",
  initialLocation = null,
  entryMode = "create",
  onGenerate,
  generating = false,
}: ConversationalPlannerProps) {
  const [plannerInit] = useState(() =>
    initializePlannerState({
      initialDestination,
      initialLocation,
      entryMode,
      storage: typeof window !== "undefined" ? sessionStorage : null,
    }),
  );

  const [step, setStep] = useState<PlannerStep>(plannerInit.step);
  const [answers, setAnswers] = useState<PlannerAnswers>(plannerInit.answers);
  const [messages, setMessages] = useState<PlannerChatMessage[]>(plannerInit.messages);
  const [destinationInput, setDestinationInput] = useState(plannerInit.destinationInput);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(
    plannerInit.destinationLocation,
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSource, setEditSource] = useState<"review" | "back" | null>(null);
  const [editSessionId, setEditSessionId] = useState(0);
  const editSnapshotRef = useRef<PlannerAnswers | null>(null);
  const destinationSnapshotRef = useRef<{
    input: string;
    location: Location | null;
  } | null>(null);
  const messagesSnapshotRef = useRef<PlannerChatMessage[] | null>(null);
  const returnStepRef = useRef<PlannerStep | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const suppressAutoScrollRef = useRef(false);
  const pendingScrollRestoreRef = useRef<number | null>(null);
  const [entranceMessageIds, setEntranceMessageIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const stepIndex = getPlannerStepIndex(step);
  const previousStep = getPreviousPlannerStep(step);
  const reviewPreferences = buildReviewPreferences(answers);
  const canGoBack =
    previousStep !== null && (!isEditMode || editSource === "back");
  const editableStep = step !== "generate" ? (step as EditablePlannerStep) : null;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    });
  }, []);

  useLayoutEffect(() => {
    if (pendingScrollRestoreRef.current === null) return;
    const top = pendingScrollRestoreRef.current;
    pendingScrollRestoreRef.current = null;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = top;
    }
  });

  useEffect(() => {
    if (suppressAutoScrollRef.current) {
      suppressAutoScrollRef.current = false;
      return;
    }
    scrollToBottom();
  }, [messages, step, scrollToBottom]);

  useEffect(() => {
    if (entranceMessageIds.size === 0) return;
    const timeoutId = window.setTimeout(() => {
      setEntranceMessageIds(new Set());
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [entranceMessageIds]);

  function withoutAutoScroll(update: () => void) {
    pendingScrollRestoreRef.current = scrollRef.current?.scrollTop ?? 0;
    suppressAutoScrollRef.current = true;
    update();
  }

  function commitStepAndNavigate(
    current: PlannerStep,
    updatedAnswers: PlannerAnswers,
    navigateTo: PlannerStep,
  ) {
    const answerText = formatUserAnswer(current, updatedAnswers);
    const userPrefix = `user-${current}`;
    const userMessage: PlannerChatMessage = {
      id: `${userPrefix}-${Date.now()}`,
      role: "user",
      text: answerText,
    };
    const followUpMessage: PlannerChatMessage =
      navigateTo === "generate"
        ? {
            id: "ready",
            role: "assistant",
            text: "Wonderful. I have everything I need to shape your journey — review it below, then build when you're ready.",
          }
        : {
            id: `q-${navigateTo}`,
            role: "assistant",
            text: ASSISTANT_PROMPTS[navigateTo as Exclude<PlannerStep, "generate">],
          };

    setEntranceMessageIds(new Set([userMessage.id, followUpMessage.id]));
    setMessages((prev) => {
      const existingUserIdx = prev.findIndex((message) => message.id.startsWith(userPrefix));
      const base = existingUserIdx >= 0 ? prev.slice(0, existingUserIdx) : prev;
      return [...base, userMessage, followUpMessage];
    });
    setStep(navigateTo);
  }

  function clearEditSnapshot() {
    editSnapshotRef.current = null;
    destinationSnapshotRef.current = null;
    messagesSnapshotRef.current = null;
    returnStepRef.current = null;
  }

  function snapshotForEdit(returnStep: PlannerStep) {
    editSnapshotRef.current = {
      ...answers,
      interests: [...answers.interests],
    };
    destinationSnapshotRef.current = {
      input: destinationInput,
      location: destinationLocation,
    };
    messagesSnapshotRef.current = messages;
    returnStepRef.current = returnStep;
  }

  function normalizeAnswersForStep(
    current: PlannerStep,
    updatedAnswers: PlannerAnswers,
  ): PlannerAnswers {
    if (current === "duration" && updatedAnswers.duration !== "Custom") {
      return { ...updatedAnswers, customDuration: "" };
    }
    return updatedAnswers;
  }

  function completeStep(current: PlannerStep, updatedAnswers: PlannerAnswers) {
    const nextAnswers = normalizeAnswersForStep(current, updatedAnswers);
    setAnswers(nextAnswers);

    if (isEditMode) {
      const source = editSource;
      setIsEditMode(false);
      setEditSource(null);
      clearEditSnapshot();

      if (source === "review") {
        commitStepAndNavigate(current, nextAnswers, "generate");
        return;
      }

      const nextStep = getNextPlannerStep(current) ?? "generate";
      commitStepAndNavigate(current, nextAnswers, nextStep);
      return;
    }

    const currentIdx = getPlannerStepIndex(current);
    const nextStep = PLANNER_STEPS[currentIdx + 1];
    const navigateTo = !nextStep || nextStep === "generate" ? "generate" : nextStep;
    commitStepAndNavigate(current, nextAnswers, navigateTo);
  }

  function cancelEdit() {
    withoutAutoScroll(() => {
      if (editSnapshotRef.current) {
        setAnswers(editSnapshotRef.current);
      }
      if (destinationSnapshotRef.current) {
        setDestinationInput(destinationSnapshotRef.current.input);
        setDestinationLocation(destinationSnapshotRef.current.location);
      }
      if (messagesSnapshotRef.current) {
        setMessages(messagesSnapshotRef.current);
      }

      const returnTo =
        editSource === "back" ? (returnStepRef.current ?? "generate") : "generate";

      setIsEditMode(false);
      setEditSource(null);
      clearEditSnapshot();
      setEditSessionId((id) => id + 1);
      setStep(returnTo);
    });
  }

  function goBack() {
    const prev = getPreviousPlannerStep(step);
    if (!prev || prev === "generate") return;
    if (isEditMode && editSource !== "back") return;

    const target = prev as EditablePlannerStep;

    withoutAutoScroll(() => {
      if (!isEditMode) {
        snapshotForEdit(step);
        setEditSource("back");
        setIsEditMode(true);
      }

      setMessages((prevMessages) => trimMessagesToStep(prevMessages, target));
      setStep(target);
      setEditSessionId((id) => id + 1);
    });
  }

  function startEditFromReview(target: EditablePlannerStep) {
    withoutAutoScroll(() => {
      snapshotForEdit("generate");
      setEditSource("review");
      setIsEditMode(true);
      setMessages((prevMessages) => trimMessagesToStep(prevMessages, target));
      setStep(target);
      setEditSessionId((id) => id + 1);
    });
  }

  function handleDestinationContinue(override?: string) {
    const dest = override !== undefined ? override : destinationInput;
    const location = override !== undefined ? null : destinationLocation;
    const updated = {
      ...answers,
      destination: dest,
      destinationLocation: location,
    };

    if (override !== undefined) {
      setDestinationInput(override);
      setDestinationLocation(null);
    }

    if (typeof window !== "undefined") {
      writePlannerLocation(sessionStorage, location, dest);
    }

    completeStep("destination", updated);
  }

  function handleInterestsContinue() {
    if (answers.interests.length === 0) return;
    completeStep("interests", answers);
  }

  function toggleInterest(interest: (typeof PLANNER_INTERESTS)[number]) {
    setAnswers((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  }

  function selectCompanion(companion: (typeof COMPANION_OPTIONS)[number]) {
    setAnswers((prev) => ({ ...prev, companion }));
  }

  function handleCompanionsContinue() {
    if (!answers.companion) return;
    completeStep("companions", answers);
  }

  function selectBudget(budget: (typeof BUDGET_OPTIONS)[number]["id"]) {
    setAnswers((prev) => ({ ...prev, budget }));
  }

  function handleBudgetContinue() {
    if (!answers.budget) return;
    completeStep("budget", answers);
  }

  function selectDuration(duration: (typeof DURATION_OPTIONS)[number]) {
    setAnswers((prev) => ({ ...prev, duration }));
  }

  function handleDurationContinue() {
    if (!answers.duration) return;
    if (answers.duration === "Custom" && !answers.customDuration.trim()) return;
    completeStep("duration", answers);
  }

  const stage = plannerStepToStage(step, { generating });

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] flex-col">
      <div className="theme-divider border-b px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="glass-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
              <Compass className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="theme-text text-sm font-semibold">JourneyMind</p>
              <p className="theme-text-subtle text-xs" aria-live="polite">
                {isEditMode
                  ? "Updating your journey"
                  : step === "generate"
                    ? generating
                      ? "Generate · building your journey"
                      : "Review your trip context"
                    : `Create · Step ${Math.min(stepIndex + 1, 5)} of 5`}
              </p>
            </div>
          </div>
        </div>
        <JourneyStageRail current={stage} compact className="mt-3" />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        role="log"
        aria-label="Conversation with JourneyMind"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const shouldAnimate = entranceMessageIds.has(msg.id);
              return (
              <motion.div
                key={msg.id}
                initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
                    <Compass className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:text-base ${
                    msg.role === "assistant"
                      ? "glass-card rounded-bl-md"
                      : "rounded-br-md"
                  }`}
                  style={
                    msg.role === "user"
                      ? {
                          background: "var(--accent)",
                          color: "var(--accent-foreground)",
                        }
                      : undefined
                  }
                >
                  {msg.text}
                </div>
              </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="theme-divider relative overflow-visible border-t px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-2xl overflow-visible">
          {isEditMode && editableStep && (
            <div className="pointer-events-none absolute inset-x-4 bottom-full z-10 pb-3 sm:inset-x-6">
              <div className="pointer-events-auto mx-auto max-w-2xl">
                <PlannerEditModeBanner prompt={getEditModePrompt(editableStep)} />
              </div>
            </div>
          )}
          {step === "destination" && (
              <div className="space-y-3 overflow-visible">
                <LocationSearch
                  key={`destination-search-${editSessionId}`}
                  variant="planner"
                  placeholder="Search a city or region…"
                  initialText={destinationInput}
                  initialLocation={destinationLocation}
                  onInputTextChange={setDestinationInput}
                  onLocationChange={setDestinationLocation}
                  onEnterPress={() => handleDestinationContinue()}
                />
                <button
                  type="button"
                  onClick={() => handleDestinationContinue("")}
                  className="theme-chip text-sm"
                >
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
                  Surprise me
                </button>
                <PlannerStepNavigation
                  isEditMode={isEditMode}
                  allowBackWhileEditing={editSource === "back"}
                  showBack={canGoBack}
                  onBack={goBack}
                  onCancel={cancelEdit}
                  onContinue={() => handleDestinationContinue()}
                />
              </div>
            )}

            {step === "interests" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Interests">
                  {PLANNER_INTERESTS.map((interest) => {
                    const selected = answers.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleInterest(interest)}
                        className={`theme-chip ${selected ? "theme-chip-active" : ""}`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
                <PlannerStepNavigation
                  isEditMode={isEditMode}
                  allowBackWhileEditing={editSource === "back"}
                  showBack={canGoBack}
                  onBack={goBack}
                  onCancel={cancelEdit}
                  onContinue={handleInterestsContinue}
                  continueDisabled={answers.interests.length === 0}
                />
              </div>
            )}

            {step === "companions" && (
              <div className="space-y-3">
                <div
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                  role="group"
                  aria-label="Travel companions"
                >
                  {COMPANION_OPTIONS.map((option) => (
                    <motion.button
                      key={option}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectCompanion(option)}
                      className={`glass-card rounded-2xl px-4 py-4 text-sm font-medium transition-colors hover:border-[var(--accent)] ${
                        answers.companion === option ? "ring-2 ring-[var(--accent)]" : ""
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
                <PlannerStepNavigation
                  isEditMode={isEditMode}
                  allowBackWhileEditing={editSource === "back"}
                  showBack={canGoBack}
                  onBack={goBack}
                  onCancel={cancelEdit}
                  onContinue={handleCompanionsContinue}
                  continueDisabled={!answers.companion}
                />
              </div>
            )}

            {step === "budget" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Budget">
                  {BUDGET_OPTIONS.map((option) => (
                    <motion.button
                      key={option.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectBudget(option.id)}
                      className={`glass-card flex flex-col items-center rounded-2xl px-3 py-4 transition-colors hover:border-[var(--accent)] ${
                        answers.budget === option.id ? "ring-2 ring-[var(--accent)]" : ""
                      }`}
                    >
                      <span className="theme-text text-lg font-semibold">{option.label}</span>
                      <span className="theme-text-subtle mt-1 text-xs">{option.description}</span>
                    </motion.button>
                  ))}
                </div>
                <PlannerStepNavigation
                  isEditMode={isEditMode}
                  allowBackWhileEditing={editSource === "back"}
                  showBack={canGoBack}
                  onBack={goBack}
                  onCancel={cancelEdit}
                  onContinue={handleBudgetContinue}
                  continueDisabled={!answers.budget}
                />
              </div>
            )}

            {step === "duration" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Duration">
                  {DURATION_OPTIONS.map((option) => (
                    <motion.button
                      key={option}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectDuration(option)}
                      className={`glass-card rounded-2xl px-3 py-4 text-sm font-medium transition-colors hover:border-[var(--accent)] ${
                        answers.duration === option ? "ring-2 ring-[var(--accent)]" : ""
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
                {answers.duration === "Custom" && (
                  <input
                    type="text"
                    value={answers.customDuration}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, customDuration: e.target.value }))
                    }
                    placeholder="e.g. 10 days"
                    className="theme-input w-full"
                    aria-label="Custom duration"
                  />
                )}
                <PlannerStepNavigation
                  isEditMode={isEditMode}
                  allowBackWhileEditing={editSource === "back"}
                  showBack={canGoBack}
                  onBack={goBack}
                  onCancel={cancelEdit}
                  onContinue={handleDurationContinue}
                  continueDisabled={
                    !answers.duration ||
                    (answers.duration === "Custom" && !answers.customDuration.trim())
                  }
                />
              </div>
            )}

            {step === "generate" && (
              <div className="space-y-3">
                <PlannerReviewSummary
                  preferences={reviewPreferences}
                  onEditStep={startEditFromReview}
                />
                <PlannerStepNavigation showBack={canGoBack} onBack={goBack} />
                <motion.button
                  type="button"
                  disabled={generating}
                  onClick={() => onGenerate(answers)}
                  whileHover={{ scale: generating ? 1 : 1.01 }}
                  whileTap={{ scale: generating ? 1 : 0.98 }}
                  className="cta-glow flex w-full items-center justify-center gap-2.5 rounded-full py-4 text-base font-semibold shadow-lg disabled:opacity-60"
                  aria-busy={generating}
                >
                  {generating ? (
                    <>Shaping your journey…</>
                  ) : (
                    <>
                      <Send className="h-5 w-5" aria-hidden="true" />
                      Build my journey
                    </>
                  )}
                </motion.button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
