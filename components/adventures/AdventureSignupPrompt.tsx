'use client';

interface AdventureSignupPromptProps {
  onSignup: () => void;
}

export default function AdventureSignupPrompt({ onSignup }: AdventureSignupPromptProps) {
  return (
    <div className="adventure-card border-amber-500/40 rounded-lg p-4 mb-6 text-center">
      <p className="text-amber-200 text-sm mb-3">
        Create a free account to save your XP and unlock Chapter 2.
      </p>
      <button
        onClick={onSignup}
        className="w-full px-6 py-3 adventure-btn-primary text-white font-semibold rounded-lg"
      >
        Sign Up Free
      </button>
    </div>
  );
}
