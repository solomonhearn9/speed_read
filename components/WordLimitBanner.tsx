'use client';

interface WordLimitBannerProps {
  message: string;
  onUpgrade?: () => void;
}

export default function WordLimitBanner({ message, onUpgrade }: WordLimitBannerProps) {
  return (
    <div className="mb-4 p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg text-amber-200 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <span>{message}</span>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="text-amber-100 underline hover:no-underline text-sm whitespace-nowrap"
        >
          Upgrade for unlimited
        </button>
      )}
    </div>
  );
}
