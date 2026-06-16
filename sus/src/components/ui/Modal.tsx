"use client";

/**
 * Modal — shared dialog primitive built on @base-ui/react Dialog.
 *
 * Z-INDEX CONTRACT (canonical modal layer):
 *   backdrop → z-[100]
 *   viewport → z-[100]
 * All migrated modals should use <Modal> instead of ad-hoc fixed/z-* layers.
 */

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModalSize = "sm" | "md" | "lg";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: ModalSize;
  /** Extra classes applied to the glass panel */
  className?: string;
};

// ---------------------------------------------------------------------------
// Size → max-width map
// ---------------------------------------------------------------------------

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-[28rem]",
  md: "max-w-[36rem]",
  lg: "max-w-[48rem]",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Dialog.Portal>
        {/* Backdrop — fades in/out via data-starting-style / data-ending-style */}
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-[100]",
            "bg-black/60 backdrop-blur-[var(--blur-sm)]",
            // Enter: opacity-0 → 1   Exit: opacity-1 → 0
            "transition-opacity duration-[var(--t-quick)] ease-[var(--ease-out)]",
            "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
            "motion-reduce:transition-none"
          )}
        />

        {/* Viewport — centers the popup */}
        <Dialog.Viewport
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4"
        >
          {/* Glass panel popup */}
          <Dialog.Popup
            className={cn(
              // Sizing
              "w-[min(92vw,100%)]",
              sizeClass[size],
              "max-h-[88vh] overflow-y-auto",
              // Glass surface tokens
              "bg-[var(--glass-1)] border border-[var(--glass-border)]",
              "backdrop-blur-[var(--blur-lg)]",
              "shadow-[var(--shadow-lg)]",
              "rounded-[var(--r-xl)]",
              "text-[var(--color-text)]",
              // Enter: scale-95 + translateY-2 + opacity-0 → normal
              // Exit: reverses
              "transition-[opacity,transform] duration-[var(--t-base)] ease-[var(--ease-out)]",
              "data-[starting-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:translate-y-2",
              "data-[ending-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:translate-y-2",
              "motion-reduce:transition-none",
              "motion-reduce:data-[starting-style]:scale-100 motion-reduce:data-[starting-style]:translate-y-0",
              "motion-reduce:data-[ending-style]:scale-100 motion-reduce:data-[ending-style]:translate-y-0",
              className
            )}
          >
            {/* Header row — only rendered when title is provided */}
            {title != null && (
              <div className="flex items-center justify-between gap-4 p-5 pb-0 sm:p-6 sm:pb-0">
                <Dialog.Title className="font-display text-2xl sm:text-3xl text-[var(--color-text)]">
                  {title}
                </Dialog.Title>

                <CloseButton />
              </div>
            )}

            {/* Close button in top-right when no title */}
            {title == null && (
              <div className="flex justify-end p-3 pb-0">
                <CloseButton />
              </div>
            )}

            {/* Content area */}
            <div className="p-5 sm:p-6">
              {children}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------------------
// Internal close button — extracted for reuse in both layout branches
// ---------------------------------------------------------------------------

function CloseButton() {
  return (
    <Dialog.Close
      aria-label="Fechar"
      className={cn(
        // Min 44×44 hit area
        "flex h-11 w-11 shrink-0 items-center justify-center",
        "rounded-full",
        "bg-[var(--glass-1)] border border-[var(--glass-border)]",
        "text-[var(--color-text)]",
        "transition-[opacity,background-color] duration-[var(--t-quick)] ease-[var(--ease-out)]",
        "hover:bg-[var(--glass-2)]",
        // Focus ring token
        "focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
      )}
    >
      <X size={20} strokeWidth={2} aria-hidden />
    </Dialog.Close>
  );
}
