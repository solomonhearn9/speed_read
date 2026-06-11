'use client';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        {title && (
          <h2 className="text-xl font-semibold mb-4 text-white">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
