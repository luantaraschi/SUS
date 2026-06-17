"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useI18n } from "@/lib/I18nContext";
import { Check, Copy, ExternalLink, Heart, QrCode, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { QRCodeSVG } from "qrcode.react";
import { Burst } from "@/components/ui/Burst";
import { staggerContainer, staggerItem, spring } from "@/lib/motion";
import {
  GlassField,
  GlassInput,
  GlassLabel,
  GlassSection,
} from "./ui/glass";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PIX_KEY = "998f5509-a89d-4b95-8ae2-9bb00ca3c8ce";
const PIX_COPY_PASTE_CODE =
  "00020126880014BR.GOV.BCB.PIX0136998f5509-a89d-4b95-8ae2-9bb00ca3c8ce0226Muito obrigado pelo apoio!5204000053039865802BR5925Luan Antoni Taraschi Ramo6009SAO PAULO62140510qcsVJz4z986304252C";

// Warm gratitude palette for the heart accent + success burst.
const WARM_BURST = ["var(--color-imp)", "var(--color-gold)", "var(--color-special)"];

/**
 * SIGNATURE — a living heart that beats. Soft concentric glow rings pulse
 * outward on a loop; the heart itself does a double "lub-dub" scale. The whole
 * thing is purely decorative and freezes to a static glow under reduced motion.
 */
function BeatingHeart() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto mb-5 flex h-[88px] w-[88px] items-center justify-center">
      {/* Glow rings */}
      {!reduce &&
        [0, 0.9].map((delay, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute h-[64px] w-[64px] rounded-full"
            style={{
              border: "2px solid color-mix(in srgb, var(--color-imp) 55%, transparent)",
            }}
            initial={{ scale: 0.6, opacity: 0.55 }}
            animate={{ scale: 1.85, opacity: 0 }}
            transition={{ duration: 1.8, delay, repeat: Infinity, ease: "easeOut" }}
          />
        ))}

      {/* Soft ambient halo */}
      <span
        aria-hidden
        className="absolute h-[88px] w-[88px] rounded-full blur-xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-imp) 45%, transparent) 0%, transparent 70%)",
        }}
      />

      {/* Heart medallion */}
      <span
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-2)] shadow-[var(--shadow-md)]"
      >
        <motion.span
          className="inline-flex text-[var(--color-imp)]"
          initial={false}
          animate={
            reduce
              ? undefined
              : { scale: [1, 1.18, 1, 1.12, 1] }
          }
          transition={
            reduce
              ? undefined
              : {
                  duration: 1.8,
                  times: [0, 0.12, 0.24, 0.36, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          <Heart size={32} fill="currentColor" aria-hidden />
        </motion.span>
      </span>
    </div>
  );
}

/** Copy → Check icon morph that lives inside the PIX copy button. */
function CopyMorph({ copied }: { copied: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            className="absolute inline-flex"
            initial={reduce ? false : { scale: 0, rotate: -40, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0, rotate: 40, opacity: 0 }}
            transition={reduce ? { duration: 0 } : spring.pop}
          >
            <Check size={18} strokeWidth={2.6} aria-hidden />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            className="absolute inline-flex"
            initial={reduce ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : spring.pop}
          >
            <Copy size={18} aria-hidden />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { t, language } = useI18n();
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  // Bumped on each successful copy to retrigger the warm celebratory burst.
  const [burstKey, setBurstKey] = useState(0);

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_COPY_PASTE_CODE);
      setCopied(true);
      setBurstKey((k) => k + 1);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy PIX code:", error);
    }
  };

  const pressScale = reduce ? undefined : { scale: 0.96 };
  const hoverLift = reduce ? undefined : { y: -2 };

  return (
    <Modal open={isOpen} onClose={onClose} size="md">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-5"
      >
        {/* ============ Gratitude header ============ */}
        <motion.div
          variants={staggerItem}
          transition={spring.gentle}
          className="mx-auto max-w-lg text-center"
        >
          <BeatingHeart />

          <p className="inline-flex items-center gap-1.5 font-condensed text-[11px] uppercase tracking-[0.34em] text-[var(--color-text-muted)]">
            <Sparkles size={13} aria-hidden className="text-[var(--color-gold)]" />
            {language === "pt" ? "Apoie o SUS" : "Support the project"}
          </p>
          <h2 className="mt-3 font-display text-3xl text-[var(--color-text)] sm:text-4xl">
            {t("supportTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
            {t("supportMessage")}
          </p>
        </motion.div>

        {/* ============ PIX (PT only) ============ */}
        {language === "pt" && (
          <motion.div variants={staggerItem} transition={spring.gentle}>
            <GlassSection className="rounded-[var(--r-xl)] p-4 sm:p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
                  <span className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
                    <QrCode size={14} aria-hidden />
                    Pix
                  </span>
                  <h3 className="mt-3 font-display text-2xl text-[var(--color-text)]">
                    Apoio rapido por QR code
                  </h3>
                  <p className="mt-2 max-w-sm font-body text-sm text-[var(--color-text-muted)]">
                    Escaneie o QR ou use a chave Pix abaixo. O mesmo codigo e usado no botao de copia e cola.
                  </p>
                </div>

                <motion.div
                  className="mx-auto rounded-[var(--r-lg)] bg-white p-4 shadow-[var(--shadow-md)]"
                  initial={reduce ? false : { scale: 0.9, opacity: 0, rotate: -3 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={reduce ? { duration: 0 } : spring.gentle}
                  whileHover={reduce ? undefined : { scale: 1.03, rotate: 1 }}
                >
                  <QRCodeSVG
                    value={PIX_COPY_PASTE_CODE}
                    size={170}
                    level="M"
                    includeMargin={false}
                  />
                </motion.div>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <GlassLabel>{t("pixKey")}</GlassLabel>
                  <GlassField className="mt-2 rounded-[var(--r-md)]">
                    <GlassInput readOnly value={PIX_KEY} className="font-mono text-sm" />
                  </GlassField>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                  {/* SIGNATURE copy action: icon morph + confirm swap + warm burst */}
                  <div className="relative">
                    <Burst fire={burstKey} colors={WARM_BURST} count={16} />
                    <motion.button
                      type="button"
                      onClick={handleCopyPix}
                      whileHover={hoverLift}
                      whileTap={pressScale}
                      transition={spring.press}
                      aria-live="polite"
                      className="group relative w-full overflow-hidden rounded-[var(--r-md)] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(77,219,168,0.96),rgba(0,184,235,0.94))] px-4 py-3 text-left text-[#0a153a] shadow-[0_18px_40px_rgba(0,184,235,0.18)] outline-none focus-visible:shadow-[var(--ring-focus)]"
                    >
                      <span className="pointer-events-none absolute inset-y-0 left-[-25%] w-16 rotate-[14deg] bg-white/35 blur-xl transition-transform duration-700 group-hover:translate-x-[220%] motion-reduce:transition-none" />
                      <span className="relative flex min-h-11 items-center justify-between gap-3">
                        <span>
                          <span className="block font-condensed text-[11px] uppercase tracking-[0.24em] text-[#0a153a]/64">
                            Pix copia e cola
                          </span>
                          <span className="mt-1 block min-w-[7.5rem] font-display text-xl">
                            <AnimatePresence mode="wait" initial={false}>
                              <motion.span
                                key={copied ? "done" : "idle"}
                                className="block"
                                initial={reduce ? false : { y: 8, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={reduce ? { opacity: 0 } : { y: -8, opacity: 0 }}
                                transition={reduce ? { duration: 0 } : spring.pop}
                              >
                                {copied ? t("pixKeyCopied") : "Copiar codigo"}
                              </motion.span>
                            </AnimatePresence>
                          </span>
                        </span>
                        <motion.span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/30"
                          animate={
                            reduce || !copied ? undefined : { scale: [1, 1.18, 1] }
                          }
                          transition={reduce ? undefined : spring.pop}
                        >
                          <CopyMorph copied={copied} />
                        </motion.span>
                      </span>
                    </motion.button>
                  </div>

                  <motion.a
                    href="https://nubank.com.br/cobrar/12kdqf/69b978ef-7b9c-468e-b001-28e6b786f0ad"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={hoverLift}
                    whileTap={pressScale}
                    transition={spring.press}
                    className="group relative overflow-hidden rounded-[var(--r-md)] border border-fuchsia-300/20 bg-[linear-gradient(135deg,rgba(214,77,194,0.94),rgba(106,91,240,0.94))] px-4 py-3 text-white shadow-[0_18px_40px_rgba(106,91,240,0.22)] outline-none focus-visible:shadow-[var(--ring-focus)]"
                  >
                    <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-16 rotate-[14deg] bg-white/28 blur-xl transition-transform duration-700 group-hover:translate-x-[230%] motion-reduce:transition-none" />
                    <span className="relative flex min-h-11 items-center justify-between gap-3">
                      <span>
                        <span className="block font-condensed text-[11px] uppercase tracking-[0.24em] text-white/64">
                          Nubank
                        </span>
                        <span className="mt-1 block font-display text-xl">
                          Pagar com link
                        </span>
                      </span>
                      <ExternalLink size={18} aria-hidden />
                    </span>
                  </motion.a>
                </div>
              </div>
            </GlassSection>
          </motion.div>
        )}

        {/* ============ International + donor code ============ */}
        <motion.div
          variants={staggerItem}
          transition={spring.gentle}
          className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]"
        >
          <GlassSection className="rounded-[var(--r-xl)] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-condensed text-[11px] uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
                  International
                </p>
                <h3 className="mt-2 font-display text-2xl text-[var(--color-text)]">
                  {t("donatePayPal")}
                </h3>
                <p className="mt-2 max-w-sm font-body text-sm text-[var(--color-text-muted)]">
                  Para apoio fora do Pix, use PayPal. Mantive essa rota como alternativa direta e limpa.
                </p>
              </div>
              <span className="rounded-[var(--r-pill)] border border-sky-300/18 bg-sky-400/14 px-3 py-1 font-condensed text-[11px] uppercase tracking-[0.24em] text-sky-100">
                PayPal
              </span>
            </div>

            <motion.a
              href="https://paypal.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={hoverLift}
              whileTap={pressScale}
              transition={spring.press}
              className="mt-4 flex min-h-14 items-center justify-between rounded-[var(--r-md)] border border-sky-300/18 bg-[linear-gradient(135deg,rgba(0,184,235,0.92),rgba(16,129,255,0.92))] px-4 py-3 text-[#0a153a] shadow-[0_18px_40px_rgba(0,184,235,0.18)] outline-none focus-visible:shadow-[var(--ring-focus)]"
            >
              <span className="font-display text-xl">Abrir PayPal</span>
              <ExternalLink size={18} aria-hidden />
            </motion.a>
          </GlassSection>

          <GlassSection className="rounded-[var(--r-xl)] p-4 sm:p-5">
            <p className="font-condensed text-[11px] uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
              Extra
            </p>
            <h3 className="mt-2 font-display text-2xl text-[var(--color-text)]">
              {t("donorCode")}
            </h3>
            <p className="mt-2 font-body text-sm text-[var(--color-text-muted)]">
              Campo opcional para futuros beneficios e rastreamento de apoio.
            </p>

            <div className="mt-4 flex gap-2">
              <GlassField className="flex-1 rounded-[var(--r-md)]">
                <GlassInput placeholder={t("donorCodePlaceholder")} />
              </GlassField>
              <motion.button
                type="button"
                whileHover={reduce ? undefined : { scale: 1.04 }}
                whileTap={pressScale}
                transition={spring.press}
                className="flex min-h-11 items-center rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-4 font-condensed text-xs uppercase tracking-[0.22em] text-[var(--color-text)] outline-none transition-colors hover:bg-[var(--glass-1)] focus-visible:shadow-[var(--ring-focus)]"
              >
                OK
              </motion.button>
            </div>
          </GlassSection>
        </motion.div>

        {/* ============ Sincere sign-off ============ */}
        <motion.p
          variants={staggerItem}
          transition={spring.gentle}
          className="flex items-center justify-center gap-1.5 pt-1 text-center font-body text-sm text-[var(--text-dim)]"
        >
          {language === "pt" ? "Feito com" : "Made with"}
          <Heart size={13} className="text-[var(--color-imp)]" fill="currentColor" aria-hidden />
          {language === "pt" ? "para a resenha. Obrigado!" : "for the crew. Thank you!"}
        </motion.p>
      </motion.div>
    </Modal>
  );
}
