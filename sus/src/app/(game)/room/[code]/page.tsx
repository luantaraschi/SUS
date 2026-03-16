"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { useSessionId } from "@/lib/useSessionId";
import GameCircle from "@/components/game/GameCircle";
import GameButton from "@/components/game/GameButton";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import SignInModal from "@/components/auth/SignInModal";
import { BubbleText } from "@/components/ui/bubble-text";
import { Icon } from "@iconify/react";
import { Plus } from "lucide-react";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 10;
const MAX_IMPOSTORS = 3;

const DESKTOP_POSITIONS = [
  { top: "8%", left: "18%", transform: "translate(-50%, -50%)" },
  { top: "8%", left: "50%", transform: "translate(-50%, -50%)" },
  { top: "8%", left: "82%", transform: "translate(-50%, -50%)" },
  { top: "26%", left: "-3%", transform: "translate(-50%, -50%)" },
  { top: "50%", left: "-4%", transform: "translate(-50%, -50%)" },
  { top: "74%", left: "-3%", transform: "translate(-50%, -50%)" },
  { top: "26%", left: "103%", transform: "translate(-50%, -50%)" },
  { top: "50%", left: "104%", transform: "translate(-50%, -50%)" },
  { top: "74%", left: "103%", transform: "translate(-50%, -50%)" },
  { top: "98%", left: "24%", transform: "translate(-50%, -15%)" },
  { top: "98%", left: "50%", transform: "translate(-50%, -15%)" },
];

function getAvatarStatus(status: "connected" | "ready" | "disconnected") {
  return status === "connected" ? "online" : status === "ready" ? "ready" : "disconnected";
}

function CodeBlock({ code, hidden }: { code: string; hidden: boolean }) {
  return (
    <div className="flex gap-2 sm:gap-3">
      {code.split("").map((char, index) => (
        <div
          key={`${char}-${index}`}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-primary font-display text-2xl font-black text-white sm:h-16 sm:w-16 sm:text-4xl"
        >
          {hidden ? "X" : char}
        </div>
      ))}
    </div>
  );
}

function Counter({
  label,
  value,
  onDecrement,
  onIncrement,
  disableDecrement,
  disableIncrement,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  disableDecrement: boolean;
  disableIncrement: boolean;
}) {
  return (
    <div className="flex min-w-[110px] flex-col items-center gap-1.5">
      <span className="font-condensed text-xs uppercase tracking-wider text-surface-primary/70 sm:text-sm">
        {label}
      </span>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={disableDecrement}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-primary text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
        >
          <Icon icon="solar:alt-arrow-down-bold" width={20} height={20} />
        </button>
        <span className="w-10 text-center font-display text-3xl text-surface-primary sm:w-14 sm:text-5xl">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disableIncrement}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-primary text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
        >
          <Icon icon="solar:alt-arrow-up-bold" width={20} height={20} />
        </button>
      </div>
    </div>
  );
}

