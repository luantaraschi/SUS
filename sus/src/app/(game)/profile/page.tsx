"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../../convex/_generated/api";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import GameButton from "@/components/game/GameButton";
import { BubbleText } from "@/components/ui/bubble-text";
import { useSessionId } from "@/lib/useSessionId";

function randomSeed() {
  const seed = Math.random().toString(36).slice(2, 10);
  return seed || crypto.randomUUID().slice(0, 8);
}

export default function ProfilePage() {
  const router = useRouter();
  const sessionId = useSessionId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signOut } = useAuthActions();

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
  const wins = histories?.filter((history) => history.finalRank === 1).length ?? 0;
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
        <p className="font-display text-2xl text-white animate-pulse">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 py-8 pb-20">
      <div className="flex w-full max-w-4xl items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/30"
        >
          <Icon icon="solar:arrow-left-bold" width={24} height={24} />
        </button>

        {profile && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full bg-red-500/80 px-4 py-2 font-display text-sm uppercase tracking-widest text-white shadow-sm backdrop-blur-sm transition-all hover:bg-red-500"
          >
            Sair da Conta
          </button>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <PlayerAvatar name={statsTitle} avatarSeed={avatarSeed} imageUrl={currentImage} size="2xl" hideName />
        <BubbleText
          text={statsTitle}
          className="font-display text-5xl tracking-wide drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)] sm:text-6xl"
        />
        {!profile && (
          <p className="max-w-sm text-center font-body text-white/60">
            Crie uma conta para sincronizar seu nome e sua foto entre dispositivos.
          </p>
        )}
      </div>

      {profile && (
        <div className="w-full max-w-4xl rounded-[36px] bg-white/12 p-5 shadow-2xl backdrop-blur-md sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col gap-5 rounded-[28px] bg-white/10 p-5">
              <div>
                <h2 className="font-display text-3xl text-white">Editar Perfil</h2>
                <p className="mt-2 font-body text-sm text-white/70">
                  O nome e a foto salvos aqui passam a ser usados ao criar ou entrar em novas salas.
                </p>
              </div>

              <label className="flex flex-col gap-2">
                <span className="font-condensed text-xs uppercase tracking-[0.24em] text-white/70">
                  Nome do Perfil
                </span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value.slice(0, 20))}
                  maxLength={20}
                  className="h-14 rounded-2xl border border-white/20 bg-white px-4 font-display text-2xl text-surface-primary outline-none focus:border-surface-primary"
                />
              </label>

              <div className="flex flex-col gap-3">
                <span className="font-condensed text-xs uppercase tracking-[0.24em] text-white/70">
                  Foto ou Avatar
                </span>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setAvatarMode("generated")}
                    className={`rounded-full px-4 py-2 font-condensed text-xs uppercase tracking-[0.24em] transition-colors ${
                      avatarMode === "generated"
                        ? "bg-white text-surface-primary"
                        : "bg-white/10 text-white/75"
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
                    className={`rounded-full px-4 py-2 font-condensed text-xs uppercase tracking-[0.24em] transition-colors ${
                      avatarMode === "upload"
                        ? "bg-white text-surface-primary"
                        : "bg-white/10 text-white/75"
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

                <div className="flex flex-wrap gap-3">
                  <GameButton
                    variant="outline"
                    size="md"
                    className="!mb-0 !h-12 !text-base"
                    onClick={() => {
                      setAvatarMode("generated");
                      setAvatarSeed(randomSeed());
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Gerar Novo Avatar
                  </GameButton>
                  <GameButton
                    variant="outline"
                    size="md"
                    className="!mb-0 !h-12 !text-base"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Escolher Foto
                  </GameButton>
                </div>
              </div>

              {(saveMessage || errorMessage) && (
                <p className={`font-body text-sm ${errorMessage ? "text-red-200" : "text-green-200"}`}>
                  {errorMessage || saveMessage}
                </p>
              )}

              <GameButton
                variant="filled"
                size="lg"
                className="!mb-0"
                disabled={isSaving || !displayName.trim()}
                onClick={handleSaveProfile}
              >
                {isSaving ? "Salvando..." : "Salvar Perfil"}
              </GameButton>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-[28px] border border-white/20 bg-white/10 p-4 text-center">
                <Icon icon="solar:gamepad-bold" width={32} height={32} className="mx-auto mb-2 text-blue-300" />
                <span className="block font-display text-3xl text-white">{totalGames}</span>
                <span className="text-xs font-condensed uppercase tracking-widest text-white/70">Partidas</span>
              </div>
              <div className="rounded-[28px] border border-white/20 bg-white/10 p-4 text-center">
                <Icon icon="solar:medal-star-bold" width={32} height={32} className="mx-auto mb-2 text-yellow-400" />
                <span className="block font-display text-3xl text-white">{wins}</span>
                <span className="text-xs font-condensed uppercase tracking-widest text-white/70">Vitorias</span>
              </div>
              <div className="rounded-[28px] border border-white/20 bg-white/10 p-4 text-center">
                <Icon icon="solar:ghost-bold" width={32} height={32} className="mx-auto mb-2 text-red-400" />
                <span className="block font-display text-3xl text-white">{impostorGames}</span>
                <span className="text-xs font-condensed uppercase tracking-widest text-white/70">Vezes Impostor</span>
              </div>
              <div className="rounded-[28px] border border-white/20 bg-white/10 p-4 text-center">
                <Icon icon="solar:magnifer-bold" width={32} height={32} className="mx-auto mb-2 text-green-400" />
                <span className="block font-display text-3xl text-white">{crewWins}</span>
                <span className="text-xs font-condensed uppercase tracking-widest text-white/70">Acertos</span>
              </div>

              <button
                onClick={() => router.push("/profile/packs")}
                className="col-span-2 flex items-center justify-center gap-2 rounded-[28px] border border-white/20 bg-white/10 px-5 py-4 font-display text-lg text-white transition-all hover:bg-white/18"
              >
                <Icon icon="solar:folder-with-files-bold" width={24} />
                Meus Pacotes Customizados
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl rounded-[36px] border border-[var(--panel-border)] bg-[var(--panel-surface)] p-6 text-[var(--panel-text)] shadow-2xl sm:p-8">
        <h3 className="mb-6 flex items-center gap-2 font-display text-2xl text-[var(--panel-text)]">
          <Icon icon="solar:history-bold" width={28} height={28} />
          Ultimas Partidas
        </h3>

        {recentGames.length === 0 ? (
          <div className="py-8 text-center font-body text-[var(--panel-soft-text)]">
            Nenhuma partida registrada ainda.
            <br />
            Jogue uma partida ate o final para salvar seu historico!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentGames.map((game) => (
              <div
                key={game._id}
                className="flex items-center justify-between rounded-2xl border border-[var(--control-border)] bg-[var(--control-surface)] p-4 transition-colors hover:bg-[var(--control-surface-muted)]"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg text-[var(--panel-text)]">Sala {game.roomCode}</span>
                    <span className="rounded-full bg-[var(--control-surface-muted)] px-2 py-0.5 text-[10px] font-condensed uppercase tracking-wider text-[var(--control-soft-text)]">
                      {game.mode}
                    </span>
                  </div>
                  <span className="font-body text-sm text-[var(--panel-soft-text)]">
                    {new Date(game.playedAt).toLocaleDateString()} • {game.totalPlayers} jogadores
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className={`font-display text-xl ${game.finalRank === 1 ? "text-yellow-400" : "text-[var(--panel-soft-text)]"}`}>
                    {game.finalRank}º Lugar
                  </span>
                  <span className="text-xs font-condensed uppercase tracking-widest text-[var(--control-soft-text)]">
                    {game.wasImpostor > 0 ? "Fui Impostor" : "Fui Tripulante"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
