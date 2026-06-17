"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { THEME_ICON_MAP } from "@/lib/themeIcons";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Burst } from "@/components/ui/Burst";
import { staggerContainer, staggerItem, spring } from "@/lib/motion";
import { playSound } from "@/lib/sound";

type ThemePackOption = {
  key: string;
  title: string;
  icon: string;
  source: "default" | "custom";
  count: number;
};

type ThemePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPackValue: string;
  packOptions: ThemePackOption[];
  isHost: boolean;
  onSelectPack: (value: string) => void;
};

// A small palette of swatch gradients; each pack maps to one deterministically
// from its key so every tile shows a stable, distinct "cenario" preview.
const SWATCH_GRADIENTS = [
  "linear-gradient(135deg, var(--color-imp), var(--color-special))",
  "linear-gradient(135deg, var(--color-info), var(--color-primary-2))",
  "linear-gradient(135deg, var(--color-safe), var(--color-info))",
  "linear-gradient(135deg, var(--color-special), var(--color-imp))",
  "linear-gradient(135deg, var(--color-gold), var(--color-warn))",
  "linear-gradient(135deg, var(--color-primary-1), var(--color-primary-2))",
  "linear-gradient(135deg, var(--color-warn), var(--color-imp))",
  "linear-gradient(135deg, var(--color-info), var(--color-safe))",
];

