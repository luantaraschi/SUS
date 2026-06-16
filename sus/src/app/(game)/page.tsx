"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Icon } from "@iconify/react";
import { motion, useReducedMotion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import GameCircle from "@/components/game/GameCircle";
import { Button } from "@/components/ui/button";
import GameInput from "@/components/game/GameInput";
import FormField from "@/components/game/FormField";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import SignInModal from "@/components/auth/SignInModal";
import GameSettingsButton from "@/components/game/GameSettingsButton";

import { BubbleText } from "@/components/ui/bubble-text";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useBackground } from "@/lib/BackgroundContext";
import { useSessionId } from "@/lib/useSessionId";

function randomSeed(): string {
  const seed = Math.random().toString(36).substring(2, 10);
  return seed || crypto.randomUUID().slice(0, 8);
}

const PRESET_AVATARS = [
  "Jasper",
  "Felix",
  "Luna",
  "Oliver",
  "Cleo",
  "Milo",
  "Bella",
  "Zoe",
  "Leo",
  "Lily",
  "Charlie",
  "Lucy",
  "Max",
  "Mia",
  "Finn",
  "Jack",
  "Oscar",
  "Ruby",
  "Chloe",
  "Sam",
  "Daisy",
  "Buster",
  "Coco",
  "Rocky",
];

