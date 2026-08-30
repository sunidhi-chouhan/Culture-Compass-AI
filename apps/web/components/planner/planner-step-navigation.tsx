import { ArrowRight } from "lucide-react";

interface PlannerStepNavigationProps {
  isEditMode?: boolean;
  /** When editing via Back, allow stepping further back while Cancel remains available. */
  allowBackWhileEditing?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onCancel?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}

export function PlannerStepNavigation({
  isEditMode = false,
  allowBackWhileEditing = false,
  showBack = false,
  onBack,
  onCancel,
  onContinue,
  continueLabel,
  continueDisabled = false,
}: PlannerStepNavigationProps) {
  const resolvedContinueLabel =
    continueLabel ?? (isEditMode ? "Save & Continue" : "Continue");
  const showCancel = isEditMode && Boolean(onCancel);
  const showBackButton =
    showBack && Boolean(onBack) && (!isEditMode || allowBackWhileEditing);

  if (!showCancel && !showBackButton && !onContinue) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <div className="flex min-w-0 items-center gap-3">
        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="theme-text-subtle shrink-0 text-sm transition-colors hover:text-[var(--foreground)]"
          >
            Cancel
          </button>
        )}
        {showBackButton && (
          <button
            type="button"
            onClick={onBack}
            className="theme-text-subtle shrink-0 text-sm transition-colors hover:text-[var(--foreground)]"
          >
            ← Back
          </button>
        )}
        {!showCancel && !showBackButton && (
          <span className="hidden sm:block sm:w-0" aria-hidden="true" />
        )}
      </div>

      {onContinue && (
        <button
          type="button"
          disabled={continueDisabled}
          onClick={onContinue}
          className="cta-glow ml-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {resolvedContinueLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
