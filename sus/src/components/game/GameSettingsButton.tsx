"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useConvex, useMutation } from "convex/react";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { Slider } from "@/components/ui/Slider";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Burst } from "@/components/ui/Burst";
import { staggerContainer, staggerItem, spring } from "@/lib/motion";
import { api } from "../../../convex/_generated/api";
import { useBackground } from "@/lib/BackgroundContext";
import { useSound } from "@/lib/useSound";
import { playSound, getVolume, setVolume, subscribe } from "@/lib/sound";

interface GameSettingsButtonProps {
  sessionId: string;
}

// ---------------------------------------------------------------------------
// Small presentational helpers (icon-chips, morphing icons, meters)
// ---------------------------------------------------------------------------

/** 36px circular glass icon chip that sits left of a panel title. */
function IconChip({
  icon,
  tone = "info",
}: {
  icon: React.ReactNode;
  tone?: "info" | "special" | "safe" | "primary";
}) {
  const toneColor: Record<string, string> = {
    info: "var(--color-info)",
    special: "var(--color-special)",
    safe: "var(--color-safe)",
    primary: "var(--color-primary-1)",
  };
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)]"
      style={{
        backgroundColor: `color-mix(in srgb, ${toneColor[tone]} 18%, var(--glass-2))`,
        color: toneColor[tone],
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
      }}
    >
      {icon}
    </span>
  );
}

/** Aparencia segment icons that morph (scale/rotate/opacity) on selection. */
function SchemeIcon({
  scheme,
  selected,
}: {
  scheme: "system" | "light" | "dark";
  selected: boolean;
}) {
  const reduce = useReducedMotion();
  const t = reduce ? { duration: 0 } : spring.pop;
  if (scheme === "light") {
    return (
      <motion.span
        animate={{ rotate: selected ? 90 : 0, scale: selected ? 1.05 : 1 }}
        transition={t}
        className="inline-flex"
      >
        <Icon icon="solar:sun-2-bold" width={16} height={16} />
      </motion.span>
    );
  }
  if (scheme === "dark") {
    return (
      <motion.span
        animate={{ rotate: selected ? -18 : 0, scale: selected ? 1.05 : 1 }}
        transition={t}
        className="inline-flex"
      >
        <Icon icon="solar:moon-bold" width={16} height={16} />
      </motion.span>
    );
  }
  // system = half sun / half moon (eclipse-ish)
  return (
    <motion.span
      animate={{ rotate: selected ? 180 : 0, scale: selected ? 1.05 : 1 }}
      transition={t}
      className="inline-flex"
    >
      <Icon icon="solar:black-hole-bold" width={16} height={16} />
    </motion.span>
  );
}

