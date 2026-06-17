"use client";

import { useState } from "react";
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

/** Embossed "access-pass" tile holding one character of the room code. */
function CodeTile({
  char,
  hidden,
  index,
  waveKey,
  reduceMotion,
}: {
  char: string;
  hidden: boolean;
  index: number;
  waveKey: number;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.span
      // A changing waveKey (copy success) ripples a quick press across tiles
      // left-to-right via a per-tile stagger.
      key={`tile-${index}-${waveKey}`}
      initial={false}
      animate={
        reduceMotion || waveKey === 0 ? { scale: 1 } : { scale: [1, 1.08, 1] }
      }
      transition={
        reduceMotion ? { duration: 0 } : { ...spring.pop, delay: index * 0.03 }
      }
      className="relative flex h-12 w-11 items-center justify-center overflow-hidden rounded-[var(--r-sm)] bg-[var(--glass-2)] font-display text-2xl text-[var(--color-text)] shadow-[var(--shadow-sm),inset_0_1px_0_var(--glass-border)] sm:h-14 sm:w-14 sm:text-3xl"
    >
      {/* Char ↔ redaction cross-fade so masking reads as a deliberate flip. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={hidden ? "dot" : `char-${char}`}
          className="tnum"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateX: -90 }}
          animate={{ opacity: 1, rotateX: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateX: 90 }}
          transition={reduceMotion ? { duration: 0.12 } : spring.pop}
        >
          {hidden ? "•" : char}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

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
  // Monotonic counter so each copy triggers a fresh ripple, not just the first.
  const [waveKey, setWaveKey] = useState(0);

  const handleCopyCode = () => {
    setWaveKey((k) => k + 1);
    onCopyCode();
  };

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
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={hidden ? "closed" : "open"}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
              transition={reduceMotion ? { duration: 0.12 } : spring.pop}
              className="flex"
            >
              <Icon icon={hidden ? "solar:eye-closed-bold" : "solar:eye-bold"} width={22} height={22} />
            </motion.span>
          </AnimatePresence>
        </button>

        {/* Access-pass: concentric r-md wrapper around the embossed r-sm tiles. */}
        <button
          type="button"
          onClick={handleCopyCode}
          aria-label="Copiar código"
          className="flex flex-col items-center gap-1.5 rounded-[var(--r-md)] p-1.5 transition-transform duration-[var(--t-quick)] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
        >
          <span className="flex gap-1.5 sm:gap-2" style={{ perspective: 600 }}>
            {code.split("").map((char, index) => (
              <CodeTile
                key={`${char}-${index}`}
                char={char}
                hidden={hidden}
                index={index}
                waveKey={waveKey}
                reduceMotion={reduceMotion}
              />
            ))}
          </span>
          {/* Perforated tear rule — the pass reads as detachable / shareable. */}
          <span
            aria-hidden
            className="h-px w-full rounded-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, var(--glass-border) 0 6px, transparent 6px 11px)",
            }}
          />
        </button>

        <div className="flex items-center gap-2">
          <button type="button" onClick={handleCopyCode} aria-label="Copiar código" className={iconButton}>
            <motion.span
              key={copied ? "copied" : "copy"}
              initial={reduceMotion ? false : { scale: copied ? 0.7 : 1 }}
              animate={{ scale: 1, color: copied ? "var(--color-safe)" : "var(--color-text-muted)" }}
              transition={reduceMotion ? { duration: 0 } : spring.pop}
              className="flex"
            >
              <Icon icon={copied ? "solar:clipboard-check-bold" : "solar:copy-bold"} width={22} height={22} />
            </motion.span>
          </button>
          <button type="button" onClick={onShare} aria-label="Compartilhar link" className={iconButton}>
            <motion.span
              key={linkCopied ? "linked" : "share"}
              initial={reduceMotion ? false : { scale: linkCopied ? 0.7 : 1 }}
              animate={{ scale: 1, color: linkCopied ? "var(--color-safe)" : "var(--color-text-muted)" }}
              transition={reduceMotion ? { duration: 0 } : spring.pop}
              className="flex"
            >
              <Icon icon={linkCopied ? "solar:check-circle-bold" : "solar:share-bold"} width={22} height={22} />
            </motion.span>
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