export default function HomePage() {
  const router = useRouter();
  const sessionId = useSessionId();
  const { setVariant, flashInvalid } = useBackground();
  const reduceMotion = useReducedMotion();

  const profile = useQuery(api.profiles.current);
  const linkSession = useMutation(api.users.linkSession);
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);

  const [guestName, setGuestName] = useState("");
  const [code, setCode] = useState("");
  const [anonNumber] = useState(() => Math.floor(Math.random() * 900) + 100);
  const [guestAvatarSeed, setGuestAvatarSeed] = useState(() => randomSeed());
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shakePanel, setShakePanel] = useState(false);

  const roomExists = useQuery(
    api.rooms.checkRoomExists,
    code.length === 4 ? { code: code.toUpperCase() } : "skip"
  );

  useEffect(() => {
    if (code.length < 4) {
      setVariant("default");
      return;
    }

    if (roomExists === true) {
      setVariant("valid");
      return;
    }

    setVariant("default");
  }, [code, roomExists, setVariant]);

  const isLoggedIn = profile !== null && profile !== undefined;
  const displayName = isLoggedIn ? profile.displayName : guestName || `Anonimo${anonNumber}`;
  const avatarSeed = isLoggedIn ? profile.avatarSeed : guestAvatarSeed;
  const avatarImageUrl = isLoggedIn ? profile.avatarUrl : null;

  const handleShuffleAvatar = useCallback(() => {
    setSpinning(true);
    setGuestAvatarSeed(randomSeed());
    window.setTimeout(() => setSpinning(false), 400);
  }, []);

  const handleJoin = useCallback(async () => {
    if (!sessionId || code.length !== 4) return;

    setLoading(true);
    setError("");

    try {
      await joinRoom({
        code: code.toUpperCase(),
        playerName: displayName,
        playerEmoji: avatarSeed,
        playerAvatarImageUrl: avatarImageUrl ?? undefined,
        sessionId,
      });
      router.push(`/room/${code.toUpperCase()}`);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Erro ao entrar na sala.");
      flashInvalid();
      setShakePanel(true);
      window.setTimeout(() => setShakePanel(false), 500);
    } finally {
      setLoading(false);
    }
  }, [avatarImageUrl, avatarSeed, code, displayName, flashInvalid, joinRoom, router, sessionId]);

  const handleCreate = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError("");

    try {
      const result = await createRoom({
        hostName: displayName,
        hostEmoji: avatarSeed,
        hostAvatarImageUrl: avatarImageUrl ?? undefined,
        mode: "word",
        sessionId,
      });
      router.push(`/room/${result.code}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Erro ao criar sala.");
    } finally {
      setLoading(false);
    }
  }, [avatarImageUrl, avatarSeed, createRoom, displayName, router, sessionId]);

  if (!sessionId || profile === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-display text-2xl text-[var(--color-text)] animate-pulse">Carregando...</p>
      </div>
    );
  }

  const codeValid = code.length === 4 && roomExists === true;

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {/* Top bar: settings + account/profile */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-end px-4 pt-3 sm:px-6 sm:pt-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <GameSettingsButton sessionId={sessionId} />
          {isLoggedIn ? (
            <button
              onClick={() => router.push("/profile")}
              className="flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-md)] transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
            >
              <PlayerAvatar
                name={profile.displayName}
                avatarSeed={profile.avatarSeed}
                imageUrl={profile.avatarUrl}
                size="sm"
                hideName
              />
              <span className="hidden font-display text-sm tracking-widest sm:inline">Perfil</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSignIn(true)}
              className="flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-md)] transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
            >
              <Icon icon="solar:user-circle-bold" width={22} height={22} />
              <span className="hidden font-display text-sm tracking-widest sm:inline">Criar Conta</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex w-full min-h-0 flex-1 flex-col px-3 pt-4 sm:px-4 sm:pt-6">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-4">
          <div
            className={`flex w-full max-w-[440px] flex-col items-center -mt-10 sm:-mt-14 ${
              shakePanel ? "animate-shake" : ""
            }`}
          >
            {/* Title + tagline */}
            <BubbleText
              text="SUS"
              className="font-display text-[clamp(3.4rem,16vw,5.6rem)] leading-[0.9] tracking-[0.08em] [text-shadow:0_5px_0_rgba(0,0,0,0.18),0_0_34px_rgba(214,77,194,0.4)]"
            />
            <p className="mt-1 text-center font-body text-[clamp(0.78rem,3.4vw,0.95rem)] tracking-wide text-[var(--color-text-muted)]">
              o jogo de quem é o impostor
            </p>

            {/* Avatar with gentle bob + crown + swap */}
            <div className="relative z-20 mt-3 -mb-7 flex flex-col items-center sm:-mb-9">
              <motion.button
                onClick={() => {
                  if (isLoggedIn) {
                    router.push("/profile");
                  } else {
                    setIsAvatarModalOpen(true);
                  }
                }}
                animate={
                  reduceMotion
                    ? undefined
                    : { y: [0, -7, 0], rotate: spinning ? 360 : 0 }
                }
                transition={
                  spinning
                    ? { duration: 0.4, ease: "easeInOut" }
                    : {
                        y: { duration: 3.2, ease: "easeInOut", repeat: Infinity },
                      }
                }
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative rounded-full focus:outline-none focus-visible:shadow-[var(--ring-focus)]"
                aria-label={isLoggedIn ? "Abrir perfil" : "Escolher avatar"}
              >
                <PlayerAvatar
                  name={displayName}
                  avatarSeed={avatarSeed}
                  imageUrl={avatarImageUrl}
                  isHost
                  size="2xl"
                  hideName
                />
              </motion.button>

              {isLoggedIn ? (
                <button
                  onClick={() => router.push("/profile")}
                  className="mt-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-2 text-xs font-condensed uppercase tracking-[0.24em] text-[var(--color-text-muted)] backdrop-blur-[var(--blur-md)] transition-colors duration-[var(--t-quick)] hover:bg-[var(--glass-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
                >
                  Editar no perfil
                </button>
              ) : (
                <button
                  onClick={handleShuffleAvatar}
                  className="absolute -right-1 bottom-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[var(--color-surface-white)] bg-[linear-gradient(180deg,var(--color-primary-1),var(--color-primary-2))] text-white shadow-[var(--shadow-md)] transition-transform duration-[var(--t-quick)] hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] sm:bottom-3 sm:right-0 sm:h-16 sm:w-16 sm:border-[5px]"
                  title="Trocar Avatar"
                  aria-label="Gerar novo avatar"
                >
                  <Icon icon="solar:refresh-bold" width={26} height={26} className="sm:h-8 sm:w-8" />
                </button>
              )}
            </div>

            {/* Glass card */}
            <GameCircle className="mt-2 px-5 pb-5 pt-14 sm:px-7 sm:pb-6 sm:pt-16">
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex w-full flex-col items-center"
              >
                <div className="flex w-full max-w-[380px] flex-col items-center gap-3.5">
                  <motion.div variants={staggerItem} className="w-full">
                    <FormField
                      help={
                        isLoggedIn
                          ? "O nome e a foto usados nas salas vem do seu perfil."
                          : undefined
                      }
                    >
                      <GameInput
                        id="home-name"
                        aria-label="Seu nome"
                        value={isLoggedIn ? displayName : guestName}
                        onChange={isLoggedIn ? () => undefined : setGuestName}
                        placeholder={`Anonimo${anonNumber}`}
                        variant="text"
                        maxLength={20}
                        readOnly={isLoggedIn}
                      />
                    </FormField>
                  </motion.div>

                  <motion.div variants={staggerItem} className="w-full">
                    <FormField error={error || undefined}>
                      <GameInput
                        id="home-code"
                        aria-label="Codigo da sala"
                        value={code}
                        onChange={(value) => setCode(value.toUpperCase())}
                        placeholder="Codigo"
                        variant="code"
                        maxLength={4}
                        state={error ? "error" : codeValid ? "focus" : "default"}
                      />
                    </FormField>
                  </motion.div>

                  <motion.div
                    variants={staggerItem}
                    className="my-1 h-px w-full bg-[linear-gradient(90deg,transparent,var(--glass-border),transparent)]"
                  />

                  <div className="flex w-full flex-col gap-3">
                    <motion.div variants={staggerItem}>
                      <Button
                        variant="primary"
                        size="game-lg"
                        disabled={loading}
                        onClick={handleCreate}
                      >
                        <Icon icon="solar:add-circle-bold" width={22} height={22} />
                        Criar Sala
                      </Button>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                      <Button
                        variant="glass"
                        size="game-lg"
                        disabled={code.length !== 4 || loading}
                        onClick={handleJoin}
                      >
                        <Icon icon="solar:login-2-bold" width={20} height={20} />
                        Entrar
                      </Button>
                    </motion.div>

                    <motion.div variants={staggerItem}>
                      <button
                        onClick={() => setShowHowToPlay(true)}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--r-md)] border border-dashed border-[var(--w-28)] font-display text-sm uppercase tracking-widest text-[var(--color-text-muted)] transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--glass-1)] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
                      >
                        <Icon icon="solar:book-2-bold" width={18} height={18} />
                        Como Jogar
                      </button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </GameCircle>
          </div>
        </div>
      </div>

      {isAvatarModalOpen && !isLoggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-[var(--r-xl)] bg-[var(--panel-elevated)] p-5 text-[var(--panel-text)] shadow-2xl animate-in fade-in zoom-in duration-200 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-[var(--panel-text)]">Escolha seu Avatar</h2>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="rounded-full p-1 text-[var(--panel-soft-text)] transition-colors hover:bg-[var(--panel-muted)] hover:text-[var(--panel-text)]"
                aria-label="Fechar"
              >
                <Icon icon="solar:close-circle-bold" width={32} height={32} />
              </button>
            </div>

            <div className="grid max-h-[50vh] grid-cols-4 gap-3 overflow-y-auto p-2 sm:grid-cols-5 custom-scrollbar">
              {PRESET_AVATARS.map((seed) => (
                <button
                  key={seed}
                  onClick={() => {
                    setGuestAvatarSeed(seed);
                    setIsAvatarModalOpen(false);
                  }}
                  className={`flex items-center justify-center transition-transform duration-[var(--t-quick)] hover:scale-110 active:scale-95 ${
                    guestAvatarSeed === seed ? "scale-105 rounded-full ring-4 ring-surface-primary" : ""
                  }`}
                >
                  <PlayerAvatar name={displayName} avatarSeed={seed} size="md" hideName />
                </button>
              ))}
            </div>

            <div className="mt-1 border-t border-[var(--control-border)] pt-3">
              <Button
                variant="glass"
                size="game-md"
                onClick={() => {
                  setGuestAvatarSeed(randomSeed());
                  setIsAvatarModalOpen(false);
                }}
                className="!h-12 !text-base"
              >
                <Icon icon="solar:refresh-bold" width={20} height={20} />
                <span>Gerar Aleatorio</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <HowToPlayModal open={showHowToPlay} onClose={() => setShowHowToPlay(false)} />

      <SignInModal
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={() => {
          setShowSignIn(false);
          if (!sessionId) return;
          void linkSession({ sessionId });
        }}
      />
    </div>
  );
}
