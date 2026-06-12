'use client';

import AuthHeader from '@/components/AuthHeader';

interface MarketingPageShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function MarketingPageShell({ children, title, subtitle }: MarketingPageShellProps) {
  return (
    <div
      data-theme="challenge"
      className="min-h-screen bg-gradient-to-b from-challenge-bg-start to-challenge-bg-end text-slate-100 p-8 relative overflow-hidden"
    >
      <div className="absolute inset-0 challenge-glow pointer-events-none" aria-hidden="true" />
      <AuthHeader theme="challenge" />

      <div className="max-w-3xl mx-auto px-4 md:px-0 pt-28 md:pt-32">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-3 text-slate-400 text-sm md:text-lg">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
