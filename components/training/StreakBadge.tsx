'use client';

interface StreakBadgeProps {
  days: number;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StreakBadge({ days, size = 'md', className = '' }: StreakBadgeProps) {
  if (days <= 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-badge bg-warning-light text-amber-700 border border-warning/30 ${
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      } ${className}`}
    >
      <span aria-hidden="true">🔥</span>
      <span className="tabular-nums">{days} day{days !== 1 ? 's' : ''}</span>
    </span>
  );
}
