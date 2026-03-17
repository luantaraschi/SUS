"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/I18nContext";
import { Check, Copy, ExternalLink, Heart, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  GlassField,
  GlassInput,
  GlassLabel,
  GlassPanel,
  GlassSection,
} from "./ui/glass";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PIX_KEY = "998f5509-a89d-4b95-8ae2-9bb00ca3c8ce";
const PIX_COPY_PASTE_CODE =
  "00020126880014BR.GOV.BCB.PIX0136998f5509-a89d-4b95-8ae2-9bb00ca3c8ce0226Muito obrigado pelo apoio!5204000053039865802BR5925Luan Antoni Taraschi Ramo6009SAO PAULO62140510qcsVJz4z986304252C";

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { t, language } = useI18n();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_COPY_PASTE_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy PIX code:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/68 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-xl max-h-[90vh]"
      >
        <GlassPanel
          tone="special"
          className="h-full overflow-hidden rounded-[34px] p-5 sm:p-6"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/72 transition-all hover:border-white/20 hover:bg-white/14 hover:text-white"
            title={t("close")}
          >
            <X size={20} />
          </button>

          <div className="custom-scrollbar relative z-10 max-h-[calc(90vh-2.5rem)] overflow-y-auto pr-1">
            <div className="space-y-5">
            <div className="mx-auto max-w-lg text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08, duration: 0.26 }}
                className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full border border-white/14 bg-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
              >
                <Heart size={30} className="text-[#ff7ba0]" fill="currentColor" />
              </motion.div>

              <p className="font-condensed text-xs uppercase tracking-[0.34em] text-white/55">
                Support the project
              </p>
              <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
                {t("supportTitle")}
              </h2>
              <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-white/74 sm:text-base">
                {t("supportMessage")}
              </p>
            </div>

            {language === "pt" && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.28 }}
              >
                <GlassSection className="rounded-[28px] p-4 sm:p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.26em] text-white/60">
                        <QrCode size={14} />
                        Pix
                      </div>
                      <h3 className="mt-3 font-display text-2xl text-white">
                        Apoio rapido por QR code
                      </h3>
                      <p className="mt-2 max-w-sm font-body text-sm text-white/68">
                        Escaneie o QR ou use a chave Pix abaixo. O mesmo codigo e usado no botao de copia e cola.
                      </p>
                    </div>

                    <div className="mx-auto rounded-[26px] bg-white p-4 shadow-[0_20px_40px_rgba(0,0,0,0.22)]">
                      <QRCodeSVG
                        value={PIX_COPY_PASTE_CODE}
                        size={170}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div>
                      <GlassLabel>{t("pixKey")}</GlassLabel>
                      <GlassField className="mt-2 rounded-[20px]">
                        <GlassInput readOnly value={PIX_KEY} className="font-mono text-sm" />
                      </GlassField>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="group relative overflow-hidden rounded-[20px] border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(77,219,168,0.96),rgba(0,184,235,0.94))] px-4 py-3 text-left text-[#17063a] shadow-[0_18px_40px_rgba(0,184,235,0.18)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <span className="pointer-events-none absolute inset-y-0 left-[-25%] w-16 rotate-[14deg] bg-white/35 blur-xl transition-transform duration-700 group-hover:translate-x-[220%]" />
                        <span className="relative flex items-center justify-between gap-3">
                          <span>
                            <span className="block font-condensed text-[11px] uppercase tracking-[0.24em] text-[#17063a]/64">
                              Pix copia e cola
                            </span>
                            <span className="mt-1 block font-display text-xl">
                              {copied ? t("pixKeyCopied") : "Copiar codigo"}
                            </span>
                          </span>
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/28">
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                          </span>
                        </span>
                      </button>

                      <a
                        href="https://nubank.com.br/cobrar/12kdqf/69b978ef-7b9c-468e-b001-28e6b786f0ad"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden rounded-[20px] border border-fuchsia-300/20 bg-[linear-gradient(135deg,rgba(184,52,255,0.92),rgba(116,26,255,0.94))] px-4 py-3 text-white shadow-[0_18px_40px_rgba(116,26,255,0.22)] transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <span className="pointer-events-none absolute inset-y-0 left-[-28%] w-16 rotate-[14deg] bg-white/28 blur-xl transition-transform duration-700 group-hover:translate-x-[230%]" />
                        <span className="relative flex items-center justify-between gap-3">
                          <span>
                            <span className="block font-condensed text-[11px] uppercase tracking-[0.24em] text-white/62">
                              Nubank
                            </span>
                            <span className="mt-1 block font-display text-xl">
                              Pagar com link
                            </span>
                          </span>
                          <ExternalLink size={18} />
                        </span>
                      </a>
                    </div>
                  </div>
                </GlassSection>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: language === "pt" ? 0.16 : 0.12, duration: 0.28 }}
              className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]"
            >
              <GlassSection className="rounded-[28px] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-condensed text-[11px] uppercase tracking-[0.26em] text-white/58">
                      International
                    </p>
                    <h3 className="mt-2 font-display text-2xl text-white">
                      {t("donatePayPal")}
                    </h3>
                    <p className="mt-2 max-w-sm font-body text-sm text-white/68">
                      Para apoio fora do Pix, use PayPal. Mantive essa rota como alternativa direta e limpa.
                    </p>
                  </div>
                  <div className="rounded-full border border-sky-300/18 bg-sky-400/14 px-3 py-1 font-condensed text-[11px] uppercase tracking-[0.24em] text-sky-100">
                    PayPal
                  </div>
                </div>

                <a
                  href="https://paypal.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex min-h-14 items-center justify-between rounded-[20px] border border-sky-300/18 bg-[linear-gradient(135deg,rgba(0,184,235,0.92),rgba(16,129,255,0.92))] px-4 py-3 text-[#0a153a] shadow-[0_18px_40px_rgba(0,184,235,0.18)] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <span className="font-display text-xl">Abrir PayPal</span>
                  <ExternalLink size={18} />
                </a>
              </GlassSection>

              <GlassSection className="rounded-[28px] p-4 sm:p-5">
                <p className="font-condensed text-[11px] uppercase tracking-[0.26em] text-white/58">
                  Extra
                </p>
                <h3 className="mt-2 font-display text-2xl text-white">
                  {t("donorCode")}
                </h3>
                <p className="mt-2 font-body text-sm text-white/68">
                  Campo opcional para futuros beneficios e rastreamento de apoio.
                </p>

                <div className="mt-4 flex gap-2">
                  <GlassField className="flex-1 rounded-[18px]">
                    <GlassInput placeholder={t("donorCodePlaceholder")} />
                  </GlassField>
                  <button
                    type="button"
                    className="rounded-[18px] border border-white/10 bg-white/10 px-4 font-condensed text-xs uppercase tracking-[0.22em] text-white/82 transition-colors hover:bg-white/16"
                  >
                    OK
                  </button>
                </div>
              </GlassSection>
            </motion.div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
