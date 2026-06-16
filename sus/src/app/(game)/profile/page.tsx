"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { BubbleText } from "@/components/ui/bubble-text";
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

export default function ProfilePage() {
  const router = useRouter();
  const sessionId = useSessionId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signOut } = useAuthActions();
  const reduceMotion = useReducedMotion();

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

  const currentImage = avatarMode === "upload" ? previewUrl : null;
  const statsTitle = profile?.displayName ?? "Visitante";

  const recentGames = useMemo(() => histories ?? [], [histories]);

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

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 py-8 pb-20">
      {/* Top bar */}
      <div className="flex w-full max-w-4xl items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex h-11 w-11 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-md)] transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] active:scale-[0.95] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
          aria-label="Voltar ao inicio"
        >
          <Icon icon="solar:arrow-left-bold" width={22} height={22} />
        </button>

        {profile && (
          <button
            onClick={handleLogout}
            className="flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--color-imp)]/40 bg-[var(--color-imp)]/15 px-5 font-display text-sm uppercase tracking-widest text-[var(--color-imp)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-md)] transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--color-imp)]/25 active:scale-[0.95] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
          >
            <Icon icon="solar:logout-2-bold" width={18} height={18} />
            Sair da Conta
          </button>
        )}
      </div>

      {/* Hero: avatar + name */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex flex-col items-center gap-3"
      >
        <motion.div variants={staggerItem} transition={reduceMotion ? { duration: 0 } : spring.gentle}>
          <PlayerAvatar name={statsTitle} avatarSeed={avatarSeed} imageUrl={currentImage} size="2xl" hideName />
        </motion.div>
        <motion.div variants={staggerItem} transition={reduceMotion ? { duration: 0 } : spring.gentle}>
          <BubbleText
            text={statsTitle}
            className="font-display text-[clamp(2.2rem,10vw,3.8rem)] leading-[1] tracking-wide [text-shadow:0_3px_0_rgba(0,0,0,0.18),0_0_28px_rgba(214,77,194,0.4)]"
          />
        </motion.div>
        {!profile && (
          <motion.p
            variants={staggerItem}
            transition={reduceMotion ? { duration: 0 } : spring.gentle}
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
          transition={reduceMotion ? { duration: 0 } : spring.gentle}
          className="w-full max-w-4xl rounded-[var(--r-2xl)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-5 shadow-[var(--shadow-lg)] backdrop-blur-[var(--blur-lg)] sm:p-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Edit profile panel */}
            <div className="flex flex-col gap-5 rounded-[var(--r-xl)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-5">
              <div>
                <h2 className="font-display text-2xl text-[var(--color-text)]">Editar Perfil</h2>
                <p className="mt-1.5 font-body text-sm text-[var(--color-text-muted)]">
                  O nome e a foto salvos aqui passam a ser usados ao criar ou entrar em novas salas.
                </p>
              </div>

              <label className="flex flex-col gap-2">
                <span className="font-condensed text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                  Nome do Perfil
                </span>
                <input
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

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAvatarMode("generated")}
                    className={`rounded-[var(--r-pill)] px-4 py-2 font-condensed text-xs uppercase tracking-[0.24em] transition-[background-color,color] duration-[var(--t-quick)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] ${
                      avatarMode === "generated"
                        ? "bg-[linear-gradient(180deg,var(--color-primary-1),var(--color-primary-2))] text-white shadow-[var(--shadow-sm)]"
                        : "border border-[var(--glass-border)] bg-[var(--glass-1)] text-[var(--color-text-muted)] hover:bg-[var(--glass-2)]"
                    }`}
                  >
                    Avatar Gerado
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMode("upload");
                      fileInputRef.current?.click();
                    }}
                    className={`rounded-[var(--r-pill)] px-4 py-2 font-condensed text-xs uppercase tracking-[0.24em] transition-[background-color,color] duration-[var(--t-quick)] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)] ${
                      avatarMode === "upload"
                        ? "bg-[linear-gradient(180deg,var(--color-primary-1),var(--color-primary-2))] text-white shadow-[var(--shadow-sm)]"
                        : "border border-[var(--glass-border)] bg-[var(--glass-1)] text-[var(--color-text-muted)] hover:bg-[var(--glass-2)]"
                    }`}
                  >
                    Enviar Foto
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Button
                    variant="glass"
                    size="game-md"
                    className="!h-11 !text-sm"
                    onClick={() => {
                      setAvatarMode("generated");
                      setAvatarSeed(randomSeed());
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <Icon icon="solar:refresh-bold" width={16} height={16} />
                    Gerar Novo Avatar
                  </Button>
                  <Button
                    variant="glass"
                    size="game-md"
                    className="!h-11 !text-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon icon="solar:gallery-add-bold" width={16} height={16} />
                    Escolher Foto
                  </Button>
                </div>
              </div>

              {(saveMessage || errorMessage) && (
                <p className={`font-body text-sm ${errorMessage ? "text-[var(--color-imp)]" : "text-[var(--color-safe)]"}`}>
                  {errorMessage || saveMessage}
                </p>
              )}

              <Button
                variant="primary"
                size="game-lg"
                disabled={isSaving || !displayName.trim()}
                onClick={handleSaveProfile}
              >
                <Icon icon="solar:diskette-bold" width={20} height={20} />
                {isSaving ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </div>

            {/* Stats grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-3 sm:gap-3.5"
            >
              {[
                { icon: "solar:gamepad-bold", color: "var(--color-info)", value: totalGames, label: "Partidas" },
                { icon: "solar:medal-star-bold", color: "var(--color-gold)", value: wins, label: "Vitorias" },
                { icon: "solar:ghost-bold", color: "var(--color-imp)", value: impostorGames, label: "Vezes Impostor" },
                { icon: "solar:magnifer-bold", color: "var(--color-safe)", value: crewWins, label: "Acertos" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={staggerItem}
                  transition={reduceMotion ? { duration: 0 } : spring.gentle}
                  className="flex flex-col items-center justify-center gap-2 rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-4 text-center transition-[background-color,transform] duration-[var(--t-quick)] hover:-translate-y-0.5 hover:bg-[var(--glass-2)]"
                >
                  <Icon icon={stat.icon} width={32} height={32} style={{ color: stat.color }} />
                  <span className="tnum block font-display text-3xl text-[var(--color-text)]">{stat.value}</span>
                  <span className="font-condensed text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{stat.label}</span>
                </motion.div>
              ))}

              <motion.button
                variants={staggerItem}
                transition={reduceMotion ? { duration: 0 } : spring.gentle}
                onClick={() => router.push("/profile/packs")}
                className="col-span-2 flex items-center justify-center gap-2.5 rounded-[var(--r-lg)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-5 py-4 font-display text-base text-[var(--color-text)] transition-[background-color,transform] duration-[var(--t-quick)] hover:-translate-y-0.5 hover:bg-[var(--glass-2)] active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
              >
                <Icon icon="solar:folder-with-files-bold" width={22} height={22} className="text-[var(--color-special)]" />
                Meus Pacotes Customizados
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
        <h3 className="mb-5 flex items-center gap-2.5 font-display text-2xl text-[var(--color-text)]">
          <Icon icon="solar:history-bold" width={26} height={26} className="text-[var(--color-primary-1)]" />
          Ultimas Partidas
        </h3>

        {recentGames.length === 0 ? (
          /* Empty history state */
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduceMotion ? { duration: 0 } : spring.gentle}
            className="flex flex-col items-center gap-4 rounded-[var(--r-lg)] border border-dashed border-[var(--w-28)] bg-[var(--glass-1)] px-6 py-10 text-center"
          >
            <Icon icon="solar:gamepad-bold" width={48} height={48} className="text-[var(--color-text-muted)] opacity-50" />
            <div className="flex flex-col gap-1.5">
              <p className="font-display text-lg text-[var(--color-text)]">Nenhuma partida ainda</p>
              <p className="font-body text-sm text-[var(--color-text-muted)]">
                Jogue uma rodada para registrar seu historico.
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="mt-1 flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-6 font-display text-sm uppercase tracking-widest text-[var(--color-text)] transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--w-20)] active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
            >
              <Icon icon="solar:play-bold" width={16} height={16} />
              Jogar Agora
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-col gap-2.5"
          >
            {recentGames.map((game) => (
              <motion.div
                key={game._id}
                variants={staggerItem}
                transition={reduceMotion ? { duration: 0 } : spring.gentle}
                className="flex items-center justify-between rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-1)] p-4 transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--glass-2)]"
              >
                <div className="flex flex-col gap-1">
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

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-[var(--r-pill)] px-3 py-0.5 font-display text-xs uppercase tracking-[0.16em] ${
                      isVictory(game)
                        ? "bg-[var(--color-safe)]/20 text-[var(--color-safe)]"
                        : "bg-[var(--color-imp)]/20 text-[var(--color-imp)]"
                    }`}
                  >
                    {isVictory(game) ? "Vitoria" : "Derrota"}
                  </span>
                  <span className="font-condensed text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                    {game.wasImpostor > 0 ? "Fui Impostor" : "Fui Tripulante"}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
