"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { useConvex, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useBackground } from "@/lib/BackgroundContext";

const THEME_ICON_MAP: Record<string, string> = {
  star: "solar:star-bold",
  football: "solar:ball-bold",
  health: "solar:health-bold",
  laptop: "solar:laptop-bold",
  sparkles: "solar:magic-stick-3-bold",
  bolt: "solar:flash-bold",
  leaf: "solar:leaf-bold",
  target: "solar:target-bold",
  swords: "solar:sledgehammer-bold",
  pickaxe: "solar:hammer-bold",
  skull: "solar:skull-bold",
  blaster: "solar:rocket-bold",
  pokeball: "solar:planet-bold",
  lightsaber: "solar:sword-bold",
  crown: "solar:crown-bold",
  fist: "solar:bolt-circle-bold",
  katana: "solar:danger-triangle-bold",
  coffee: "solar:cup-bold",
  shield: "solar:shield-bold",
};

interface GameSettingsButtonProps {
  sessionId: string;
}

export default function GameSettingsButton({ sessionId }: GameSettingsButtonProps) {
  const pathname = usePathname();
  const convex = useConvex();
  const submitBugReport = useMutation(api.feedback.submitBugReport);
  const updatePreferences = useMutation(api.preferences.update);
  const {
    colorScheme,
    themeId,
    backgroundAnimationEnabled,
    themes,
    setColorScheme,
    setThemeId,
    setBackgroundAnimationEnabled,
    replacePreferences,
  } = useBackground();

  const [open, setOpen] = useState(false);
  const [bugMessage, setBugMessage] = useState("");
  const [remotePreferencesState, setRemotePreferencesState] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");
  const [bugState, setBugState] = useState<{ error: string; success: string; loading: boolean }>({
    error: "",
    success: "",
    loading: false,
  });

  const enabledThemeId = useMemo(
    () => themes.find((theme) => theme.id === themeId)?.id ?? "classico",
    [themeId, themes]
  );

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
    } catch (error) {
      setBugState({
        error: error instanceof Error ? error.message : "Nao foi possivel enviar o bug.",
        success: "",
        loading: false,
      });
    }
  };

  const handleColorSchemeChange = (scheme: "system" | "light" | "dark") => {
    setColorScheme(scheme);
    void persistRemotePreferences({
      colorScheme: scheme,
      themeId: enabledThemeId,
      backgroundAnimationEnabled,
    });
  };

  const handleThemeChange = (nextThemeId: string) => {
    setThemeId(nextThemeId);
    void persistRemotePreferences({
      colorScheme,
      themeId: nextThemeId,
      backgroundAnimationEnabled,
    });
  };

  const handleAnimationChange = (enabled: boolean) => {
    setBackgroundAnimationEnabled(enabled);
    void persistRemotePreferences({
      colorScheme,
      themeId: enabledThemeId,
      backgroundAnimationEnabled: enabled,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-105"
        aria-label="Abrir configuracoes"
      >
        <Icon icon="solar:settings-bold" width={22} height={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-[32px] border border-white/10 bg-[var(--panel-surface)] p-5 text-[var(--panel-text)] shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl">Configuracoes</h2>
                <p className="font-body text-sm text-[var(--panel-soft-text)]">
                  Ajuste a aparencia e relate problemas sem sair da sala.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--panel-muted)] text-[var(--panel-text)] transition-colors hover:bg-black/10"
                aria-label="Fechar configuracoes"
              >
                <Icon icon="solar:close-circle-bold" width={26} height={26} />
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
              <section className="rounded-[28px] border border-black/10 bg-[var(--panel-muted)] p-4">
                <h3 className="font-display text-2xl">Relatar bug</h3>
                <p className="mt-2 font-body text-sm text-[var(--panel-soft-text)]">
                  Descreva o problema e envie o contexto desta tela automaticamente.
                </p>
                <textarea
                  value={bugMessage}
                  onChange={(event) => setBugMessage(event.target.value)}
                  placeholder="Explique o que aconteceu, em qual etapa e se isso se repete."
                  className="mt-4 min-h-[180px] w-full resize-none rounded-[24px] border border-black/10 bg-white/80 px-4 py-3 font-body text-base text-surface-primary outline-none focus:border-surface-primary"
                />
                {(bugState.error || bugState.success) && (
                  <p className={`mt-3 font-body text-sm ${bugState.error ? "text-game-impostor" : "text-game-safe"}`}>
                    {bugState.error || bugState.success}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleSubmitBug()}
                  disabled={bugState.loading || bugMessage.trim().length < 10}
                  className="mt-4 w-full rounded-[20px] bg-surface-primary px-4 py-3 font-display text-xl text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bugState.loading ? "Enviando..." : "Enviar relato"}
                </button>
              </section>

              <div className="grid gap-5">
                <section className="rounded-[28px] border border-black/10 bg-[var(--panel-muted)] p-4">
                  <h3 className="font-display text-2xl">Aparencia</h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {[
                      { value: "system", label: "Sistema" },
                      { value: "light", label: "Claro" },
                      { value: "dark", label: "Escuro" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          handleColorSchemeChange(option.value as "system" | "light" | "dark")
                        }
                        className={`rounded-full px-4 py-2 font-condensed text-sm uppercase tracking-[0.24em] transition-colors ${
                          colorScheme === option.value
                            ? "bg-surface-primary text-white"
                            : "bg-white/80 text-surface-primary"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-black/10 bg-[var(--panel-muted)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl">Background</h3>
                      <p className="font-body text-sm text-[var(--panel-soft-text)]">
                        O tema classico ja esta ativo. Os proximos entram assim que os fundos forem adicionados.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAnimationChange(!backgroundAnimationEnabled)}
                      className={`relative h-8 w-14 rounded-full transition-colors ${
                        backgroundAnimationEnabled ? "bg-game-safe" : "bg-black/15"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-7 w-7 rounded-full bg-white shadow transition-transform ${
                          backgroundAnimationEnabled ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {themes.map((theme) => {
                      const active = enabledThemeId === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => theme.enabled && handleThemeChange(theme.id)}
                          disabled={!theme.enabled}
                          className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-left transition-colors ${
                            active
                              ? "border-surface-primary bg-surface-primary text-white"
                              : theme.enabled
                                ? "border-black/10 bg-white/80 text-surface-primary"
                                : "border-black/10 bg-slate-400/20 text-surface-primary/55"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon icon={THEME_ICON_MAP[theme.icon] ?? "solar:star-bold"} width={18} height={18} />
                            <span className="font-body text-base">{theme.title}</span>
                          </span>
                          {!theme.enabled && (
                            <span className="font-condensed text-[10px] uppercase tracking-[0.2em]">
                              Em breve
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-[28px] border border-black/10 bg-[var(--panel-muted)] p-4">
                  <h3 className="font-display text-2xl">Acessibilidade visual</h3>
                  <p className="mt-2 font-body text-sm text-[var(--panel-soft-text)]">
                    Desligar a animacao ajuda em navegadores mais pesados e em sessoes longas.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
