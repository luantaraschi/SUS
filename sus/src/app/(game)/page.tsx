"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import GameCircle from "@/components/game/GameCircle";
import { Button } from "@/components/ui/button";
import GameInput from "@/components/game/GameInput";
import FormField from "@/components/game/FormField";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import HowToPlayModal from "@/components/game/HowToPlayModal";
import SignInModal from "@/components/auth/SignInModal";
import GameSettingsButton from "@/components/game/GameSettingsButton";
import { Burst } from "@/components/ui/Burst";

import { BubbleText } from "@/components/ui/bubble-text";
import { spring, staggerContainer, staggerItem } from "@/lib/motion";
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
  // Burst triggers (a bumping counter re-fires the keyed Burst on settle).
  const [shuffleBurst, setShuffleBurst] = useState(0);
  const [createBurst, setCreateBurst] = useState(0);

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
    window.setTimeout(() => {
      setSpinning(false);
      // Confetti pops the moment the new face settles into place.
      setShuffleBurst((n) => n + 1);
    }, 400);
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
      // A small gold+special burst before we leave for the room.
      setCreateBurst((n) => n + 1);
      window.setTimeout(() => router.push(`/room/${result.code}`), 220);
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
  const codePending = code.length === 4 && roomExists === undefined;
  const codeMissing = code.length === 4 && roomExists === false;
  // The code input's reactive state for the door-check signature.
  const codeInputState: "default" | "focus" | "error" =
    error || codeMissing ? "error" : codeValid ? "focus" : "default";

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {/* Top bar: settings + account/profile */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-end px-4 pt-3 sm:px-6 sm:pt-4">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="pointer-events-auto flex items-center gap-2"
        >
          <motion.div variants={staggerItem}>
            <GameSettingsButton sessionId={sessionId} />
          </motion.div>
          {isLoggedIn ? (
            <motion.button
              variants={staggerItem}
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              transition={spring.press}
              onClick={() => router.push("/profile")}
              className="group/perfil flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-md)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
            >
              <motion.span
                className="inline-flex"
                whileHover={reduceMotion ? undefined : { y: [0, -3, 0] }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <PlayerAvatar
                  name={profile.displayName}
                  avatarSeed={profile.avatarSeed}
                  imageUrl={profile.avatarUrl}
                  size="sm"
                  hideName
                />
              </motion.span>
              <span className="hidden font-display text-sm tracking-widest sm:inline">Perfil</span>
            </motion.button>
          ) : (
            <motion.button
              variants={staggerItem}
              whileHover={reduceMotion ? undefined : { scale: 1.04 }}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              transition={spring.press}
              onClick={() => setShowSignIn(true)}
              className="flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-md)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
            >
              <Icon icon="solar:user-circle-bold" width={22} height={22} />
              <span className="hidden font-display text-sm tracking-widest sm:inline">Criar Conta</span>
            </motion.button>
          )}
        </motion.div>
      </div>

      <div className="flex w-full min-h-0 flex-1 flex-col px-3 pt-4 sm:px-4 sm:pt-6">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-4">
          <div
            className={`relative flex w-full max-w-[440px] flex-col items-center -mt-10 sm:-mt-14 ${
              shakePanel ? "animate-shake" : ""
            }`}
          >
            {/* Layered backlight behind title + mascot — additive, warm, LIT. */}
            {!reduceMotion ? (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[2%] -z-10 h-[460px] w-[460px] -translate-x-1/2 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in srgb, var(--color-special) 42%, transparent) 0%, transparent 62%)",
                  filter: "blur(var(--blur-lg))",
                }}
                animate={{ opacity: [0.55, 0.78, 0.55], scale: [1, 1.05, 1] }}
                transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
              />
            ) : (
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[2%] -z-10 h-[460px] w-[460px] -translate-x-1/2 rounded-full opacity-60"
                style={{
                  background:
                    "radial-gradient(circle, color-mix(in srgb, var(--color-special) 42%, transparent) 0%, transparent 62%)",
                  filter: "blur(var(--blur-lg))",
                }}
              />
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[20%] -z-10 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-70"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--color-primary-1) 50%, transparent) 0%, transparent 64%)",
                filter: "blur(var(--blur-lg))",
              }}
            />

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
              <div className="relative">
                {/* Concentric spotlight rings — echoes the Speaking stage. */}
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: "150%",
                    height: "150%",
                    background:
                      "radial-gradient(circle, color-mix(in srgb, var(--color-special) 30%, transparent) 0%, transparent 70%)",
                    filter: "blur(10px)",
                  }}
                  animate={
                    reduceMotion ? undefined : { opacity: [0.6, 0.95, 0.6], scale: [1, 1.06, 1] }
                  }
                  transition={{ duration: 3.6, ease: "easeInOut", repeat: Infinity }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--w-12)]"
                  style={{ width: "128%", height: "128%" }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--w-16)]"
                  style={{ width: "112%", height: "112%" }}
                />

                {/* Gesture layer (hover tilt + press + spin) owns scale/rotate;
                    a nested layer owns the idle y-bob + rare blink squash so the
                    looping transform never fights the gesture transform. */}
                <motion.button
                  onClick={() => {
                    if (isLoggedIn) {
                      router.push("/profile");
                    } else {
                      setIsAvatarModalOpen(true);
                    }
                  }}
                  animate={reduceMotion ? undefined : { rotate: spinning ? 360 : 0 }}
                  transition={
                    spinning ? { duration: 0.4, ease: "easeInOut" } : spring.gentle
                  }
                  whileHover={reduceMotion ? undefined : { scale: 1.06, rotate: 3 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                  className="group/mascot relative rounded-full focus:outline-none focus-visible:shadow-[var(--ring-focus)]"
                  aria-label={isLoggedIn ? "Abrir perfil" : "Escolher avatar"}
                >
                  {/* Hover spotlight brighten. */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-0 transition-opacity duration-[var(--t-quick)] group-hover/mascot:opacity-100"
                    style={{
                      background:
                        "radial-gradient(circle, color-mix(in srgb, var(--color-gold) 34%, transparent) 0%, transparent 68%)",
                      filter: "blur(14px)",
                    }}
                  />
                  {/* Idle: 3.2s y-bob + a rare ~6.4s blink/squash. */}
                  <motion.div
                    animate={
                      reduceMotion
                        ? undefined
                        : { y: [0, -7, 0, 0], scaleY: [1, 1, 0.92, 1] }
                    }
                    transition={
                      reduceMotion
                        ? undefined
                        : {
                            y: { duration: 3.2, ease: "easeInOut", repeat: Infinity },
                            scaleY: {
                              duration: 6.4,
                              times: [0, 0.92, 0.96, 1],
                              ease: "easeInOut",
                              repeat: Infinity,
                            },
                          }
                    }
                    style={{ willChange: "transform" }}
                  >
                    {/* Slot-machine swap: squash on X then spring back when the seed changes. */}
                    <motion.div
                      key={avatarSeed}
                      initial={reduceMotion ? false : { scaleX: 0.6, opacity: 0.7 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={reduceMotion ? { duration: 0 } : spring.pop}
                    >
                      <PlayerAvatar
                        name={displayName}
                        avatarSeed={avatarSeed}
                        imageUrl={avatarImageUrl}
                        isHost
                        size="2xl"
                        hideName
                      />
                    </motion.div>
                  </motion.div>

                  {/* Settle burst from the avatar after a shuffle. */}
                  <Burst
                    fire={shuffleBurst}
                    count={8}
                    colors={["var(--color-special)", "var(--color-gold)"]}
                  />
                </motion.button>
              </div>

              {isLoggedIn ? (
                <motion.button
                  onClick={() => router.push("/profile")}
                  whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  transition={spring.press}
                  className="mt-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 py-2 text-xs font-condensed uppercase tracking-[0.24em] text-[var(--color-text-muted)] backdrop-blur-[var(--blur-md)] transition-colors duration-[var(--t-quick)] hover:bg-[var(--glass-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
                >
                  Editar no perfil
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleShuffleAvatar}
                  whileHover={reduceMotion ? undefined : { scale: 1.1, rotate: 90 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  transition={spring.press}
                  className="absolute -right-1 bottom-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[var(--color-surface-white)] bg-[linear-gradient(180deg,var(--color-primary-1),var(--color-primary-2))] text-white shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] sm:bottom-3 sm:right-0 sm:h-16 sm:w-16 sm:border-[5px]"
                  title="Trocar Avatar"
                  aria-label="Gerar novo avatar"
                >
                  <motion.span
                    className="inline-flex"
                    animate={reduceMotion ? undefined : { rotate: spinning ? 360 : 0 }}
                    transition={spinning ? { duration: 0.4, ease: "easeInOut" } : { duration: 0 }}
                  >
                    <Icon icon="solar:refresh-bold" width={26} height={26} className="sm:h-8 sm:w-8" />
                  </motion.span>
                </motion.button>
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
                      {/* Focus pop via whileFocus — no remount, keeps the
                          caret/focus intact (a keyed wrapper would drop focus). */}
                      <motion.div
                        whileFocus={
                          reduceMotion || isLoggedIn ? undefined : { scale: 1.015 }
                        }
                        transition={spring.gentle}
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
                      </motion.div>
                    </FormField>
                  </motion.div>

                  <motion.div variants={staggerItem} className="w-full">
                    <FormField error={error || undefined}>
                      {/* SIGNATURE: the reactive "door check" code field. The live
                          <input> stays in a STABLE (never-keyed) wrapper so the
                          caret is never dropped; the per-char land pop + bloom run
                          on keyed pointer-events-none overlay layers instead. */}
                      <motion.div
                        className="relative overflow-hidden rounded-pill"
                        animate={
                          codeValid && !reduceMotion
                            ? { scale: [1, 1.012, 1] }
                            : { scale: 1 }
                        }
                        transition={spring.pop}
                      >
                        {/* Per-char land pop: a key bump on each length change
                            replays a 1.15 -> 1 scale + ring fade on this overlay
                            (no effect+setState, no input remount). Reads as the
                            field "catching" each typed character. */}
                        {!reduceMotion && code.length > 0 && !codeValid && !error ? (
                          <motion.span
                            aria-hidden
                            key={code.length}
                            className="pointer-events-none absolute inset-0 z-10 rounded-pill border-[3px]"
                            style={{
                              borderColor:
                                "color-mix(in srgb, var(--color-info) 60%, transparent)",
                            }}
                            initial={{ scale: 1.15, opacity: 0.85 }}
                            animate={{ scale: 1, opacity: 0 }}
                            transition={spring.pop}
                          />
                        ) : null}

                        <GameInput
                          id="home-code"
                          aria-label="Codigo da sala"
                          value={code}
                          onChange={(value) => setCode(value.toUpperCase())}
                          placeholder="Codigo"
                          variant="code"
                          maxLength={4}
                          state={codeInputState}
                        />
                        {/* "Checking the door" shimmer while we wait on roomExists. */}
                        {codePending && !reduceMotion ? (
                          <span className="shimmer-sweep rounded-pill" />
                        ) : null}

                        {/* Safe ring bloom on a confirmed room. */}
                        {codeValid && !reduceMotion ? (
                          <motion.span
                            aria-hidden
                            key="safe-bloom"
                            className="pointer-events-none absolute inset-0 z-10 rounded-pill"
                            initial={{ opacity: 0.9, scale: 1 }}
                            animate={{ opacity: 0, scale: 1.12 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{
                              boxShadow:
                                "0 0 0 3px color-mix(in srgb, var(--color-safe) 70%, transparent)",
                            }}
                          />
                        ) : null}
                      </motion.div>
                    </FormField>

                    {/* 'sala encontrada' confirmation row — pops in only when found. */}
                    <AnimatePresence>
                      {codeValid ? (
                        <motion.div
                          key="sala-encontrada"
                          initial={{ opacity: 0, y: -4, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={spring.gentle}
                          className="mt-2 flex items-center justify-center gap-2"
                        >
                          <motion.span
                            aria-hidden
                            className="h-2 w-2 rounded-full bg-[var(--color-safe)]"
                            animate={
                              reduceMotion
                                ? undefined
                                : { opacity: [0.5, 1, 0.5], scale: [1, 1.25, 1] }
                            }
                            transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
                          />
                          <span className="tnum font-condensed text-xs uppercase tracking-[0.22em] text-[var(--color-safe)]">
                            Sala encontrada · {code.toUpperCase()}
                          </span>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>

                  {/* Divider draws in from the center as its own stagger beat. */}
                  <motion.div
                    variants={staggerItem}
                    className="my-1 h-px w-full origin-center bg-[linear-gradient(90deg,transparent,var(--glass-border),transparent)]"
                    initial={reduceMotion ? undefined : { scaleX: 0 }}
                    animate={reduceMotion ? undefined : { scaleX: 1 }}
                    transition={spring.gentle}
                  />

                  <div className="flex w-full flex-col gap-3">
                    <motion.div variants={staggerItem} className="relative">
                      <motion.div
                        whileHover={reduceMotion || loading ? undefined : { y: -2 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                        transition={spring.press}
                      >
                        <Button
                          variant="primary"
                          size="game-lg"
                          disabled={loading}
                          onClick={handleCreate}
                          className="hover:brightness-110 hover:shadow-[var(--shadow-md)]"
                        >
                          {loading ? (
                            <Icon
                              icon="solar:refresh-bold"
                              width={22}
                              height={22}
                              className="animate-spin"
                            />
                          ) : (
                            <Icon icon="solar:add-circle-bold" width={22} height={22} />
                          )}
                          Criar Sala
                        </Button>
                      </motion.div>
                      {/* Success burst right before the route push. */}
                      <Burst
                        fire={createBurst}
                        count={12}
                        colors={["var(--color-gold)", "var(--color-special)"]}
                      />
                    </motion.div>

                    <motion.div variants={staggerItem}>
                      {/* Entrar "wakes up" only when a valid 4-char code exists. */}
                      <motion.div
                        animate={
                          codeValid
                            ? reduceMotion
                              ? { opacity: 1 }
                              : { opacity: 1, scale: [1, 1.03, 1] }
                            : { opacity: 0.5, scale: 1 }
                        }
                        transition={
                          codeValid && !reduceMotion ? spring.pop : { duration: 0.2 }
                        }
                        whileHover={
                          codeValid && !reduceMotion ? { y: -2 } : undefined
                        }
                        whileTap={
                          codeValid && !reduceMotion ? { scale: 0.96 } : undefined
                        }
                      >
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
                    </motion.div>

                    <motion.div variants={staggerItem}>
                      <motion.button
                        onClick={() => setShowHowToPlay(true)}
                        whileHover={reduceMotion ? undefined : { scale: 1.01 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        transition={spring.press}
                        className="group/how flex h-11 w-full items-center justify-center gap-2 rounded-[var(--r-md)] border border-dashed border-[var(--w-28)] font-display text-sm uppercase tracking-widest text-[var(--color-text-muted)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-1)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
                      >
                        <motion.span
                          className="inline-flex"
                          whileHover={
                            reduceMotion ? undefined : { rotate: [0, -12, 8, 0] }
                          }
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        >
                          <Icon icon="solar:book-2-bold" width={18} height={18} />
                        </motion.span>
                        Como Jogar
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </GameCircle>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAvatarModalOpen && !isLoggedIn && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setIsAvatarModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={spring.gentle}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-md flex-col gap-4 rounded-[var(--r-xl)] bg-[var(--panel-elevated)] p-5 text-[var(--panel-text)] shadow-2xl sm:p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-[var(--panel-text)]">Escolha seu Avatar</h2>
                <motion.button
                  onClick={() => setIsAvatarModalOpen(false)}
                  whileHover={reduceMotion ? undefined : { scale: 1.08, rotate: 90 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                  transition={spring.press}
                  className="rounded-full p-1 text-[var(--panel-soft-text)] transition-colors hover:bg-[var(--panel-muted)] hover:text-[var(--panel-text)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
                  aria-label="Fechar"
                >
                  <Icon icon="solar:close-circle-bold" width={32} height={32} />
                </motion.button>
              </div>

              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid max-h-[50vh] grid-cols-4 gap-3 overflow-y-auto p-2 sm:grid-cols-5 custom-scrollbar"
              >
                {PRESET_AVATARS.map((seed) => {
                  const selected = guestAvatarSeed === seed;
                  return (
                    <motion.button
                      key={seed}
                      variants={staggerItem}
                      onClick={() => {
                        setGuestAvatarSeed(seed);
                        setIsAvatarModalOpen(false);
                      }}
                      whileHover={reduceMotion ? undefined : { scale: 1.1 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                      transition={selected ? spring.pop : spring.press}
                      className={`flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] ${
                        selected ? "scale-105 ring-4 ring-surface-primary" : ""
                      }`}
                    >
                      <PlayerAvatar name={displayName} avatarSeed={seed} size="md" hideName />
                    </motion.button>
                  );
                })}
              </motion.div>

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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