export default function RoomLobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const sessionId = useSessionId();

  const [codeHidden, setCodeHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isAddingBot, setIsAddingBot] = useState(false);
  const [removingBotId, setRemovingBotId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);

  const room = useQuery(api.rooms.getRoomByCode, { code: code.toUpperCase() });
  const players = useQuery(api.rooms.getPlayers, room ? { roomId: room._id } : "skip");
  const myPlayer = useQuery(
    api.rooms.getMyPlayer,
    room && sessionId ? { roomId: room._id, sessionId } : "skip"
  );
  const profile = useQuery(api.profiles.current);
  const myPacks = useQuery(api.packs.getMyPacks, profile && room ? { mode: room.mode } : "skip");
  const startReadiness = useQuery(api.rooms.getStartReadiness, room ? { roomId: room._id } : "skip");

  const linkSession = useMutation(api.users.linkSession);
  const updateSettings = useMutation(api.rooms.updateSettings);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const startGame = useMutation(api.rooms.startGame);
  const addBot = useMutation(api.rooms.addBot);
  const removeBot = useMutation(api.rooms.removeBot);
  const updateStatus = useMutation(api.players.updateStatus);

  const isHost = myPlayer?.isHost ?? false;
  const arrangedPlayers = useMemo(() => {
    if (!players) return [];
    if (!myPlayer) return players;
    return [myPlayer, ...players.filter((player) => player._id !== myPlayer._id)];
  }, [myPlayer, players]);
  const surroundingPlayers = myPlayer ? arrangedPlayers.slice(1) : arrangedPlayers;
  const mobileTopPlayers = surroundingPlayers.slice(0, 4);
  const mobileBottomPlayers = surroundingPlayers.slice(4);
  const playerCount = players?.filter((player) => player.status !== "disconnected").length ?? 0;
  const numImpostors = room?.settings.numImpostors || 1;

  const updateRoomSettings = useCallback(
    (settings: {
      maxPlayers?: number;
      rounds?: number;
      numImpostors?: number;
      customMasterId?: string;
      customPackId?: Id<"customPacks">;
      impostorHint?: boolean;
    }) => {
      if (!room || !sessionId || !isHost) return;
      void updateSettings({ roomId: room._id, sessionId, settings });
    },
    [isHost, room, sessionId, updateSettings]
  );

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${code.toUpperCase()}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [code]);

  const handleAddBot = useCallback(async () => {
    if (!room || !sessionId || !isHost || isAddingBot || playerCount >= room.settings.maxPlayers) return;
    setActionError("");
    setIsAddingBot(true);
    try {
      await addBot({ roomId: room._id, sessionId });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Nao foi possivel adicionar o bot.");
    } finally {
      setIsAddingBot(false);
    }
  }, [addBot, isAddingBot, isHost, playerCount, room, sessionId]);

  const handleRemoveBot = useCallback(
    async (botPlayerId: Id<"players">) => {
      if (!room || !sessionId || !isHost || removingBotId) return;
      setActionError("");
      setRemovingBotId(botPlayerId);
      try {
        await removeBot({ roomId: room._id, sessionId, botPlayerId });
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Nao foi possivel remover o bot.");
      } finally {
        setRemovingBotId(null);
      }
    },
    [isHost, removeBot, removingBotId, room, sessionId]
  );

  const handleStartGame = useCallback(async () => {
    if (!room || !sessionId || !isHost || playerCount < MIN_PLAYERS || isStartingGame || !startReadiness?.ready) {
      return;
    }
    setActionError("");
    setIsStartingGame(true);
    try {
      await startGame({ roomId: room._id, sessionId });
      router.push(`/room/${code.toUpperCase()}/play`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Nao foi possivel iniciar a partida.");
      setIsStartingGame(false);
    }
  }, [code, isHost, isStartingGame, playerCount, room, router, sessionId, startGame, startReadiness?.ready]);

  useEffect(() => {
    if (room?.status === "playing") {
      router.replace(`/room/${code.toUpperCase()}/play`);
    }
  }, [code, room?.status, router]);

  useEffect(() => {
    if (!myPlayer?._id || !sessionId) return;
    void updateStatus({ playerId: myPlayer._id, sessionId, status: "connected" });
    return () => {
      void updateStatus({ playerId: myPlayer._id, sessionId, status: "disconnected" });
    };
  }, [myPlayer?._id, sessionId, updateStatus]);

  if (!sessionId) {
    return <div className="flex min-h-dvh items-center justify-center font-display text-2xl text-white">Carregando...</div>;
  }

  if (room === undefined || players === undefined || profile === undefined || startReadiness === undefined) {
    return <div className="flex min-h-dvh items-center justify-center font-display text-2xl text-white">Entrando na sala...</div>;
  }

  if (room === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <p className="font-display text-3xl text-white">Sala nao encontrada</p>
        <GameButton variant="outline" size="lg" onClick={() => router.push("/")}>Voltar</GameButton>
      </div>
    );
  }

  const startDisabled = playerCount < MIN_PLAYERS || isStartingGame || !startReadiness.ready;

  return (
    <div className="relative flex w-full flex-col items-center gap-5">
      <div className="absolute right-4 top-4 z-50">
        {profile ? (
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <PlayerAvatar name={profile.displayName} avatarSeed={profile.avatarSeed} imageUrl={profile.avatarUrl} size="sm" hideName />
            <span className="hidden font-display text-sm tracking-widest sm:inline">Perfil</span>
          </button>
        ) : (
          <button
            onClick={() => setShowSignIn(true)}
            className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <Icon icon="solar:user-circle-bold" width={24} height={24} />
            <span className="hidden font-display text-sm tracking-widest sm:inline">Criar Conta</span>
          </button>
        )}
      </div>

      <BubbleText text="SUS" className="mt-8 font-display text-7xl tracking-wide drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] sm:text-[100px]" />

      {myPlayer && (
        <div className="relative z-20 -mb-14 flex flex-col items-center sm:-mb-16">
          <PlayerAvatar
            name={myPlayer.name}
            avatarSeed={myPlayer.emoji}
            imageUrl={myPlayer.avatarImageUrl}
            isHost={myPlayer.isHost}
            isBot={myPlayer.isBot}
            status={getAvatarStatus(myPlayer.status)}
            size="xl"
            hideName
          />
        </div>
      )}

      <div className="w-full max-w-[1180px] px-2 sm:px-4">
        <div className="flex flex-col gap-4 lg:hidden">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {mobileTopPlayers.map((player) => (
              <PlayerAvatar
                key={player._id}
                name={player.name}
                avatarSeed={player.emoji}
                imageUrl={player.avatarImageUrl}
                isHost={player.isHost}
                isBot={player.isBot}
                status={getAvatarStatus(player.status)}
                size="lobby"
                canRemove={isHost && player.isBot && !removingBotId}
                onRemove={player.isBot ? () => void handleRemoveBot(player._id) : undefined}
              />
            ))}
          </div>

          <GameCircle className="min-h-[620px] max-w-[860px] px-4 pb-6 pt-16 sm:px-6 sm:pb-8 sm:pt-18">
            <div className="flex h-full min-h-[inherit] w-full flex-col">
              <LobbyPanel
                room={room}
                code={code}
                codeHidden={codeHidden}
                copied={copied}
                playerCount={playerCount}
                numImpostors={numImpostors}
                myPacks={myPacks ?? []}
                players={players}
                isHost={isHost}
                actionError={actionError}
                startDisabled={startDisabled}
                startReadinessMessage={startReadiness.message}
                onToggleCodeHidden={() => setCodeHidden((current) => !current)}
                onShare={handleShare}
                onChangeMaxPlayers={(delta) => updateRoomSettings({ maxPlayers: Math.max(Math.max(MIN_PLAYERS, playerCount), Math.min(MAX_PLAYERS, room.settings.maxPlayers + delta)) })}
                onChangeRounds={(delta) => updateRoomSettings({ rounds: Math.max(MIN_ROUNDS, Math.min(MAX_ROUNDS, room.settings.rounds + delta)) })}
                onChangeImpostors={(delta) => updateRoomSettings({ numImpostors: Math.max(1, Math.min(MAX_IMPOSTORS, numImpostors + delta)) })}
                onModeChange={(mode) => {
                  if (!isHost || room.mode === mode || !sessionId) return;
                  void updateSettings({ roomId: room._id, sessionId, settings: {}, mode, ...(mode === "question" ? { questionMode: "system" as const } : {}) });
                }}
                onQuestionModeChange={(questionMode) => {
                  if (!isHost || room.questionMode === questionMode || !sessionId) return;
                  void updateSettings({ roomId: room._id, sessionId, settings: {}, questionMode });
                }}
                onMasterChange={(playerId) => updateRoomSettings({ customMasterId: playerId })}
                onPackChange={(packId) => updateRoomSettings({ customPackId: packId ? (packId as Id<"customPacks">) : undefined })}
                onToggleHint={() => updateRoomSettings({ impostorHint: !room.settings.impostorHint })}
                onAddBot={handleAddBot}
                onStart={handleStartGame}
                onLeave={async () => {
                  if (!myPlayer || !sessionId) return;
                  await leaveRoom({ playerId: myPlayer._id, sessionId });
                  router.push("/");
                }}
              />
            </div>
          </GameCircle>

          {mobileBottomPlayers.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {mobileBottomPlayers.map((player) => (
                <PlayerAvatar
                  key={player._id}
                  name={player.name}
                  avatarSeed={player.emoji}
                  imageUrl={player.avatarImageUrl}
                  isHost={player.isHost}
                  isBot={player.isBot}
                  status={getAvatarStatus(player.status)}
                  size="lobby"
                  canRemove={isHost && player.isBot && !removingBotId}
                  onRemove={player.isBot ? () => void handleRemoveBot(player._id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative hidden min-h-[820px] items-center justify-center lg:flex">
          {surroundingPlayers.map((player, index) => {
            const position = DESKTOP_POSITIONS[index];
            if (!position) return null;
            return (
              <div key={player._id} className="absolute z-20" style={{ top: position.top, left: position.left, transform: position.transform }}>
                <PlayerAvatar
                  name={player.name}
                  avatarSeed={player.emoji}
                  imageUrl={player.avatarImageUrl}
                  isHost={player.isHost}
                  isBot={player.isBot}
                  status={getAvatarStatus(player.status)}
                  size="lobby"
                  canRemove={isHost && player.isBot && !removingBotId}
                  onRemove={player.isBot ? () => void handleRemoveBot(player._id) : undefined}
                />
              </div>
            );
          })}

          <GameCircle className="min-h-[650px] max-w-[860px] px-8 pb-8 pt-18">
            <div className="flex h-full min-h-[inherit] w-full flex-col">
              <LobbyPanel
                room={room}
                code={code}
                codeHidden={codeHidden}
                copied={copied}
                playerCount={playerCount}
                numImpostors={numImpostors}
                myPacks={myPacks ?? []}
                players={players}
                isHost={isHost}
                actionError={actionError}
                startDisabled={startDisabled}
                startReadinessMessage={startReadiness.message}
                onToggleCodeHidden={() => setCodeHidden((current) => !current)}
                onShare={handleShare}
                onChangeMaxPlayers={(delta) => updateRoomSettings({ maxPlayers: Math.max(Math.max(MIN_PLAYERS, playerCount), Math.min(MAX_PLAYERS, room.settings.maxPlayers + delta)) })}
                onChangeRounds={(delta) => updateRoomSettings({ rounds: Math.max(MIN_ROUNDS, Math.min(MAX_ROUNDS, room.settings.rounds + delta)) })}
                onChangeImpostors={(delta) => updateRoomSettings({ numImpostors: Math.max(1, Math.min(Math.min(MAX_IMPOSTORS, room.settings.maxPlayers - 2), numImpostors + delta)) })}
                onModeChange={(mode) => {
                  if (!isHost || room.mode === mode || !sessionId) return;
                  void updateSettings({ roomId: room._id, sessionId, settings: {}, mode, ...(mode === "question" ? { questionMode: "system" as const } : {}) });
                }}
                onQuestionModeChange={(questionMode) => {
                  if (!isHost || room.questionMode === questionMode || !sessionId) return;
                  void updateSettings({ roomId: room._id, sessionId, settings: {}, questionMode });
                }}
                onMasterChange={(playerId) => updateRoomSettings({ customMasterId: playerId })}
                onPackChange={(packId) => updateRoomSettings({ customPackId: packId ? (packId as Id<"customPacks">) : undefined })}
                onToggleHint={() => updateRoomSettings({ impostorHint: !room.settings.impostorHint })}
                onAddBot={handleAddBot}
                onStart={handleStartGame}
                onLeave={async () => {
                  if (!myPlayer || !sessionId) return;
                  await leaveRoom({ playerId: myPlayer._id, sessionId });
                  router.push("/");
                }}
              />
            </div>
          </GameCircle>
        </div>
      </div>

      {showSignIn && (
        <SignInModal
          onClose={() => setShowSignIn(false)}
          onSuccess={() => {
            setShowSignIn(false);
            if (!sessionId) return;
            void linkSession({ sessionId });
          }}
        />
      )}
    </div>
  );
}

function LobbyPanel({
  room,
  code,
  codeHidden,
  copied,
  playerCount,
  numImpostors,
  myPacks,
  players,
  isHost,
  actionError,
  startDisabled,
  startReadinessMessage,
  onToggleCodeHidden,
  onShare,
  onChangeMaxPlayers,
  onChangeRounds,
  onChangeImpostors,
  onModeChange,
  onQuestionModeChange,
  onMasterChange,
  onPackChange,
  onToggleHint,
  onAddBot,
  onStart,
  onLeave,
}: {
  room: { settings: { maxPlayers: number; rounds: number; impostorHint: boolean; customMasterId?: string; customPackId?: string }; mode: "word" | "question"; questionMode?: "system" | "master" };
  code: string;
  codeHidden: boolean;
  copied: boolean;
  playerCount: number;
  numImpostors: number;
  myPacks: Array<{ _id: Id<"customPacks">; title: string; items: Array<{ content: string; hint: string }> }>;
  players: Array<{ _id: Id<"players">; name: string; isHost: boolean; status: "connected" | "ready" | "disconnected" }>;
  isHost: boolean;
  actionError: string;
  startDisabled: boolean;
  startReadinessMessage: string | null;
  onToggleCodeHidden: () => void;
  onShare: () => void;
  onChangeMaxPlayers: (delta: number) => void;
  onChangeRounds: (delta: number) => void;
  onChangeImpostors: (delta: number) => void;
  onModeChange: (mode: "word" | "question") => void;
  onQuestionModeChange: (mode: "system" | "master") => void;
  onMasterChange: (playerId: string) => void;
  onPackChange: (packId: string) => void;
  onToggleHint: () => void;
  onAddBot: () => void;
  onStart: () => void;
  onLeave: () => void;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col overflow-y-auto pb-3 pr-1 custom-scrollbar">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <span className="font-condensed text-sm uppercase tracking-[0.28em] text-surface-primary/70">Codigo da Sala</span>
            <div className="flex items-center gap-4 sm:gap-5">
              <button type="button" onClick={onToggleCodeHidden} className="text-surface-primary/60 transition-colors hover:text-surface-primary">
                <Icon icon={codeHidden ? "solar:eye-closed-bold" : "solar:eye-bold"} width={28} height={28} />
              </button>
              <CodeBlock code={code.toUpperCase()} hidden={codeHidden} />
              <button type="button" onClick={onShare} className="text-surface-primary/60 transition-colors hover:text-surface-primary">
                <Icon icon="solar:share-bold" width={28} height={28} />
              </button>
            </div>
            {copied && <span className="font-body text-sm text-game-safe sm:text-base">Link copiado!</span>}
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            <Counter label="Jogadores" value={room.settings.maxPlayers} onDecrement={() => onChangeMaxPlayers(-1)} onIncrement={() => onChangeMaxPlayers(1)} disableDecrement={!isHost || room.settings.maxPlayers <= Math.max(MIN_PLAYERS, playerCount)} disableIncrement={!isHost || room.settings.maxPlayers >= MAX_PLAYERS} />
            <Counter label="Rodadas" value={room.settings.rounds} onDecrement={() => onChangeRounds(-1)} onIncrement={() => onChangeRounds(1)} disableDecrement={!isHost || room.settings.rounds <= MIN_ROUNDS} disableIncrement={!isHost || room.settings.rounds >= MAX_ROUNDS} />
            <Counter label="Impostores" value={numImpostors} onDecrement={() => onChangeImpostors(-1)} onIncrement={() => onChangeImpostors(1)} disableDecrement={!isHost || numImpostors <= 1} disableIncrement={!isHost || numImpostors >= Math.min(MAX_IMPOSTORS, room.settings.maxPlayers - 2)} />
          </div>

          <div className="flex rounded-full bg-surface-primary/10 p-1.5">
            <button type="button" onClick={() => onModeChange("word")} disabled={!isHost} className={room.mode === "word" ? "rounded-full bg-surface-primary px-7 py-2.5 text-sm font-black uppercase tracking-wider text-white transition-all sm:px-8 sm:text-base" : "px-7 py-2.5 text-sm font-black uppercase tracking-wider text-surface-primary/50 transition-all sm:px-8 sm:text-base"}>Palavra</button>
            <button type="button" onClick={() => onModeChange("question")} disabled={!isHost} className={room.mode === "question" ? "rounded-full bg-surface-primary px-7 py-2.5 text-sm font-black uppercase tracking-wider text-white transition-all sm:px-8 sm:text-base" : "px-7 py-2.5 text-sm font-black uppercase tracking-wider text-surface-primary/50 transition-all sm:px-8 sm:text-base"}>Pergunta</button>
          </div>

          {myPacks.length > 0 && (
            <div className="flex w-full max-w-[280px] flex-col items-center gap-2">
              <span className="font-condensed text-[11px] uppercase tracking-[0.24em] text-surface-primary/70 sm:text-sm">Pacote de Cartas</span>
              <select value={room.settings.customPackId || ""} onChange={(event) => onPackChange(event.target.value)} disabled={!isHost} className="w-full rounded-xl border border-surface-primary/20 bg-surface-primary/10 px-3 py-2 text-sm text-surface-primary outline-none focus:border-surface-primary focus:ring-1 focus:ring-surface-primary disabled:opacity-50">
                <option value="">Padrao do Jogo</option>
                {myPacks.map((pack) => <option key={pack._id} value={pack._id}>{pack.title} ({pack.items.length})</option>)}
              </select>
            </div>
          )}

          {room.mode === "word" && (
            <div className="flex items-center gap-4">
              <button type="button" onClick={onToggleHint} disabled={!isHost} className={`relative h-7 w-12 rounded-full transition-colors sm:h-8 sm:w-14 ${room.settings.impostorHint ? "bg-game-safe" : "bg-surface-primary/20"} ${!isHost ? "pointer-events-none opacity-50" : ""}`}>
                <div className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform sm:h-7 sm:w-7 ${room.settings.impostorHint ? "translate-x-5 sm:translate-x-6" : ""}`} />
              </button>
              <span className="font-condensed text-xs uppercase tracking-wider text-surface-primary/70 sm:text-sm">Dica do Impostor</span>
            </div>
          )}

          {room.mode === "question" && (
            <div className="flex w-full flex-col gap-3 rounded-3xl border border-surface-primary/10 bg-black/5 px-4 py-4">
              <div className="flex flex-col items-center gap-2">
                <span className="font-condensed text-xs uppercase tracking-[0.24em] text-surface-primary/70 sm:text-sm">Tipo de Pergunta</span>
                <div className="flex rounded-full bg-surface-primary/10 p-1">
                  <button type="button" onClick={() => onQuestionModeChange("system")} disabled={!isHost} className={room.questionMode !== "master" ? "rounded-full bg-surface-primary px-4 py-1.5 text-xs font-black uppercase text-white transition-all" : "px-4 py-1.5 text-xs font-black uppercase text-surface-primary/50 transition-all"}>Prontas</button>
                  <button type="button" onClick={() => onQuestionModeChange("master")} disabled={!isHost} className={room.questionMode === "master" ? "rounded-full bg-surface-primary px-4 py-1.5 text-xs font-black uppercase text-white transition-all" : "px-4 py-1.5 text-xs font-black uppercase text-surface-primary/50 transition-all"}>Mestre Cria</button>
                </div>
              </div>

              {room.questionMode === "master" && (
                <div className="flex flex-col items-center gap-2">
                  <span className="font-condensed text-[11px] uppercase tracking-[0.24em] text-surface-primary/70 sm:text-sm">Quem sera o Mestre?</span>
                  <select value={room.settings.customMasterId || players.find((player) => player.isHost)?._id} onChange={(event) => onMasterChange(event.target.value)} disabled={!isHost} className="w-full max-w-[220px] rounded-xl border border-surface-primary/20 bg-surface-primary/10 px-3 py-2 text-sm text-surface-primary outline-none focus:border-surface-primary focus:ring-1 focus:ring-surface-primary">
                    {players.filter((player) => player.status !== "disconnected").map((player) => <option key={player._id} value={player._id}>{player.name} {player.isHost ? "(Host)" : ""}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <p className="text-center font-body text-sm text-surface-primary/60 sm:text-base">
              {playerCount} jogador{playerCount !== 1 ? "es" : ""} na sala
              {playerCount < MIN_PLAYERS && <span className="ml-1 text-game-warning">(minimo 3)</span>}
            </p>
            {isHost && playerCount < room.settings.maxPlayers && (
              <button onClick={onAddBot} className="flex items-center gap-1.5 rounded-full border border-surface-primary/20 bg-surface-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-surface-primary/60 transition-all hover:bg-surface-primary/20 hover:text-surface-primary sm:px-4 sm:py-2 sm:text-sm">
                <Plus size={16} /> Adicionar Bot
              </button>
            )}
            {startReadinessMessage && <p className="max-w-[460px] text-center font-body text-xs text-game-impostor sm:text-sm">{startReadinessMessage}</p>}
            {playerCount < MIN_PLAYERS && <p className="text-center font-condensed text-[10px] uppercase tracking-widest text-surface-primary/40 sm:text-xs">Aguarde jogadores entrarem ou adicione bots.</p>}
          </div>
        </div>
      </div>

      <div className="mt-auto flex w-full flex-col gap-2 border-t border-surface-primary/10 pt-4">
        {actionError && <p className="text-center font-body text-xs text-game-impostor sm:text-sm">{actionError}</p>}
        {isHost && (
          <GameButton variant="filled" size="lg" icon={<Icon icon="solar:play-bold" width={20} height={20} />} onClick={onStart} disabled={startDisabled} className={startDisabled ? "!pointer-events-auto !cursor-not-allowed !border-gray-200 !bg-gray-200 !text-gray-400 !shadow-none !opacity-100" : ""}>
            Iniciar
          </GameButton>
        )}
        <GameButton variant="outline" size="lg" icon={<Icon icon="solar:arrow-left-bold" width={20} height={20} />} onClick={onLeave}>Voltar</GameButton>
      </div>
    </>
  );
}
