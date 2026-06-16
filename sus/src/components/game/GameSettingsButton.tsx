"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { useConvex, useMutation } from "convex/react";
import { Modal } from "@/components/ui/Modal";
import { api } from "../../../convex/_generated/api";
import { useBackground } from "@/lib/BackgroundContext";
import { useSound } from "@/lib/useSound";

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
    setColorScheme,
    setBackgroundAnimationEnabled,
    replacePreferences,
  } = useBackground();

  const { muted: soundMuted, toggleMute: toggleSoundMute } = useSound();
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

  const enabledThemeId = useMemo(() => themeId ?? "classico", [themeId]);

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
        className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
        aria-label="Abrir configuracoes"
      >
        <Icon icon="solar:settings-bold" width={22} height={22} />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title="Configuracoes"
      >
          <p className="mb-5 font-body text-sm text-[var(--color-text-muted)]">
            Ajuste a aparencia e relate problemas sem sair da sala.
          </p>

            <div className="grid max-h-full items-start gap-5 overflow-y-auto pr-1 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] custom-scrollbar">
              <section className="rounded-[28px] border border-[var(--control-border)] bg-[var(--panel-elevated)] p-4 lg:self-start">
                <h3 className="font-display text-2xl">Relatar bug</h3>
                <p className="mt-2 font-body text-sm text-[var(--panel-soft-text)]">
                  Descreva o problema e envie o contexto desta tela automaticamente.
                </p>
                <textarea
                  value={bugMessage}
                  onChange={(event) => setBugMessage(event.target.value)}
                  placeholder="Explique o que aconteceu, em qual etapa e se isso se repete."
                  className="mt-4 min-h-[180px] w-full resize-none rounded-[24px] border border-[var(--control-border)] bg-[var(--control-surface)] px-4 py-3 font-body text-base text-[var(--control-text)] outline-none transition-colors placeholder:text-[var(--control-soft-text)] focus:border-surface-primary"
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
                <section className="rounded-[28px] border border-[var(--control-border)] bg-[var(--panel-elevated)] p-4">
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
                        className={`min-h-10 rounded-full border px-4 py-2 font-condensed text-sm uppercase tracking-[0.24em] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] ${
                          colorScheme === option.value
                            ? "border-surface-primary bg-surface-primary text-white"
                            : "border-[var(--control-border)] bg-[var(--control-surface)] text-[var(--control-text)]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-[var(--control-border)] bg-[var(--panel-elevated)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl">Animacao do background</h3>
                      <p className="mt-1 font-body text-sm text-[var(--panel-soft-text)]">
                        Ligue para usar o fundo animado. Desligado deixa a tela mais limpa e leve.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={backgroundAnimationEnabled}
                      onClick={() => handleAnimationChange(!backgroundAnimationEnabled)}
                      className={`flex h-10 w-14 shrink-0 items-center rounded-full px-1 transition-colors focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] ${
                        backgroundAnimationEnabled
                          ? "justify-end bg-game-safe"
                          : "justify-start bg-[var(--control-surface-muted)]"
                      }`}
                    >
                      <span className="h-6 w-6 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-transform" />
                    </button>
                  </div>
                </section>

                <section className="rounded-[28px] border border-[var(--control-border)] bg-[var(--panel-elevated)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl">Sons do jogo</h3>
                      <p className="mt-1 font-body text-sm text-[var(--panel-soft-text)]">
                        Ative para ouvir efeitos sonoros durante o jogo.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!soundMuted}
                      onClick={toggleSoundMute}
                      className={`flex h-10 w-14 shrink-0 items-center rounded-full px-1 transition-colors focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] ${
                        !soundMuted
                          ? "justify-end bg-game-safe"
                          : "justify-start bg-[var(--control-surface-muted)]"
                      }`}
                    >
                      <span className="h-6 w-6 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-transform" />
                    </button>
                  </div>
                </section>

                <section className="rounded-[28px] border border-[var(--control-border)] bg-[var(--panel-elevated)] p-4">
                  <h3 className="font-display text-2xl">Acessibilidade visual</h3>
                  <p className="mt-2 font-body text-sm text-[var(--panel-soft-text)]">
                    O app respeita seu tema claro ou escuro e usa o fundo visual atual da interface. Os temas da sala continuam sendo escolhidos dentro do lobby.
                  </p>
                  <p className="mt-2 font-body text-sm text-[var(--panel-soft-text)]">
                    Fundo visual atual: <span className="font-display text-[var(--panel-text)]">{enabledThemeId === "classico" ? "Classico" : enabledThemeId}</span>
                  </p>
                </section>
              </div>
            </div>
      </Modal>
    </>
  );
}