function hashIndex(input: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

export default function ThemePickerDialog({
  open,
  onOpenChange,
  selectedPackValue,
  packOptions,
  isHost,
  onSelectPack,
}: ThemePickerDialogProps) {
  const reduce = useReducedMotion() ?? false;
  const systemPackOptions = packOptions.filter((pack) => pack.source === "default");
  const customPackOptions = packOptions.filter((pack) => pack.source === "custom");

  // SIGNATURE pick beat: the just-tapped tile pops + bursts confetti, then the
  // selection is committed (parent closes the dialog) a beat later so the pop
  // reads. burstKey re-fires the keyed Burst even on the same tile.
  const [pickedValue, setPickedValue] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState(0);

  // Wrap onOpenChange so pickedValue is reset when the dialog is opened — prevents
  // a stale pick from the previous session re-bursting on a fresh open.
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setPickedValue(null);
    }
    onOpenChange(nextOpen);
  };

  const handlePick = (value: string) => {
    if (!isHost) return;
    playSound("ui.toggle");
    setPickedValue(value);
    setBurstKey((k) => k + 1);
    if (reduce) {
      onSelectPack(value);
      return;
    }
    // Let the chosen tile pop + burst before the parent dismisses the dialog.
    window.setTimeout(() => onSelectPack(value), 340);
  };

  const renderPackCard = (pack: ThemePackOption) => {
    const value =
      pack.source === "default" ? `default:${pack.key}` : `custom:${pack.key}`;
    const isSelected = selectedPackValue === value;
    const isPicking = pickedValue === value;
    const swatch = SWATCH_GRADIENTS[hashIndex(value, SWATCH_GRADIENTS.length)];
    const iconName = THEME_ICON_MAP[pack.icon] ?? "solar:star-bold";

    return (
      <motion.div
        key={value}
        variants={reduce ? undefined : staggerItem}
        transition={spring.gentle}
        className="relative"
      >
        {/* Confetti pops from the chosen tile center on pick. */}
        <Burst
          fire={isPicking ? burstKey : 0}
          colors={["var(--color-gold)", "var(--color-special)", "var(--color-safe)"]}
          count={16}
        />

        <motion.button
          type="button"
          disabled={!isHost}
          aria-pressed={isSelected}
          onClick={() => handlePick(value)}
          initial={false}
          animate={
            reduce
              ? undefined
              : isPicking
                ? { scale: [1, 1.06, 1], y: -4 }
                : { scale: 1, y: isSelected ? -2 : 0 }
          }
          transition={isPicking ? spring.pop : spring.gentle}
          whileHover={!isHost || reduce ? undefined : { y: -4, scale: 1.02 }}
          whileTap={!isHost || reduce ? undefined : { scale: 0.96 }}
          className={cn(
            "group relative flex min-h-32 w-full flex-col items-start justify-between overflow-hidden",
            "rounded-[var(--r-xl)] border px-4 py-4 text-left",
            "transition-[border-color,background-color,box-shadow] duration-[var(--t-quick)] ease-[var(--ease-out)]",
            "focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]",
            "disabled:cursor-default",
            isSelected
              ? "border-[color-mix(in_srgb,var(--color-special)_60%,transparent)] bg-[color-mix(in_srgb,var(--color-special)_14%,var(--glass-1))] shadow-[var(--shadow-md)]"
              : "border-[var(--glass-border)] bg-[var(--glass-1)] shadow-[var(--shadow-sm)] hover:border-[color-mix(in_srgb,var(--color-special)_40%,var(--glass-border))]"
          )}
        >
          {/* Live swatch wash — the "cenario" preview, brighter on hover/select. */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 transition-opacity duration-[var(--t-base)] ease-[var(--ease-out)]",
              isSelected ? "opacity-25" : "opacity-[0.14] group-hover:opacity-25"
            )}
            style={{ backgroundImage: swatch }}
          />

          {/* Top row: themed swatch icon tile + count chip. */}
          <div className="relative flex w-full items-start justify-between gap-3">
            <motion.span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-[var(--r-md)] border border-white/25 text-white shadow-[var(--shadow-sm)]"
              style={{ backgroundImage: swatch }}
              animate={
                reduce
                  ? undefined
                  : isSelected
                    ? { rotate: [-6, 0], scale: 1 }
                    : { rotate: 0, scale: 1 }
              }
              transition={spring.pop}
              whileHover={!isHost || reduce ? undefined : { rotate: -6, scale: 1.06 }}
            >
              <Icon icon={iconName} width={22} height={22} />
            </motion.span>

            <span
              className={cn(
                "tnum rounded-[var(--r-pill)] border px-2.5 py-1 font-condensed text-[11px] uppercase tracking-[0.18em]",
                isSelected
                  ? "border-[color-mix(in_srgb,var(--color-special)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-special)_18%,transparent)] text-[var(--color-special)]"
                  : "border-[var(--glass-border)] bg-[var(--glass-2)] text-[var(--color-text-muted)]"
              )}
            >
              {pack.count}
            </span>
          </div>

          {/* Bottom row: title + source label. */}
          <div className="relative mt-4 flex w-full items-end justify-between gap-3">
            <span className="font-display text-lg leading-tight text-[var(--color-text)]">
              {pack.title}
            </span>
            <span
              className={cn(
                "font-condensed text-[11px] uppercase tracking-[0.2em] transition-colors duration-[var(--t-quick)]",
                isSelected ? "text-[var(--color-special)]" : "text-[var(--text-dim)]"
              )}
            >
              {pack.source === "default" ? "Oficial" : "Meu pack"}
            </span>
          </div>

          {/* Selected ring — springs in over the tile. */}
          <AnimatePresence>
            {isSelected && (
              <motion.span
                key="ring"
                aria-hidden
                initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={reduce ? { duration: 0.12 } : spring.pop}
                className="pointer-events-none absolute inset-0 rounded-[var(--r-xl)] ring-2 ring-[var(--color-special)]"
              />
            )}
          </AnimatePresence>

          {/* Corner check — stamps in on the selected tile. */}
          <AnimatePresence>
            {isSelected && (
              <motion.span
                key="check"
                aria-hidden
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, rotate: -12 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={reduce ? { duration: 0.12 } : spring.pop}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-[var(--r-pill)] bg-[var(--color-special)] text-white shadow-[var(--shadow-sm)]"
              >
                <Icon icon="solar:check-read-bold" width={16} height={16} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={() => handleOpenChange(false)}
      size="lg"
      className="max-w-5xl"
    >
      <div className="-mt-1">
        {/* Eyebrow + heading + subline. */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0.15 } : spring.gentle}
        >
          <span className="inline-flex items-center gap-2 font-condensed text-[11px] uppercase tracking-[0.3em] text-[var(--color-special)]">
            <Icon icon="solar:gallery-wide-bold" width={14} height={14} aria-hidden />
            Escolha o cenário
          </span>
          <h2 className="mt-2 font-display text-3xl text-[var(--color-text)] sm:text-4xl">
            Escolha um Tema
          </h2>
          <p className="mt-1 font-body text-sm text-[var(--color-text-muted)] sm:text-base">
            Selecione um tema oficial ou um pack customizado para a próxima rodada.
          </p>
        </motion.div>

        <div className="custom-scrollbar mt-6 max-h-[60vh] overflow-y-auto pr-1">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-condensed text-[11px] uppercase tracking-[0.26em] text-[var(--color-text-muted)] sm:text-xs">
                Temas oficiais
              </span>
              <span className="font-body text-sm text-[var(--color-text-muted)]">
                {systemPackOptions.length} opções
              </span>
            </div>
            <motion.div
              variants={reduce ? undefined : staggerContainer}
              initial="initial"
              animate="animate"
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {systemPackOptions.map(renderPackCard)}
            </motion.div>
          </section>

          {customPackOptions.length > 0 && (
            <section className="mt-6 flex flex-col gap-3 border-t border-[var(--glass-border)] pt-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-condensed text-[11px] uppercase tracking-[0.26em] text-[var(--color-text-muted)] sm:text-xs">
                  Meus packs
                </span>
                <span className="font-body text-sm text-[var(--color-text-muted)]">
                  {customPackOptions.length} opções
                </span>
              </div>
              <motion.div
                variants={reduce ? undefined : staggerContainer}
                initial="initial"
                animate="animate"
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                {customPackOptions.map(renderPackCard)}
              </motion.div>
            </section>
          )}
        </div>
      </div>
    </Modal>
  );
}
