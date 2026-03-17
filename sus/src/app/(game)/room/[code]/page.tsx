"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { useSessionId } from "@/lib/useSessionId";
import GameCircle from "@/components/game/GameCircle";
import GameButton from "@/components/game/GameButton";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import SignInModal from "@/components/auth/SignInModal";
import GameSettingsButton from "@/components/game/GameSettingsButton";
import ThemePickerDialog from "@/components/game/ThemePickerDialog";
import GlassSelect from "@/components/game/ui/GlassSelect";
import { BubbleText } from "@/components/ui/bubble-text";
import { THEME_ICON_MAP } from "@/lib/themeIcons";
import { Icon } from "@iconify/react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSound } from "@/lib/useSound";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 10;
const MAX_IMPOSTORS = 3;


function getAvatarStatus(status: "connected" | "ready" | "disconnected") {
  return status === "connected" ? "online" : status === "ready" ? "ready" : "disconnected";
}

function CodeBlock({ code, hidden }: { code: string; hidden: boolean }) {
  return (
    <div className="flex gap-2 sm:gap-3">
      {code.split("").map((char, index) => (
        <div
          key={`${char}-${index}`}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-primary font-display text-xl font-black text-white sm:h-14 sm:w-14 sm:text-3xl"
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
  const [direction, setDirection] = useState(1);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setDirection(value > prevValue ? 1 : -1);
    setPrevValue(value);
  }

  return (
    <div className="flex min-w-[110px] flex-col items-center gap-1.5">
      <span className="font-condensed text-xs uppercase tracking-wider text-[var(--panel-soft-text)] sm:text-sm">
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
        <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden sm:h-14 sm:w-14">
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.span
              key={value}
              custom={direction}
              variants={{
                initial: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0 }),
                animate: { y: "0%", opacity: 1 },
                exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0 }),
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute text-center font-display text-3xl text-[var(--panel-text)] sm:text-5xl"
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>
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

  const { play: playSound } = useSound();
  const prevPlayerCountRef = useRef<number | null>(null);

  const [codeHidden, setCodeHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
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
  const packOptions = useQuery(api.packs.getMergedPackOptions, room ? { mode: room.mode } : "skip");
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
  const halfIndex = Math.ceil(surroundingPlayers.length / 2);
  const leftPlayers = surroundingPlayers.slice(0, halfIndex);
  const rightPlayers = surroundingPlayers.slice(halfIndex);
  const playerCount = players?.filter((player) => player.status !== "disconnected").length ?? 0;
  const numImpostors = room?.settings.numImpostors || 1;

  const updateRoomSettings = useCallback(
    (settings: {
      maxPlayers?: number;
      rounds?: number;
      numImpostors?: number;
      customMasterId?: string;
      defaultPackKey?: string;
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

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code.toUpperCase());
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      setCodeCopied(false);
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

  useEffect(() => {
    if (!players) return;
    const count = players.filter((p) => p.status !== "disconnected").length;
    const prev = prevPlayerCountRef.current;
    if (prev !== null) {
      if (count > prev) playSound("join");
      else if (count < prev) playSound("kick");
    }
    prevPlayerCountRef.current = count;
  }, [players, playSound]);

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
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-end px-4 pt-3 sm:px-6 sm:pt-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <GameSettingsButton sessionId={sessionId} />
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
      </div>

      <div className="flex w-full min-h-0 flex-1 flex-col px-2 pt-4 sm:px-4 sm:pt-6">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-4">
          <BubbleText text="SUS" className="font-display text-[clamp(3.4rem,6vw,5.8rem)] tracking-wide drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]" />

          {myPlayer && (
            <div className="relative z-20 -mb-7 mt-2 flex flex-col items-center sm:-mb-9">
              <PlayerAvatar
                name={myPlayer.name}
                avatarSeed={myPlayer.emoji}
                imageUrl={myPlayer.avatarImageUrl}
                isHost={myPlayer.isHost}
                isBot={myPlayer.isBot}
                status={getAvatarStatus(myPlayer.status)}
                size="2xl"
                hideName
              />
            </div>
          )}

          <div className="min-h-0 w-full max-w-[1080px] flex-1 overflow-hidden px-2 pb-2 sm:px-4">
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden lg:hidden">
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
                    size="orbit"
                    interactive
                    canRemove={isHost && player.isBot && !removingBotId}
                    onRemove={player.isBot ? () => void handleRemoveBot(player._id) : undefined}
                  />
                ))}
              </div>

              <GameCircle className="flex h-full min-h-0 max-h-[min(76dvh,100%)] max-w-[740px] px-4 pb-4 pt-12 sm:px-6 sm:pb-5 sm:pt-14">
                <div className="flex h-full min-h-0 w-full flex-col">
                  <LobbyPanel
                    room={room}
                    code={code}
                    codeHidden={codeHidden}
                    copied={copied}
                    codeCopied={codeCopied}
                    playerCount={playerCount}
                    numImpostors={numImpostors}
                    packOptions={packOptions ?? []}
                    players={players}
                    isHost={isHost}
                    actionError={actionError}
                    startDisabled={startDisabled}
                    startReadinessMessage={startReadiness.message}
                    onToggleCodeHidden={() => setCodeHidden((current) => !current)}
                    onShare={handleShare}
                    onCopyCode={handleCopyCode}
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
                    onPackChange={(value) => {
                      if (!value) {
                        updateRoomSettings({ defaultPackKey: "classico", customPackId: undefined });
                        return;
                      }
                      if (value.startsWith("default:")) {
                        updateRoomSettings({
                          defaultPackKey: value.replace("default:", ""),
                          customPackId: undefined,
                        });
                        return;
                      }
                      updateRoomSettings({
                        customPackId: value.replace("custom:", "") as Id<"customPacks">,
                        defaultPackKey: undefined,
                      });
                    }}
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
                      size="orbit"
                      interactive
                      canRemove={isHost && player.isBot && !removingBotId}
                      onRemove={player.isBot ? () => void handleRemoveBot(player._id) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="hidden h-full min-h-0 items-center justify-center gap-4 lg:flex">
              <div className="flex w-20 flex-col items-center gap-3">
                {leftPlayers.map((player) => (
                  <PlayerAvatar
                    key={player._id}
                    name={player.name}
                    avatarSeed={player.emoji}
                    imageUrl={player.avatarImageUrl}
                    isHost={player.isHost}
                    isBot={player.isBot}
                    status={getAvatarStatus(player.status)}
                    size="orbit"
                    interactive
                    canRemove={isHost && player.isBot && !removingBotId}
                    onRemove={player.isBot ? () => void handleRemoveBot(player._id) : undefined}
                  />
                ))}
              </div>

              <GameCircle className="flex h-full min-h-0 max-h-[min(78dvh,100%)] max-w-[740px] flex-1 px-6 pb-5 pt-12">
                <div className="flex h-full min-h-0 w-full flex-col">
                  <LobbyPanel
                    room={room}
                    code={code}
                    codeHidden={codeHidden}
                    copied={copied}
                    codeCopied={codeCopied}
                    playerCount={playerCount}
                    numImpostors={numImpostors}
                    packOptions={packOptions ?? []}
                    players={players}
                    isHost={isHost}
                    actionError={actionError}
                    startDisabled={startDisabled}
                    startReadinessMessage={startReadiness.message}
                    onToggleCodeHidden={() => setCodeHidden((current) => !current)}
                    onShare={handleShare}
                    onCopyCode={handleCopyCode}
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
                    onPackChange={(value) => {
                      if (!value) {
                        updateRoomSettings({ defaultPackKey: "classico", customPackId: undefined });
                        return;
                      }
                      if (value.startsWith("default:")) {
                        updateRoomSettings({
                          defaultPackKey: value.replace("default:", ""),
                          customPackId: undefined,
                        });
                        return;
                      }
                      updateRoomSettings({
                        customPackId: value.replace("custom:", "") as Id<"customPacks">,
                        defaultPackKey: undefined,
                      });
                    }}
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

              <div className="flex w-20 flex-col items-center gap-3">
                {rightPlayers.map((player) => (
                  <PlayerAvatar
                    key={player._id}
                    name={player.name}
                    avatarSeed={player.emoji}
                    imageUrl={player.avatarImageUrl}
                    isHost={player.isHost}
                    isBot={player.isBot}
                    status={getAvatarStatus(player.status)}
                    size="orbit"
                    interactive
                    canRemove={isHost && player.isBot && !removingBotId}
                    onRemove={player.isBot ? () => void handleRemoveBot(player._id) : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
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
  codeCopied,
  playerCount,
  numImpostors,
  packOptions,
  players,
  isHost,
  actionError,
  startDisabled,
  startReadinessMessage,
  onToggleCodeHidden,
  onShare,
  onCopyCode,
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
  room: { settings: { maxPlayers: number; rounds: number; impostorHint: boolean; customMasterId?: string; customPackId?: string; defaultPackKey?: string }; mode: "word" | "question"; questionMode?: "system" | "master" };
  code: string;
  codeHidden: boolean;
  copied: boolean;
  codeCopied: boolean;
  playerCount: number;
  numImpostors: number;
  packOptions: Array<{ key: string; title: string; icon: string; source: "default" | "custom"; count: number }>;
  players: Array<{ _id: Id<"players">; name: string; isHost: boolean; status: "connected" | "ready" | "disconnected" }>;
  isHost: boolean;
  actionError: string;
  startDisabled: boolean;
  startReadinessMessage: string | null;
  onToggleCodeHidden: () => void;
  onShare: () => void;
  onCopyCode: () => void;
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
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const themeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedPackValue = room.settings.customPackId
    ? `custom:${room.settings.customPackId}`
    : `default:${room.settings.defaultPackKey || "classico"}`;
  const selectedPack = packOptions.find(
    (pack) => (pack.source === "default" ? `default:${pack.key}` : `custom:${pack.key}`) === selectedPackValue
  );
  const handlePackSelection = (value: string) => {
    onPackChange(value);
    setIsThemeDialogOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="custom-scrollbar flex-1 min-h-0 overflow-y-auto pr-1">
        <div className="flex min-h-full flex-col pb-2">
        <div className="flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-2">
            <span className="font-condensed text-sm uppercase tracking-[0.28em] text-[var(--panel-soft-text)]">Codigo da Sala</span>
            <div className="flex items-center gap-4 sm:gap-5">
              <button type="button" onClick={onToggleCodeHidden} className="text-[var(--panel-soft-text)] transition-colors hover:text-[var(--panel-text)]">
                <Icon icon={codeHidden ? "solar:eye-closed-bold" : "solar:eye-bold"} width={28} height={28} />
              </button>
              <CodeBlock code={code.toUpperCase()} hidden={codeHidden} />
              <div className="flex items-center gap-2">
                <button type="button" onClick={onCopyCode} className="text-[var(--panel-soft-text)] transition-colors hover:text-[var(--panel-text)]">
                  <Icon icon={codeCopied ? "solar:clipboard-check-bold" : "solar:copy-bold"} width={28} height={28} />
                </button>
                <button type="button" onClick={onShare} className="text-[var(--panel-soft-text)] transition-colors hover:text-[var(--panel-text)]">
                  <Icon icon={copied ? "solar:check-circle-bold" : "solar:share-bold"} width={28} height={28} />
                </button>
              </div>
            </div>
            {copied && <span className="font-body text-sm text-game-safe sm:text-base">Link copiado!</span>}
            {codeCopied && <span className="font-body text-sm text-game-safe sm:text-base">Código copiado!</span>}
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            <Counter label="Jogadores" value={room.settings.maxPlayers} onDecrement={() => onChangeMaxPlayers(-1)} onIncrement={() => onChangeMaxPlayers(1)} disableDecrement={!isHost || room.settings.maxPlayers <= Math.max(MIN_PLAYERS, playerCount)} disableIncrement={!isHost || room.settings.maxPlayers >= MAX_PLAYERS} />
            <Counter label="Rodadas" value={room.settings.rounds} onDecrement={() => onChangeRounds(-1)} onIncrement={() => onChangeRounds(1)} disableDecrement={!isHost || room.settings.rounds <= MIN_ROUNDS} disableIncrement={!isHost || room.settings.rounds >= MAX_ROUNDS} />
            <Counter label="Impostores" value={numImpostors} onDecrement={() => onChangeImpostors(-1)} onIncrement={() => onChangeImpostors(1)} disableDecrement={!isHost || numImpostors <= 1} disableIncrement={!isHost || numImpostors >= Math.min(MAX_IMPOSTORS, room.settings.maxPlayers - 2)} />
          </div>

          <div className="flex relative rounded-full bg-[var(--panel-muted)] p-1.5 isolate">
            <button
              type="button"
              onClick={() => onModeChange("word")}
              disabled={!isHost}
              className={`relative z-10 px-7 py-2.5 text-sm font-black uppercase tracking-wider transition-all sm:px-8 sm:text-base ${room.mode === "word" ? "text-white" : "text-[var(--panel-soft-text)] hover:text-[var(--panel-text)]"}`}
            >
              Palavra
              {room.mode === "word" && (
                <motion.div
                  layoutId="modeIndicator"
                  className="absolute inset-0 -z-10 rounded-full bg-surface-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => onModeChange("question")}
              disabled={!isHost}
              className={`relative z-10 px-7 py-2.5 text-sm font-black uppercase tracking-wider transition-all sm:px-8 sm:text-base ${room.mode === "question" ? "text-white" : "text-[var(--panel-soft-text)] hover:text-[var(--panel-text)]"}`}
            >
              Pergunta
              {room.mode === "question" && (
                <motion.div
                  layoutId="modeIndicator"
                  className="absolute inset-0 -z-10 rounded-full bg-surface-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>

          {packOptions.length > 0 && !(room.mode === "question" && room.questionMode === "master") && (
            <div className="flex w-full max-w-[560px] flex-col items-center gap-3">
              <button
                ref={themeTriggerRef}
                type="button"
                onClick={() => setIsThemeDialogOpen(true)}
                className="flex w-full items-center justify-between rounded-[18px] border border-[var(--control-border)] bg-[var(--control-surface)] px-4 py-3 transition-colors hover:bg-[var(--panel-muted)]"
              >
                <span className="flex items-center gap-3">
                  <Icon icon={THEME_ICON_MAP[selectedPack?.icon ?? "star"] ?? "solar:star-bold"} width={18} height={18} className="text-[var(--control-text)]" />
                  <span className="font-body text-base text-[var(--control-text)]">{selectedPack?.title ?? "Clássico"}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--panel-soft-text)]">Tema Atual</span>
                  <Icon icon="solar:alt-arrow-down-bold" width={16} height={16} className="text-[var(--panel-soft-text)]" />
                </span>
              </button>
            </div>
          )}

          {packOptions.length > 0 && !(room.mode === "question" && room.questionMode === "master") && (
            <ThemePickerDialog
              open={isThemeDialogOpen}
              onOpenChange={setIsThemeDialogOpen}
              selectedPackValue={selectedPackValue}
              packOptions={packOptions}
              isHost={isHost}
              onSelectPack={handlePackSelection}
              triggerRef={themeTriggerRef}
            />
          )}

          {room.mode === "word" && (
            <div className="flex items-center gap-4">
              <button type="button" onClick={onToggleHint} disabled={!isHost} className={`relative h-7 w-12 rounded-full transition-colors sm:h-8 sm:w-14 ${room.settings.impostorHint ? "bg-game-safe" : "bg-[var(--control-surface-muted)]"} ${!isHost ? "pointer-events-none opacity-50" : ""}`}>
                <div className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform sm:h-7 sm:w-7 ${room.settings.impostorHint ? "translate-x-5 sm:translate-x-6" : ""}`} />
              </button>
              <span className="font-condensed text-xs uppercase tracking-wider text-[var(--panel-soft-text)] sm:text-sm">Dica do Impostor</span>
            </div>
          )}

          {room.mode === "question" && (
            <div className="flex w-full flex-col gap-3 rounded-3xl border border-[var(--control-border)] bg-[var(--panel-muted)] px-4 py-4">
              <div className="flex flex-col items-center gap-2">
                <span className="font-condensed text-xs uppercase tracking-[0.24em] text-[var(--panel-soft-text)] sm:text-sm">Tipo de Pergunta</span>
                <div className="flex rounded-full bg-[var(--control-surface-muted)] p-1">
                  <button type="button" onClick={() => onQuestionModeChange("system")} disabled={!isHost} className={room.questionMode !== "master" ? "rounded-full bg-surface-primary px-4 py-1.5 text-xs font-black uppercase text-white transition-all" : "px-4 py-1.5 text-xs font-black uppercase text-[var(--panel-soft-text)] transition-all"}>Prontas</button>
                  <button type="button" onClick={() => onQuestionModeChange("master")} disabled={!isHost} className={room.questionMode === "master" ? "rounded-full bg-surface-primary px-4 py-1.5 text-xs font-black uppercase text-white transition-all" : "px-4 py-1.5 text-xs font-black uppercase text-[var(--panel-soft-text)] transition-all"}>Mestre Cria</button>
                </div>
              </div>

              {room.questionMode === "master" && (
                <div className="flex flex-col items-center gap-2">
                  <span className="font-condensed text-[11px] uppercase tracking-[0.24em] text-[var(--panel-soft-text)] sm:text-sm">Quem sera o Mestre?</span>
                  <GlassSelect
                    ariaLabel="Selecionar mestre da rodada"
                    value={String(room.settings.customMasterId || players.find((player) => player.isHost)?._id || "")}
                    onChange={onMasterChange}
                    disabled={!isHost}
                    tone="special"
                    className="w-full max-w-[240px]"
                    options={players
                      .filter((player) => player.status !== "disconnected")
                      .map((player) => ({
                        value: String(player._id),
                        label: `${player.name}${player.isHost ? " (Host)" : ""}`,
                      }))}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <p className="text-center font-body text-sm text-[var(--panel-soft-text)] sm:text-base">
              {playerCount} jogador{playerCount !== 1 ? "es" : ""} na sala
              {playerCount < MIN_PLAYERS && <span className="ml-1 text-game-warning">(minimo 3)</span>}
            </p>
            {isHost && playerCount < room.settings.maxPlayers && (
              <button onClick={onAddBot} className="flex items-center gap-1.5 rounded-full border border-[var(--control-border)] bg-[var(--control-surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[var(--control-text)] transition-all hover:border-surface-primary/50 hover:bg-[var(--panel-muted)] sm:px-4 sm:py-2 sm:text-sm">
                <Plus size={16} /> Adicionar Bot
              </button>
            )}
            {startReadinessMessage && <p className="max-w-[460px] text-center font-body text-xs text-game-impostor sm:text-sm">{startReadinessMessage}</p>}
            {playerCount < MIN_PLAYERS && <p className="text-center font-condensed text-[10px] uppercase tracking-widest text-[var(--panel-soft-text)] sm:text-xs">Aguarde jogadores entrarem ou adicione bots.</p>}
          </div>
        </div>
      </div>
      </div>

      <div className="mt-auto flex w-full flex-col gap-2 border-t border-[var(--control-border)] pt-4">
        {actionError && <p className="text-center font-body text-xs text-game-impostor sm:text-sm">{actionError}</p>}
        {isHost && (
          <GameButton variant="filled" size="lg" icon={<Icon icon="solar:play-bold" width={20} height={20} />} onClick={onStart} disabled={startDisabled}>
            Iniciar
          </GameButton>
        )}
        <GameButton variant="outline" size="lg" icon={<Icon icon="solar:arrow-left-bold" width={20} height={20} />} onClick={onLeave}>Voltar</GameButton>
      </div>
    </div>
  );
}
