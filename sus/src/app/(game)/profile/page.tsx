"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { BubbleText } from "@/components/ui/bubble-text";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Burst } from "@/components/ui/Burst";
import { useSessionId } from "@/lib/useSessionId";
import { staggerContainer, staggerItem, spring } from "@/lib/motion";

function randomSeed() {
  const seed = Math.random().toString(36).slice(2, 10);
  return seed || crypto.randomUUID().slice(0, 8);
}

function isVictory(game: { wasImpostor: number; correctVotes: number; timesSurvived: number }): boolean {
  if (game.wasImpostor > 0) {
    return game.timesSurvived > 0;
  }
  return game.correctVotes > 0;
}

// ---------------------------------------------------------------------------
// CountUp — a record reading that rolls from 0 to its value, then pops on
// settle. Driven by a framer spring (a motion value, NOT setState-in-effect),
// so it satisfies the React Compiler lint. A keyed pop overlay fires on the
// final value via AnimatePresence.
// ---------------------------------------------------------------------------
function CountUp({
  value,
  className,
  reduce,
}: {
  value: number;
  className?: string;
  reduce: boolean;
}) {
  const mv = useMotionValue(reduce ? value : 0);
  const spr = useSpring(mv, { stiffness: 90, damping: 18 });
  const rounded = useTransform(spr, (v) => String(Math.round(v)));

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  if (reduce) {
    return <span className={`tnum ${className ?? ""}`}>{value}</span>;
  }

  return (
    <motion.span
      className={`tnum inline-block ${className ?? ""}`}
      // The whole number gives one settle-pop when the target changes.
      key={value}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.18, 1] }}
      transition={{ ...spring.pop, delay: 0.45 }}
    >
      <motion.span>{rounded}</motion.span>
    </motion.span>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const sessionId = useSessionId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signOut } = useAuthActions();
  const reduceMotion = useReducedMotion() ?? false;

  const profile = useQuery(api.profiles.current);
  const histories = useQuery(api.history.getPlayerHistory, sessionId ? { sessionId, userId: profile?.userId } : "skip");
  const generateUploadUrl = useMutation(api.profiles.generateUploadUrl);
  const updateMyProfile = useMutation(api.profiles.updateMyProfile);

  const [displayName, setDisplayName] = useState("");
  const [avatarMode, setAvatarMode] = useState<"generated" | "upload">("generated");
  const [avatarSeed, setAvatarSeed] = useState(() => randomSeed());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // Signature: a confetti burst + spring-bump on a successful save.
  const [saveBurst, setSaveBurst] = useState(0);
  // Shuffle settle burst from the hero avatar.
  const [shuffleBurst, setShuffleBurst] = useState(0);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setAvatarMode(profile.avatarMode);
    setAvatarSeed(profile.avatarSeed || randomSeed());
    setPreviewUrl(profile.avatarUrl);
    setSelectedFile(null);
  }, [profile]);

  const handleLogout = () => {
    void signOut();
    router.push("/");
  };

  const totalGames = histories?.length ?? 0;
  const impostorGames = histories?.filter((history) => history.wasImpostor > 0).length ?? 0;
  const wins = histories?.filter((history) => isVictory(history)).length ?? 0;
  const crewWins =
    histories?.filter((history) => history.wasImpostor === 0 && history.correctVotes > 0).length ?? 0;
  const losses = totalGames - wins;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  const currentImage = avatarMode === "upload" ? previewUrl : null;
  const statsTitle = profile?.displayName ?? "Visitante";

  const recentGames = useMemo(() => histories ?? [], [histories]);

  const handleShuffleAvatar = () => {
    setSpinning(true);
    setAvatarMode("generated");
    setAvatarSeed(randomSeed());
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage("");
    setSaveMessage("");
    window.setTimeout(() => {
      setSpinning(false);
      setShuffleBurst((n) => n + 1);
    }, 400);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Escolha um arquivo de imagem valido.");
      return;
    }

    setErrorMessage("");
    setSaveMessage("");
    setSelectedFile(file);
    setAvatarMode("upload");

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);
    setErrorMessage("");
    setSaveMessage("");

    try {
      let avatarStorageId = profile.avatarStorageId ?? undefined;

      if (avatarMode === "upload" && selectedFile) {
        const uploadUrl = await generateUploadUrl({});
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });

        if (!uploadResponse.ok) {
          throw new Error("Nao foi possivel enviar a imagem do avatar.");
        }

        const uploadResult = (await uploadResponse.json()) as { storageId?: string };
        if (!uploadResult.storageId) {
          throw new Error("O upload do avatar nao retornou um arquivo valido.");
        }

        avatarStorageId = uploadResult.storageId as typeof avatarStorageId;
      }

      await updateMyProfile({
        displayName,
        avatarMode,
        avatarSeed,
        avatarStorageId,
      });

      setSaveMessage("Perfil salvo.");
      setSelectedFile(null);
      setSaveBurst((n) => n + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!sessionId || histories === undefined || profile === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-display text-2xl text-[var(--color-text)] animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  const t = reduceMotion ? { duration: 0 } : spring.gentle;

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 py-8 pb-20">
      {/* Top bar */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex w-full max-w-4xl items-center justify-between"
      >
        <motion.button
          variants={staggerItem}
          transition={reduceMotion ? { duration: 0 } : spring.press}
          whileHover={reduceMotion ? undefined : { scale: 1.05, x: -2 }}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          onClick={() => router.push("/")}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-md)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
          aria-label="Voltar ao inicio"
        >
          <Icon icon="solar:arrow-left-bold" width={22} height={22} />
        </motion.button>

        {/* Eyebrow — frames the page as the agent HQ / dossie. */}
        <motion.span
          variants={staggerItem}
          transition={t}
          className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-3 py-1.5 font-condensed text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-muted)] sm:text-xs"
        >
          <Icon icon="solar:shield-user-bold" width={15} height={15} className="text-[var(--color-special)]" />
          QG do Agente
        </motion.span>

        {profile && (
          <motion.button
            variants={staggerItem}
            transition={reduceMotion ? { duration: 0 } : spring.press}
            whileHover={reduceMotion ? undefined : { scale: 1.04 }}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            onClick={handleLogout}
            className="flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--color-imp)]/40 bg-[var(--color-imp)]/15 px-5 font-display text-sm uppercase tracking-widest text-[var(--color-imp)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-md)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--color-imp)]/25 focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
          >
            <Icon icon="solar:logout-2-bold" width={18} height={18} />
            <span className="hidden sm:inline">Sair da Conta</span>
          </motion.button>
        )}
      </motion.div>

      {/* Hero: avatar + name, framed with a Home-style spotlight ring. */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col items-center gap-3"
      >
        <motion.div variants={staggerItem} transition={t} className="relative">
          {/* Concentric spotlight — echoes Home / the Speaking stage. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: "150%",
              height: "150%",
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--color-special) 30%, transparent) 0%, transparent 70%)",
              filter: "blur(12px)",
            }}
            animate={reduceMotion ? undefined : { opacity: [0.6, 0.95, 0.6], scale: [1, 1.06, 1] }}
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

          {/* Shuffle-on-tap mascot — slot-machine swap on seed change. */}
          <motion.button
            type="button"
            onClick={handleShuffleAvatar}
            animate={reduceMotion ? undefined : { rotate: spinning ? 360 : 0 }}
            transition={
              spinning ? { duration: 0.4, ease: "easeInOut" } : reduceMotion ? { duration: 0 } : spring.gentle
            }
            whileHover={reduceMotion ? undefined : { scale: 1.05, rotate: 3 }}
            whileTap={reduceMotion ? undefined : { scale: 0.94 }}
            className="group/hero relative rounded-full focus:outline-none focus-visible:shadow-[var(--ring-focus)]"
            aria-label="Gerar novo avatar"
            title="Tocar para gerar um novo avatar"
          >
            <motion.div
              key={`${currentImage ?? "generated"}:${avatarSeed}`}
              initial={reduceMotion ? false : { scaleX: 0.6, opacity: 0.7 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={reduceMotion ? { duration: 0 } : spring.pop}
            >
              <PlayerAvatar name={statsTitle} avatarSeed={avatarSeed} imageUrl={currentImage} size="2xl" hideName />
            </motion.div>
            <Burst fire={shuffleBurst} count={8} colors={["var(--color-special)", "var(--color-gold)"]} />
          </motion.button>
        </motion.div>

        <motion.div variants={staggerItem} transition={t}>
          <BubbleText
            text={statsTitle}
            className="font-display text-[clamp(2.2rem,10vw,3.8rem)] leading-[1] tracking-wide [text-shadow:0_3px_0_rgba(0,0,0,0.18),0_0_28px_rgba(214,77,194,0.4)]"
          />
        </motion.div>

        {/* Agent line: win-rate readout right under the name. */}
        {totalGames > 0 && (
          <motion.span
            variants={staggerItem}
            transition={t}
            className="inline-flex items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-3.5 py-1.5 font-condensed text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
          >
            <Icon icon="solar:graph-up-bold" width={15} height={15} className="text-[var(--color-gold)]" />
            <span className="tnum text-[var(--color-text)]">{winRate}%</span> de vitorias
          </motion.span>
        )}

        {!profile && (
          <motion.p
            variants={staggerItem}
            transition={t}
            className="max-w-sm text-center font-body text-sm text-[var(--color-text-muted)]"
          >
            Crie uma conta para sincronizar seu nome e sua foto entre dispositivos.
          </motion.p>
        )}
      </motion.div>

      {/* Main card */}
      {profile && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={t}
          className="w-full max-w-4xl rounded-[var(--r-2xl)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-5 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-lg)] sm:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Edit profile panel */}
            <div className="flex flex-col gap-5 rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-5">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)]"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary-1) 18%, var(--glass-2))",
                    color: "var(--color-primary-1)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
                  }}
                >
                  <Icon icon="solar:pen-new-square-bold" width={18} height={18} />
                </span>
                <div>
                  <p className="font-condensed text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
                    Dossie
                  </p>
                  <h2 className="font-display text-2xl leading-tight text-[var(--color-text)]">Editar Perfil</h2>
                </div>
              </div>
              <p className="-mt-2 font-body text-sm text-[var(--color-text-muted)]">
                O nome e a foto salvos aqui passam a ser usados ao criar ou entrar em novas salas.
              </p>

              <label className="flex flex-col gap-2">
                <span className="font-condensed text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                  Nome do Perfil
                </span>
                <motion.input
                  whileFocus={reduceMotion ? undefined : { scale: 1.01 }}
                  transition={spring.gentle}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value.slice(0, 20))}
                  maxLength={20}
                  className="h-14 rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-4 font-display text-xl text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-1)] focus:bg-[var(--glass-1)] focus-visible:shadow-[var(--ring-focus)] transition-[background-color,border-color] duration-[var(--t-quick)]"
                />
              </label>

              <div className="flex flex-col gap-3">
                <span className="font-condensed text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                  Foto ou Avatar
                </span>

                {/* Mode toggle via the shared SegmentedControl. */}
                <SegmentedControl
                  aria-label="Tipo de avatar"
                  tone="primary"
                  value={avatarMode}
                  onChange={(v) => {
                    if (v === "upload") {
                      setAvatarMode("upload");
                      fileInputRef.current?.click();
                    } else {
                      setAvatarMode("generated");
                    }
                  }}
                  options={[
                    {
                      value: "generated",
                      label: "Gerado",
                      icon: <Icon icon="solar:magic-stick-3-bold" width={16} height={16} />,
                    },
                    {
                      value: "upload",
                      label: "Enviar Foto",
                      icon: <Icon icon="solar:gallery-add-bold" width={16} height={16} />,
                    },
                  ]}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2.5">
                  <motion.div
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                    transition={spring.press}
                    className="flex-1"
                  >
                    <Button
                      variant="glass"
                      size="game-md"
                      className="!h-11 !text-sm"
                      onClick={handleShuffleAvatar}
                    >
                      <motion.span
                        className="inline-flex"
                        animate={reduceMotion ? undefined : { rotate: spinning ? 360 : 0 }}
                        transition={spinning ? { duration: 0.4, ease: "easeInOut" } : { duration: 0 }}
                      >
                        <Icon icon="solar:refresh-bold" width={16} height={16} />
                      </motion.span>
                      Gerar Novo Avatar
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                    transition={spring.press}
                    className="flex-1"
                  >
                    <Button
                      variant="glass"
                      size="game-md"
                      className="!h-11 !text-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icon icon="solar:gallery-add-bold" width={16} height={16} />
                      Escolher Foto
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Status line — drawn check on success, rose on error. */}
              <div className="min-h-[24px]">
                <AnimatePresence mode="wait">
                  {errorMessage ? (
                    <motion.p
                      key="err"
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                      className="font-body text-sm text-[var(--color-imp)]"
                    >
                      {errorMessage}
                    </motion.p>
                  ) : saveMessage ? (
                    <motion.p
                      key="ok"
                      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                      className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-safe)]"
                    >
                      <DrawnCheck reduce={reduceMotion} />
                      {saveMessage}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Save — success flourish: spring-bump + confetti burst. */}
              <div className="relative">
                <Burst fire={saveBurst} colors={["var(--color-safe)", "var(--color-gold)"]} />
                <motion.div
                  key={saveBurst}
                  animate={
                    saveBurst > 0 && !reduceMotion ? { scale: [1, 1.03, 1] } : { scale: 1 }
                  }
                  transition={spring.pop}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                >
                  <Button
                    variant="primary"
                    size="game-lg"
                    disabled={isSaving || !displayName.trim()}
                    onClick={handleSaveProfile}
                    className="hover:brightness-110"
                  >
                    {isSaving ? (
                      <Icon icon="solar:refresh-bold" width={20} height={20} className="animate-spin" />
                    ) : (
                      <Icon icon="solar:diskette-bold" width={20} height={20} />
                    )}
                    {isSaving ? "Salvando..." : "Salvar Perfil"}
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Stats record — count-up numbers with win/loss tinting. */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-3 sm:gap-3.5"
            >
              {[
                {
                  icon: "solar:gamepad-bold",
                  color: "var(--color-info)",
                  value: totalGames,
                  label: "Partidas",
                  tone: "info" as const,
                },
                {
                  icon: "solar:medal-star-bold",
                  color: "var(--color-gold)",
                  value: wins,
                  label: "Vitorias",
                  tone: "safe" as const,
                },
                {
                  icon: "solar:ghost-bold",
                  color: "var(--color-imp)",
                  value: impostorGames,
                  label: "Vezes Impostor",
                  tone: "imp" as const,
                },
                {
                  icon: "solar:magnifer-bold",
                  color: "var(--color-safe)",
                  value: crewWins,
                  label: "Acertos",
                  tone: "safe" as const,
                },
              ].map((stat) => {
                const tintBorder =
                  stat.tone === "safe"
                    ? "color-mix(in srgb, var(--color-safe) 32%, var(--glass-border))"
                    : stat.tone === "imp"
                      ? "color-mix(in srgb, var(--color-imp) 32%, var(--glass-border))"
                      : "var(--glass-border)";
                return (
                  <motion.div
                    key={stat.label}
                    variants={staggerItem}
                    transition={t}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    className="flex flex-col items-center justify-center gap-2 rounded-[var(--r-lg)] border bg-[var(--glass-1)] p-4 text-center transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)]"
                    style={{ borderColor: tintBorder }}
                  >
                    <Icon icon={stat.icon} width={32} height={32} style={{ color: stat.color }} />
                    <CountUp
                      value={stat.value}
                      reduce={reduceMotion}
                      className="block font-display text-3xl text-[var(--color-text)]"
                    />
                    <span className="font-condensed text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                      {stat.label}
                    </span>
                  </motion.div>
                );
              })}

              {/* Record summary strip: wins vs losses. */}
              {totalGames > 0 && (
                <motion.div
                  variants={staggerItem}
                  transition={t}
                  className="col-span-2 flex items-center justify-between gap-3 rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-4 py-3"
                >
                  <span className="inline-flex items-center gap-1.5 font-condensed text-xs uppercase tracking-[0.18em] text-[var(--color-safe)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-safe)]" />
                    <span className="tnum">{wins}</span> V
                  </span>
                  {/* Win/loss ratio bar. */}
                  <div className="relative h-2 flex-1 overflow-hidden rounded-[var(--r-pill)] bg-[var(--color-imp)]/25">
                    <motion.span
                      aria-hidden
                      className="absolute inset-y-0 left-0 origin-left rounded-[var(--r-pill)] bg-[var(--color-safe)]"
                      initial={reduceMotion ? { width: `${winRate}%` } : { width: 0 }}
                      animate={{ width: `${winRate}%` }}
                      transition={reduceMotion ? { duration: 0 } : { ...spring.gentle, delay: 0.3 }}
                    />
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-condensed text-xs uppercase tracking-[0.18em] text-[var(--color-imp)]">
                    <span className="tnum">{losses}</span> D
                    <span className="h-2 w-2 rounded-full bg-[var(--color-imp)]" />
                  </span>
                </motion.div>
              )}

              <motion.button
                variants={staggerItem}
                transition={t}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                onClick={() => router.push("/profile/packs")}
                className="col-span-2 flex items-center justify-center gap-2.5 rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-5 py-4 font-display text-base text-[var(--color-text)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
              >
                <Icon icon="solar:folder-with-files-bold" width={22} height={22} className="text-[var(--color-special)]" />
                Meus Pacotes Customizados
                <Icon icon="solar:arrow-right-bold" width={18} height={18} className="text-[var(--color-text-muted)]" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Game history */}
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduceMotion ? { duration: 0 } : { ...spring.gentle, delay: 0.12 }}
        className="w-full max-w-4xl rounded-[var(--r-2xl)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-5 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-lg)] sm:p-7"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2.5 font-display text-2xl text-[var(--color-text)]">
            <Icon icon="solar:history-bold" width={26} height={26} className="text-[var(--color-primary-1)]" />
            Ultimas Partidas
          </h3>
          {recentGames.length > 0 && (
            <span className="rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-3 py-1 font-condensed text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              <span className="tnum">{recentGames.length}</span> registros
            </span>
          )}
        </div>

        {recentGames.length === 0 ? (
          /* Empty history state */
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={t}
            className="flex flex-col items-center gap-4 rounded-[var(--r-lg)] border border-dashed border-[var(--w-28)] bg-[var(--glass-1)] px-6 py-10 text-center"
          >
            <motion.span
              animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
              transition={reduceMotion ? undefined : { duration: 3.2, ease: "easeInOut", repeat: Infinity }}
            >
              <Icon icon="solar:gamepad-bold" width={48} height={48} className="text-[var(--color-text-muted)] opacity-50" />
            </motion.span>
            <div className="flex flex-col gap-1.5">
              <p className="font-display text-lg text-[var(--color-text)]">Nenhuma partida ainda</p>
              <p className="font-body text-sm text-[var(--color-text-muted)]">
                Jogue uma rodada para registrar seu historico.
              </p>
            </div>
            <motion.button
              onClick={() => router.push("/")}
              whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
              transition={spring.press}
              className="mt-1 flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-6 font-display text-sm uppercase tracking-widest text-[var(--color-text)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--w-20)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
            >
              <Icon icon="solar:play-bold" width={16} height={16} />
              Jogar Agora
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-col gap-2.5"
          >
            {recentGames.map((game) => {
              const won = isVictory(game);
              return (
                <motion.div
                  key={game._id}
                  variants={staggerItem}
                  transition={t}
                  whileHover={reduceMotion ? undefined : { x: 3 }}
                  className="relative flex items-center justify-between gap-3 overflow-hidden rounded-[var(--r-md)] border bg-[var(--glass-1)] p-4 pl-5 transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)]"
                  style={{
                    borderColor: won
                      ? "color-mix(in srgb, var(--color-safe) 28%, var(--glass-border))"
                      : "color-mix(in srgb, var(--color-imp) 28%, var(--glass-border))",
                  }}
                >
                  {/* Outcome tint stripe down the left edge. */}
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: won ? "var(--color-safe)" : "var(--color-imp)" }}
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base text-[var(--color-text)]">Sala {game.roomCode}</span>
                      <span className="rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-2 py-0.5 font-condensed text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                        {game.mode}
                      </span>
                    </div>
                    <span className="font-body text-xs text-[var(--color-text-muted)]">
                      <span className="tnum">{new Date(game.playedAt).toLocaleDateString()}</span>
                      {" • "}
                      <span className="tnum">{game.totalPlayers}</span> jogadores
                    </span>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-[var(--r-pill)] px-3 py-0.5 font-display text-xs uppercase tracking-[0.16em] ${
                        won
                          ? "bg-[var(--color-safe)]/20 text-[var(--color-safe)]"
                          : "bg-[var(--color-imp)]/20 text-[var(--color-imp)]"
                      }`}
                    >
                      {won ? "Vitoria" : "Derrota"}
                    </span>
                    <span className="font-condensed text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                      {game.wasImpostor > 0 ? "Fui Impostor" : "Fui Tripulante"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

/** A small SVG check that draws itself on success (matches the settings panel). */
function DrawnCheck({ reduce }: { reduce: boolean }) {
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
