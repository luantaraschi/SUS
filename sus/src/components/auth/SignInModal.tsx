"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Burst } from "@/components/ui/Burst";
import { spring, staggerContainer, staggerItem } from "@/lib/motion";

interface SignInModalProps {
  onClose: () => void;
  onSuccess: () => void;
  open: boolean;
}

type Step = "signIn" | "signUp";

// ---------------------------------------------------------------------------
// Local helpers (component-scoped; unique `sim-` keyframe prefix)
// ---------------------------------------------------------------------------

/** 38px circular glass icon chip pinned inside an input's leading edge. */
function FieldIcon({ icon, active }: { icon: string; active: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-4 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center"
      initial={false}
      animate={{
        color: active ? "var(--color-info)" : "var(--color-text-muted)",
        scale: active && !reduce ? 1.08 : 1,
      }}
      transition={reduce ? { duration: 0 } : spring.pop}
    >
      <Icon icon={icon} width={20} height={20} />
    </motion.span>
  );
}

/** A small SVG check that draws itself on success. */
function DrawnCheck({ size = 22 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <motion.path
        d="M4 12.5l5 5 11-12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function SignInModal({ onClose, onSuccess, open }: SignInModalProps) {
  const reduce = useReducedMotion();
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<Step>("signIn");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Signature beats: keyed counters replay the error shake + success burst
  // (bumped from event handlers, never from an effect → React Compiler safe).
  const [errorShakeKey, setErrorShakeKey] = useState(0);
  const [successBurstKey, setSuccessBurstKey] = useState(0);

  // Timeout ref — cleared on unmount and on a new sign-in attempt.
  const successTimeoutRef = useRef<number | null>(null);
  useEffect(() => () => { if (successTimeoutRef.current !== null) clearTimeout(successTimeoutRef.current); }, []);

  // Per-field focus for the glow treatment.
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isSignIn = step === "signIn";

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      void signIn("google", { redirectTo: "/" });
    } catch {
      setError("Erro ao autenticar com o Google.");
      setErrorShakeKey((k) => k + 1);
      setGoogleLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || success) return;
    // Clear any previous pending success navigation before starting a new attempt.
    if (successTimeoutRef.current !== null) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const flow = isSignIn ? "signIn" : "signUp";
      await signIn("password", { email, password, flow });
      // SIGNATURE: settle into a success beat (check draws + confetti) before
      // we hand control back to the parent, so the moment "lands".
      setIsSubmitting(false);
      setSuccess(true);
      setSuccessBurstKey((k) => k + 1);
      successTimeoutRef.current = window.setTimeout(() => onSuccess(), reduce ? 0 : 620);
    } catch {
      if (!isSignIn) {
        setError("Erro ao criar conta. Talvez o email já esteja em uso?");
      } else {
        setError("Email ou senha inválidos.");
      }
      setErrorShakeKey((k) => k + 1);
      setIsSubmitting(false);
    }
  };

  const switchStep = () => {
    setStep((s) => (s === "signIn" ? "signUp" : "signIn"));
    setError(null);
  };

  const formBusy = isSubmitting || success;
  const submitDisabled = formBusy || !email || !password;

  // Shared field chrome (glass, leading icon room, focus colors).
  const fieldClass =
    "relative h-14 w-full rounded-[var(--r-pill)] border-2 border-[var(--glass-border)] bg-[var(--glass-1)] pl-12 pr-5 font-body text-lg text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)]";

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <motion.div
        // Re-run the entrance whenever the modal re-opens.
        key={open ? "sim-open" : "sim-closed"}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-5"
      >
        {/* ===== Header: eyebrow + morphing title + step tabs ===== */}
        <motion.div variants={staggerItem} transition={spring.gentle} className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)]"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-info) 18%, var(--glass-2))",
                color: "var(--color-info)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
              }}
            >
              <Icon icon="solar:user-rounded-bold" width={18} height={18} />
            </span>
            <div className="min-w-0">
              <p className="font-condensed text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
                Sua conta SUS
              </p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.h2
                  key={step}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={reduce ? { duration: 0.12 } : spring.pop}
                  className="font-display text-2xl leading-tight text-[var(--color-text)] sm:text-3xl"
                >
                  {isSignIn ? "Entrar na Conta" : "Criar uma Conta"}
                </motion.h2>
              </AnimatePresence>
            </div>
          </div>

          {/* Step tabs — sliding pill highlight that morphs between the two flows. */}
          <div
            role="tablist"
            aria-label="Tipo de acesso"
            className="relative grid grid-cols-2 gap-1 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] p-1"
          >
            {(["signIn", "signUp"] as const).map((tab) => {
              const selected = step === tab;
              return (
                <button
                  key={tab}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => {
                    if (!selected) switchStep();
                  }}
                  className="relative z-10 flex h-10 items-center justify-center rounded-[var(--r-pill)] font-condensed text-xs uppercase tracking-[0.18em] outline-none transition-colors duration-[var(--t-quick)] focus-visible:shadow-[var(--ring-focus)]"
                  style={{ color: selected ? "var(--color-text)" : "var(--color-text-muted)" }}
                >
                  {selected && (
                    <motion.span
                      aria-hidden
                      layoutId="sim-tab-pill"
                      className="absolute inset-0 -z-10 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] shadow-[var(--shadow-sm)]"
                      transition={reduce ? { duration: 0 } : spring.gentle}
                    />
                  )}
                  {tab === "signIn" ? "Entrar" : "Criar conta"}
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.p
          variants={staggerItem}
          transition={spring.gentle}
          className="font-body text-sm leading-relaxed text-[var(--color-text-muted)]"
        >
          Com uma conta, você salva seu histórico de partidas e pode criar seus próprios pacotes de
          palavras e perguntas!
        </motion.p>

        {/* ===== Provider button: Google ===== */}
        <motion.div variants={staggerItem} transition={spring.gentle}>
          <motion.div
            whileHover={reduce || googleLoading || formBusy ? undefined : { y: -2, scale: 1.01 }}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            transition={spring.press}
          >
            <Button
              variant="glass"
              size="game-lg"
              onClick={handleGoogle}
              disabled={googleLoading || formBusy}
              className="hover:bg-[var(--glass-2)] hover:shadow-[var(--shadow-md)]"
            >
              {googleLoading ? (
                <Icon
                  icon="solar:refresh-bold"
                  width={22}
                  height={22}
                  className="motion-safe:animate-spin"
                />
              ) : (
                <Icon icon="flat-color-icons:google" width={24} height={24} />
              )}
              {googleLoading ? "Conectando..." : "Continuar com Google"}
            </Button>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={staggerItem} transition={spring.gentle} className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--glass-border),transparent)]" />
          <span className="font-condensed text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            ou com email
          </span>
          <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--glass-border),transparent)]" />
        </motion.div>

        {/* ===== Email / password form =====
            Keyed wrapper replays the error shake without disturbing the entry,
            mirroring the GameSettingsButton bug-form pattern. */}
        <motion.form
          variants={staggerItem}
          transition={spring.gentle}
          onSubmit={handlePasswordAuth}
          className="flex flex-col gap-3"
        >
          <motion.div
            key={errorShakeKey}
            animate={
              errorShakeKey > 0 && !reduce ? { x: [0, -10, 10, -8, 8, -4, 0] } : { x: 0 }
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col gap-3"
          >
            {/* Email */}
            <div className="relative">
              <FieldIcon icon="solar:letter-bold" active={emailFocused || email.length > 0} />
              {/* Focus glow overlay */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute -inset-[3px] rounded-[calc(var(--r-pill)+3px)]"
                initial={false}
                animate={{
                  opacity: emailFocused ? 1 : 0,
                  boxShadow: emailFocused
                    ? "0 0 0 3px color-mix(in srgb, var(--color-info) 55%, transparent), 0 0 26px color-mix(in srgb, var(--color-info) 32%, transparent)"
                    : "0 0 0 0 transparent",
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
              <input
                type="email"
                required
                placeholder="Seu melhor email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                disabled={formBusy}
                className={`${fieldClass} ${emailFocused ? "border-[var(--color-info)]" : ""}`}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FieldIcon icon="solar:lock-password-bold" active={passwordFocused || password.length > 0} />
              <motion.span
                aria-hidden
                className="pointer-events-none absolute -inset-[3px] rounded-[calc(var(--r-pill)+3px)]"
                initial={false}
                animate={{
                  opacity: passwordFocused ? 1 : 0,
                  boxShadow: passwordFocused
                    ? "0 0 0 3px color-mix(in srgb, var(--color-info) 55%, transparent), 0 0 26px color-mix(in srgb, var(--color-info) 32%, transparent)"
                    : "0 0 0 0 transparent",
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
              <input
                type="password"
                required
                placeholder="Senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                disabled={formBusy}
                className={`${fieldClass} ${passwordFocused ? "border-[var(--color-info)]" : ""}`}
              />
            </div>
          </motion.div>

          {/* Error line — slides in, imp-toned. */}
          <div className="min-h-[20px]">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="err"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center gap-1.5 text-center font-body text-sm font-bold text-[var(--color-imp)]"
                >
                  <Icon icon="solar:danger-triangle-bold" width={16} height={16} aria-hidden />
                  {error}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Submit — idle → loading → success (SIGNATURE). */}
          <div className="relative mt-1">
            <Burst
              fire={successBurstKey}
              count={14}
              colors={["var(--color-safe)", "var(--color-gold)", "var(--color-special)"]}
            />
            <motion.div
              whileHover={reduce || submitDisabled ? undefined : { y: -2, scale: 1.01 }}
              whileTap={reduce || submitDisabled ? undefined : { scale: 0.96 }}
              transition={spring.press}
            >
              <Button
                variant={success ? "safe" : "primary"}
                size="game-lg"
                type="submit"
                disabled={submitDisabled}
                className="overflow-hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {success ? (
                    <motion.span
                      key="ok"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={reduce ? { duration: 0.12 } : spring.pop}
                      className="inline-flex items-center gap-2"
                    >
                      <DrawnCheck />
                      Tudo certo!
                    </motion.span>
                  ) : isSubmitting ? (
                    <motion.span
                      key="loading"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Icon
                        icon="solar:refresh-bold"
                        width={22}
                        height={22}
                        className="motion-safe:animate-spin"
                      />
                      {isSignIn ? "Entrando..." : "Criando..."}
                    </motion.span>
                  ) : (
                    <motion.span
                      key={isSignIn ? "signin" : "signup"}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="inline-flex items-center gap-2"
                    >
                      <Icon
                        icon={isSignIn ? "solar:login-2-bold" : "solar:user-plus-bold"}
                        width={20}
                        height={20}
                        aria-hidden
                      />
                      {isSignIn ? "Entrar" : "Criar Conta"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </motion.form>

        {/* ===== Step switch link ===== */}
        <motion.div variants={staggerItem} transition={spring.gentle} className="text-center">
          <motion.button
            type="button"
            onClick={switchStep}
            disabled={formBusy}
            whileHover={reduce ? undefined : { scale: 1.03 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            transition={spring.press}
            className="rounded-[var(--r-pill)] px-3 py-2 font-body text-sm font-bold text-[var(--color-info)] outline-none transition-colors hover:underline focus-visible:shadow-[var(--ring-focus)] disabled:opacity-50"
          >
            {isSignIn ? "Ainda não tem conta? Criar conta." : "Já tem uma conta? Entrar."}
          </motion.button>
        </motion.div>
      </motion.div>
    </Modal>
  );
}