/** 3-bar equalizer that springs to life when sound is ON. */
function EqualizerIcon({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const bars = [0, 1, 2];
  const peaks = [0.55, 1, 0.7];
  return (
    <span aria-hidden className="flex h-4 items-end gap-[3px]">
      {bars.map((b) => (
        <motion.span
          key={b}
          className="w-[3px] rounded-full bg-current"
          initial={false}
          animate={
            active && !reduce
              ? { height: [`${30 + b * 8}%`, `${peaks[b] * 100}%`, `${40 + b * 6}%`] }
              : { height: active ? `${peaks[b] * 100}%` : "26%" }
          }
          transition={
            active && !reduce
              ? { duration: 0.7 + b * 0.12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
              : spring.pop
          }
          style={{ height: "26%" }}
        />
      ))}
    </span>
  );
}

// 7-bar waveform sitting behind the slider; bar heights scale with volume.
const WAVE_BARS = [0.42, 0.7, 0.95, 0.62, 0.88, 0.55, 0.36];

// ---------------------------------------------------------------------------

export default function GameSettingsButton({ sessionId }: GameSettingsButtonProps) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const convex = useConvex();
  const submitBugReport = useMutation(api.feedback.submitBugReport);
  const updatePreferences = useMutation(api.preferences.update);
  const {
    colorScheme,
    themeId,
    backgroundAnimationEnabled,
    setColorScheme,
    setBackgroundAnimationEnabled,
    replacePreferences,
  } = useBackground();

  const { muted: soundMuted, toggleMute: toggleSoundMute } = useSound();
  const volume = useSyncExternalStore(subscribe, getVolume, () => 0.75);
  const [open, setOpen] = useState(false);
  const [bugMessage, setBugMessage] = useState("");
  const [bugFocused, setBugFocused] = useState(false);
  const [remotePreferencesState, setRemotePreferencesState] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");
  const [bugState, setBugState] = useState<{ error: string; success: string; loading: boolean }>({
    error: "",
    success: "",
    loading: false,
  });

  // Signature volume fader extras
  const [testKey, setTestKey] = useState(0); // bumps to fire sound-rings + waveform jump
  const [errorShakeKey, setErrorShakeKey] = useState(0);
  const [successBurstKey, setSuccessBurstKey] = useState(0);

  const enabledThemeId = useMemo(() => themeId ?? "classico", [themeId]);
  const soundOn = !soundMuted;
  const volPct = Math.round(volume * 100);
  const bugReady = bugMessage.trim().length >= 10;

  const enabledThemeLabel = enabledThemeId === "classico" ? "Classico" : enabledThemeId;

  useEffect(() => {
    if (!open || remotePreferencesState !== "idle") {
      return;
    }

    let cancelled = false;

    const loadRemotePreferences = async () => {
      setRemotePreferencesState("loading");

      try {
        const remote = await convex.query(api.preferences.current, {});
        if (cancelled) {
          return;
        }

        if (remote) {
          replacePreferences({
            colorScheme: remote.colorScheme,
            themeId: remote.backgroundThemeId,
            backgroundAnimationEnabled: remote.backgroundAnimationEnabled,
          });
          setRemotePreferencesState("ready");
          return;
        }

        setRemotePreferencesState("unavailable");
      } catch {
        if (!cancelled) {
          setRemotePreferencesState("unavailable");
        }
      }
    };

    void loadRemotePreferences();

    return () => {
      cancelled = true;
    };
  }, [convex, open, remotePreferencesState, replacePreferences]);

  const persistRemotePreferences = async (next: {
    colorScheme: "system" | "light" | "dark";
    themeId: string;
    backgroundAnimationEnabled: boolean;
  }) => {
    if (remotePreferencesState !== "ready") {
      return;
    }

    try {
      await updatePreferences({
        colorScheme: next.colorScheme,
        backgroundThemeId: next.themeId,
        backgroundAnimationEnabled: next.backgroundAnimationEnabled,
      });
    } catch {
      setRemotePreferencesState("unavailable");
    }
  };

  const handleSubmitBug = async () => {
    // Guard against double-submit (and matches the disabled conditions).
    if (bugState.loading || !bugReady) {
      return;
    }
    setBugState({ error: "", success: "", loading: true });

    try {
      await submitBugReport({
        sessionId,
        route: pathname,
        browserInfo:
          typeof window === "undefined" ? "unknown" : window.navigator.userAgent,
        message: bugMessage,
      });
      setBugMessage("");
      setBugState({ error: "", success: "Bug enviado para analise.", loading: false });
      setSuccessBurstKey((k) => k + 1);
    } catch (error) {
      setBugState({
        error: error instanceof Error ? error.message : "Nao foi possivel enviar o bug.",
        success: "",
        loading: false,
      });
      setErrorShakeKey((k) => k + 1);
    }
  };

  const handleColorSchemeChange = (scheme: "system" | "light" | "dark") => {
    playSound("ui.toggle");
    setColorScheme(scheme);
    void persistRemotePreferences({
      colorScheme: scheme,
      themeId: enabledThemeId,
      backgroundAnimationEnabled,
    });
  };

  const handleAnimationChange = (enabled: boolean) => {
    playSound("ui.toggle");
    setBackgroundAnimationEnabled(enabled);
    void persistRemotePreferences({
      colorScheme,
      themeId: enabledThemeId,
      backgroundAnimationEnabled: enabled,
    });
  };

  const handleSoundToggle = () => {
    playSound("ui.toggle");
    toggleSoundMute();
  };

  const handleTestSound = () => {
    playSound("ui.click");
    setTestKey((k) => k + 1);
  };

  // Section card chrome — translucent glass to match the modal + primitives.
  const panelClass =
    "relative overflow-hidden rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-4 shadow-[var(--shadow-md)]";

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-lg backdrop-blur-md outline-none focus-visible:shadow-[var(--ring-focus)]"
        aria-label="Abrir configuracoes"
        animate={reduce ? undefined : { rotate: [0, 6, 0, -6, 0] }}
        transition={
          reduce ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }
        whileHover={reduce ? undefined : { scale: 1.06, rotate: 90 }}
        whileTap={reduce ? { scale: 0.94 } : { scale: 0.94, rotate: 90 }}
        style={{ transformOrigin: "center" }}
      >
        <Icon icon="solar:settings-bold" width={22} height={22} />
      </motion.button>

      <Modal open={open} onClose={() => setOpen(false)} size="lg" title="Configuracoes">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Intro line + live-room status chip */}
          <motion.div
            variants={staggerItem}
            transition={spring.gentle}
            className="mb-5 flex flex-wrap items-center justify-between gap-3"
          >
            <p className="font-body text-sm text-[var(--color-text-muted)]">
              Ajuste a aparencia e relate problemas sem sair da sala.
            </p>
            <span className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-3 py-1.5 font-condensed text-xs uppercase tracking-[0.18em] text-[var(--color-text)]">
              <span className="relative flex h-2.5 w-2.5">
                {!reduce && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: "var(--color-safe)" }}
                    animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: "var(--color-safe)" }}
                />
              </span>
              Sala ao vivo
            </span>
          </motion.div>

          <div className="grid max-h-full items-start gap-5 overflow-y-auto pr-1 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] custom-scrollbar">
            {/* ============ LEFT: Relatar bug hero ============ */}
            {/* Outer = stagger entry (spring.gentle: heavier/later). Inner keyed
                element replays the error shake without disturbing the entry. */}
            <motion.section
              variants={staggerItem}
              transition={spring.gentle}
              className="lg:self-stretch"
            >
            <motion.div
              key={errorShakeKey}
              animate={
                errorShakeKey > 0 && !reduce
                  ? { x: [0, -10, 10, -8, 8, -4, 0] }
                  : { x: 0 }
              }
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`${panelClass} flex h-full flex-col`}
              style={
                bugState.error
                  ? { borderColor: "color-mix(in srgb, var(--color-imp) 60%, transparent)" }
                  : undefined
              }
            >
              <div className="flex items-center gap-3">
                <IconChip tone="primary" icon={<Icon icon="solar:bug-bold" width={18} height={18} />} />
                <h3 className="font-display text-2xl">Relatar bug</h3>
              </div>
              <p className="mt-2 font-body text-sm text-[var(--color-text-muted)]">
                Descreva o problema e envie o contexto desta tela automaticamente.
              </p>

              {/* Textarea with focus glow */}
              <div className="relative mt-4 flex-1">
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute -inset-[3px] rounded-[calc(var(--r-lg)+3px)]"
                  initial={false}
                  animate={{
                    opacity: bugFocused ? 1 : 0,
                    boxShadow: bugFocused
                      ? "0 0 0 3px color-mix(in srgb, var(--color-primary-1) 55%, transparent), 0 0 28px color-mix(in srgb, var(--color-primary-1) 35%, transparent)"
                      : "0 0 0 0 transparent",
                  }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                />
                <textarea
                  value={bugMessage}
                  onChange={(event) => setBugMessage(event.target.value)}
                  onFocus={() => setBugFocused(true)}
                  onBlur={() => setBugFocused(false)}
                  placeholder="Explique o que aconteceu, em qual etapa e se isso se repete."
                  className="relative h-full min-h-[180px] w-full resize-none rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-4 py-3 font-body text-base text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--text-dim)]"
                />
              </div>

              {/* "pronto para enviar" hint */}
              <div className="mt-2 min-h-[20px]">
                <AnimatePresence mode="wait">
                  {bugState.error ? (
                    <motion.p
                      key="err"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="font-body text-sm text-[var(--color-imp)]"
                    >
                      {bugState.error}
                    </motion.p>
                  ) : bugState.success ? (
                    <motion.p
                      key="ok"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-safe)]"
                    >
                      <DrawnCheck />
                      {bugState.success}
                    </motion.p>
                  ) : bugReady && !bugState.loading ? (
                    <motion.p
                      key="ready"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="font-condensed text-xs uppercase tracking-[0.18em] text-[var(--color-safe)]"
                    >
                      Pronto para enviar
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Send button — sealed envelope / paper plane */}
              <div className="relative mt-3">
                <Burst fire={successBurstKey} colors={["var(--color-safe)", "var(--color-gold)"]} />
                <button
                  type="button"
                  onClick={() => void handleSubmitBug()}
                  disabled={bugState.loading || !bugReady}
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--r-md)] bg-[var(--color-primary-1)] px-4 py-3 font-display text-xl text-white outline-none transition-transform duration-[var(--t-quick)] ease-[var(--ease-out)] hover:enabled:scale-[1.01] active:enabled:scale-[0.97] focus-visible:shadow-[var(--ring-focus)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:hover:enabled:scale-100 motion-reduce:active:enabled:scale-100"
                >
                  {bugState.loading ? (
                    <>
                      <motion.span
                        className="inline-flex"
                        animate={reduce ? undefined : { x: [0, 4, 0], y: [0, -2, 0] }}
                        transition={reduce ? undefined : { duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Icon icon="solar:plain-2-bold" width={20} height={20} />
                      </motion.span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:letter-bold" width={20} height={20} aria-hidden />
                      Enviar relato
                    </>
                  )}
                </button>
              </div>
            </motion.div>
            </motion.section>

            {/* ============ RIGHT: control rack ============ */}
            <div className="grid gap-5">
              {/* Aparencia */}
              <motion.section variants={staggerItem} className={panelClass}>
                <div className="flex items-center gap-3">
                  <IconChip tone="info" icon={<Icon icon="solar:pallete-2-bold" width={18} height={18} />} />
                  <h3 className="font-display text-2xl">Aparencia</h3>
                </div>
                <div className="mt-4">
                  <SegmentedControl
                    aria-label="Esquema de cores"
                    tone="info"
                    value={colorScheme}
                    onChange={(v) =>
                      handleColorSchemeChange(v as "system" | "light" | "dark")
                    }
                    options={[
                      {
                        value: "system",
                        label: "Sistema",
                        icon: <SchemeIcon scheme="system" selected={colorScheme === "system"} />,
                      },
                      {
                        value: "light",
                        label: "Claro",
                        icon: <SchemeIcon scheme="light" selected={colorScheme === "light"} />,
                      },
                      {
                        value: "dark",
                        label: "Escuro",
                        icon: <SchemeIcon scheme="dark" selected={colorScheme === "dark"} />,
                      },
                    ]}
                  />
                </div>
              </motion.section>

              {/* Ambiente — merged background + sound + volume */}
              <motion.section variants={staggerItem} className={panelClass}>
                <div className="flex items-center gap-3">
                  <IconChip tone="special" icon={<Icon icon="solar:tuning-square-bold" width={18} height={18} />} />
                  <h3 className="font-display text-2xl">Ambiente</h3>
                </div>

                {/* Row: background animation */}
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-lg leading-tight">Animacao do background</p>
                    <p className="mt-0.5 font-body text-sm text-[var(--color-text-muted)]">
                      Fundo animado. Desligado deixa a tela mais leve.
                    </p>
                  </div>
                  <Switch
                    aria-label="Animacao do background"
                    tone="special"
                    checked={backgroundAnimationEnabled}
                    onCheckedChange={handleAnimationChange}
                  />
                </div>

                {/* Hairline divider (inset shadow, not a border) */}
                <div
                  aria-hidden
                  className="my-4 h-px w-full"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.14)" }}
                />

                {/* Row: sounds */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-pill)]"
                      style={{
                        color: soundOn ? "var(--color-safe)" : "var(--text-dim)",
                        backgroundColor: "var(--glass-2)",
                      }}
                    >
                      <EqualizerIcon active={soundOn} />
                    </span>
                    <div>
                      <p className="font-display text-lg leading-tight">Sons do jogo</p>
                      <p className="mt-0.5 font-body text-sm text-[var(--color-text-muted)]">
                        Efeitos sonoros durante a partida.
                      </p>
                    </div>
                  </div>
                  <Switch
                    aria-label="Sons do jogo"
                    tone="safe"
                    checked={soundOn}
                    onCheckedChange={handleSoundToggle}
                  />
                </div>

                {/* Volume sub-zone (signature) — only when sound is ON */}
                <AnimatePresence initial={false}>
                  {soundOn && (
                    <motion.div
                      key="volume"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={reduce ? { duration: 0 } : spring.gentle}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-2)] p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="font-condensed text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                            Volume
                          </span>
                          <VolumeReadout value={volPct} />
                        </div>

                        {/* Slider + waveform behind it */}
                        <div className="relative mt-2">
                          <Waveform value={volume} testKey={testKey} />
                          <div className="relative z-10">
                            <Slider
                              aria-label="Volume dos sons"
                              tone={volPct >= 90 ? "gold" : "safe"}
                              min={0}
                              max={100}
                              step={1}
                              value={volPct}
                              onValueChange={(v) => setVolume(v / 100)}
                            />
                          </div>
                        </div>

                        {/* Testar som — sound-rings emit from the speaker */}
                        <div className="relative mt-3 flex items-center gap-3">
                          <SpeakerRings testKey={testKey} />
                          <motion.button
                            type="button"
                            onClick={handleTestSound}
                            whileHover={reduce ? undefined : { scale: 1.02 }}
                            whileTap={reduce ? undefined : { scale: 0.97 }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-2.5 font-condensed text-sm uppercase tracking-[0.18em] text-[var(--color-text)] outline-none transition-colors hover:bg-[var(--glass-2)] focus-visible:shadow-[var(--ring-focus)]"
                          >
                            <Icon icon="solar:volume-loud-bold" width={18} height={18} aria-hidden />
                            Testar som
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>

              {/* Footer strip: Acessibilidade visual (quiet reference) */}
              <motion.div
                variants={staggerItem}
                className="border-t border-[var(--glass-border)] pt-4"
              >
                <p className="font-condensed text-xs uppercase tracking-[0.2em] text-[var(--text-dim)]">
                  Acessibilidade visual
                </p>
                <p className="mt-1.5 font-body text-sm text-[var(--text-dim)]">
                  O app respeita seu tema claro ou escuro e usa o fundo visual atual da interface.
                  Os temas da sala continuam sendo escolhidos dentro do lobby. Fundo visual atual:{" "}
                  <span className="text-[var(--color-text-muted)]">{enabledThemeLabel}</span>.
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Volume sub-components
// ---------------------------------------------------------------------------

/** % readout that pops (scale 1.15 → 1) whenever the value changes. */
function VolumeReadout({ value }: { value: number }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={reduce ? false : { scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={reduce ? { duration: 0 } : spring.pop}
        className="tnum font-display text-base text-[var(--color-text)]"
      >
        {value}%
      </motion.span>
    </AnimatePresence>
  );
}

/**
 * 7-bar mini-waveform behind the slider track.
 * Bar heights scale with the current volume; a changing testKey makes them
 * do one reactive "jump" pulse.
 */
function Waveform({ value, testKey }: { value: number; testKey: number }) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-1/2 flex h-7 -translate-y-1/2 items-center justify-between gap-1 px-1 opacity-60"
    >
      {WAVE_BARS.map((peak, i) => {
        // Each bar's height = its peak weight * current volume (min visible floor).
        const h = Math.max(0.12, peak * value);
        return (
          <motion.span
            key={i}
            className="flex-1 rounded-full"
            style={{
              backgroundColor:
                value >= 0.9 ? "var(--color-gold)" : "var(--color-safe)",
              maxWidth: 6,
            }}
            initial={false}
            animate={
              reduce
                ? { height: `${h * 100}%` }
                : {
                    height: `${h * 100}%`,
                    // Reactive jump keyed off testKey
                    scaleY: testKey > 0 ? [1, 1.5, 1] : 1,
                  }
            }
            transition={
              reduce
                ? { duration: 0 }
                : {
                    height: { type: "spring", stiffness: 320, damping: 22 },
                    scaleY: { duration: 0.45, ease: "easeOut", delay: i * 0.025 },
                  }
            }
          />
        );
      })}
    </div>
  );
}

/** Two concentric sound-ring waves emitted from the speaker on "Testar som". */
function SpeakerRings({ testKey }: { testKey: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2">
      <AnimatePresence>
        {testKey > 0 && (
          <span key={testKey} className="absolute">
            {[0, 0.15].map((delay, i) => (
              <motion.span
                key={i}
                className="absolute h-5 w-5 rounded-full border-2"
                style={{ borderColor: "var(--color-safe)", left: -10, top: -10 }}
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 2.6, opacity: 0 }}
                transition={{ duration: 0.7, delay, ease: "easeOut" }}
              />
            ))}
          </span>
        )}
      </AnimatePresence>
    </span>
  );
}

/** A small SVG check that draws itself on success. */
function DrawnCheck() {
  const reduce = useReducedMotion();
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <motion.path
        d="M4 12.5l5 5 11-12"
        stroke="var(--color-safe)"
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
