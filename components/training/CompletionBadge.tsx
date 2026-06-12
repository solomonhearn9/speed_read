'use client';

type CompletionVariant = 'completed' | 'mastered' | 'unlocked' | 'locked';

interface CompletionBadgeProps {
  variant: CompletionVariant;
  label?: string;
  className?: string;
}

const variantStyles: Record<CompletionVariant, string> = {
  mastered: 'bg-success-light text-green-700 border-green-200',
  completed: 'bg-brand/10 text-brand border-brand/20',
  unlocked: 'bg-surface-secondary text-brand border-brand/30',
  locked: 'bg-surface-secondary text-content-disabled border-line',
};

const defaultLabels: Record<CompletionVariant, string> = {
  mastered: 'Mastered',
  completed: 'Completed',
  unlocked: 'Ready',
  locked: 'Locked',
};

export default function CompletionBadge({ variant, label, className = '' }: CompletionBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-badge border whitespace-nowrap ${variantStyles[variant]} ${className}`}
    >
      {(variant === 'mastered' || variant === 'completed') && (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {label ?? defaultLabels[variant]}
    </span>
  );
}
