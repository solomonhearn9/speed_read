'use client';

interface XPBarProps {
  current: number;
  max: number;
  label?: string;
  className?: string;
}

export default function XPBar({ current, max, label, className = '' }: XPBarProps) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  return (
    <div className={className}>
      {(label || max > 0) && (
        <div className="flex justify-between text-xs text-content-muted mb-1.5">
          {label && <span>{label}</span>}
          <span className="tabular-nums font-medium text-content-secondary">
            {current} / {max} XP
          </span>
        </div>
      )}
      <div className="w-full h-2.5 bg-surface-secondary rounded-full overflow-hidden border border-line">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
