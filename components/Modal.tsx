'use client';

export type ModalTheme = 'challenge' | 'learning';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  theme?: ModalTheme;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  theme = 'challenge',
}: ModalProps) {
  if (!isOpen) return null;

  const isLearning = theme === 'learning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 ${
          isLearning
            ? 'bg-slate-900/40 backdrop-blur-sm'
            : 'bg-challenge-bg-start/85 backdrop-blur-md'
        }`}
        onClick={onClose}
      />
      <div
        className={`relative rounded-xl p-6 w-full max-w-md ${
          isLearning
            ? 'surface-card text-content-primary shadow-elevated'
            : 'challenge-surface text-slate-100 shadow-elevated'
        }`}
      >
        {title && (
          <h2
            className={`text-xl font-bold mb-4 tracking-tight ${
              isLearning ? 'text-content-primary' : 'text-white'
            }`}
          >
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
