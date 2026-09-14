import { type ReactNode, useEffect, useRef } from 'react';
import { cn } from './cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Accessible modal built on the native <dialog> element (focus trap + Escape handled by the browser). */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'm-auto w-[min(28rem,calc(100vw-2rem))] rounded-[1.5rem] border border-line bg-surface p-6 text-ink shadow-2xl backdrop:bg-scrim/60',
        className,
      )}
    >
      <h2 className="mb-3 text-xl font-extrabold">{title}</h2>
      {children}
    </dialog>
  );
}
