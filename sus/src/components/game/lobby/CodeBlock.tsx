"use client";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { spring } from "@/lib/motion";

type CodeBlockProps = {
  code: string;
  hidden: boolean;
  copied: boolean;
  linkCopied: boolean;
  onToggleHidden: () => void;
  onCopyCode: () => void;
  onShare: () => void;
};

const iconButton =
  "flex h-10 w-10 items-center justify-center rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-1)] text-[var(--color-text-muted)] transition-[transform,background-color,color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] hover:text-[var(--color-text)] active:scale-[0.92] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]";

/**
 * Room-code display + copy + visibility toggle.
 *
 * The eye toggle only masks the digits on screen — copy and share stay enabled
 * while hidden, and a hint reminds the host the code is still copyable.
 */
export default function CodeBlock({
  code,
  hidden,
  copied,
  linkCopied,
  onToggleHidden,
  onCopyCode,
  onShare,
}: CodeBlockProps) {
  const reduceMotion = useReducedMotion();
  const confirmation = copied ? "Código copiado!" : linkCopied ? "Link copiado!" : null;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <span className="font-condensed text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
        Código da Sala
      </span>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onToggleHidden}
          aria-label={hidden ? "Mostrar código" : "Ocultar código"}
          aria-pressed={hidden}
          className={iconButton}
        >
          <Icon icon={hidden ? "solar:eye-closed-bold" : "solar:eye-bold"} width={22} height={22} />
        </button>

        <button
          type="button"
          onClick={onCopyCode}
          aria-label="Copiar código"
          className="flex gap-1.5 rounded-[var(--r-md)] p-0.5 transition-transform duration-[var(--t-quick)] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] sm:gap-2"
        >
          {code.split("").map((char, index) => (
            <span
              key={`${char}-${index}`}
              className="tnum flex h-12 w-11 items-center justify-center rounded-[var(--r-sm)] border border-[var(--glass-border)] bg-[var(--glass-2)] font-display text-2xl text-[var(--color-text)] shadow-[var(--shadow-sm)] sm:h-14 sm:w-14 sm:text-3xl"
            >
              {hidden ? "•" : char}
            </span>
          ))}
        </button>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onCopyCode} aria-label="Copiar código" className={iconButton}>
            <Icon icon={copied ? "solar:clipboard-check-bold" : "solar:copy-bold"} width={22} height={22} />
          </button>
          <button type="button" onClick={onShare} aria-label="Compartilhar link" className={iconButton}>
            <Icon icon={linkCopied ? "solar:check-circle-bold" : "solar:share-bold"} width={22} height={22} />
          </button>
        </div>
      </div>

      <div className="flex h-5 items-center justify-center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {confirmation ? (
            <motion.span
              key={confirmation}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={spring.pop}
              className="font-body text-sm text-[var(--color-safe)]"
            >
              {confirmation}
            </motion.span>
          ) : (
            <motion.span
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-body text-xs text-[var(--text-dim)]"
            >
              Toque no código para copiar
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
