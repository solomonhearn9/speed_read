'use client';

import { ReactNode } from 'react';

interface AchievementCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'success' | 'default' | 'xp';
  children?: ReactNode;
  className?: string;
}

const variantStyles = {
  success: 'border-success/30 bg-success-light/50',
  xp: 'border-brand/30 bg-brand/5',
  default: 'border-line bg-surface-card',
};

export default function AchievementCard({
  eyebrow,
  title,
  subtitle,
  icon,
  variant = 'default',
  children,
  className = '',
}: AchievementCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 md:p-8 text-center shadow-elevated ${variantStyles[variant]} ${className}`}
    >
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-widest text-content-muted mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl md:text-3xl font-extrabold text-content-primary mb-1">{title}</h2>
      {subtitle && (
        <p className="text-content-secondary text-sm md:text-base mb-4">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
