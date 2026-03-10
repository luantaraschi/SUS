"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { useSessionId } from "@/lib/useSessionId";
import GameCircle from "@/components/game/GameCircle";
import GameButton from "@/components/game/GameButton";
import BotIcon from "@/components/game/BotIcon";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import { Icon } from "@iconify/react";
import { Plus } from "lucide-react";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 10;

const POSITIONS: Array<{ top: string; left: string; transform: string }> = [
  { top: "34%", left: "0%", transform: "translate(-50%, -50%)" },
  { top: "34%", left: "100%", transform: "translate(-50%, -50%)" },
  { top: "58%", left: "-8%", transform: "translate(-50%, -50%)" },
  { top: "58%", left: "108%", transform: "translate(-50%, -50%)" },
  { top: "82%", left: "0%", transform: "translate(-50%, -50%)" },
  { top: "82%", left: "100%", transform: "translate(-50%, -50%)" },
  { top: "10%", left: "24%", transform: "translate(-50%, -50%)" },
  { top: "10%", left: "76%", transform: "translate(-50%, -50%)" },
  { top: "102%", left: "26%", transform: "translate(-50%, -35%)" },
  { top: "102%", left: "50%", transform: "translate(-50%, -35%)" },
  { top: "102%", left: "74%", transform: "translate(-50%, -35%)" },
];

function getAvatarStatus(status: "connected" | "ready" | "disconnected") {
  return status === "connected"
    ? "online"
    : status === "ready"
      ? "ready"
      : status === "disconnected"
        ? "disconnected"
        : "waiting";
}

function CodeBlock({ code, hidden }: { code: string; hidden: boolean }) {
  return (
    <div className="flex gap-2">
      {code.split("").map((char, index) => (
        <div
          key={index}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-primary font-display text-xl font-black text-white"
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
    <div className="flex flex-col items-center gap-1">
      <span className="font-condensed text-xs uppercase tracking-wider text-surface-primary/70">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrement}
          disabled={disableDecrement}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-primary text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Icon icon="solar:alt-arrow-down-bold" width={16} height={16} />
        </button>
        <span className="w-10 text-center font-display text-3xl text-surface-primary">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disableIncrement}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-primary text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Icon icon="solar:alt-arrow-up-bold" width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

function AddBotSlot({
  onAdd,
  disabled,
}: {
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className="flex flex-col items-center gap-1 text-white transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-50"
      aria-label="Adicionar bot"
    >
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-white bg-[linear-gradient(160deg,#b04cb9_0%,#8c2fa5_100%)] shadow-[0_8px_18px_rgba(32,2,104,0.35)]">
        <span className="absolute inset-[4px] rounded-full border border-white/25" />
        <BotIcon className="h-8 w-8 text-white" />
        <span className="absolute right-0 top-0 flex h-6 w-6 -translate-y-1/4 translate-x-1/4 items-center justify-center rounded-full border-2 border-white bg-[#f7e7ff] font-display text-lg leading-none text-[#7c2d8a] shadow-[0_4px_10px_rgba(0,0,0,0.25)]">
          +
        </span>
      </span>
      <span className="font-display text-[26px] lowercase leading-none text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
        +bot
      </span>
    </button>
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

  const room = useQuery(api.rooms.getRoomByCode, { code: code.toUpperCase() });
  const players = useQuery(
    api.rooms.getPlayers,
    room ? { roomId: room._id } : "skip"
  );
  const myPlayer = useQuery(
    api.rooms.getMyPlayer,
    room && sessionId ? { roomId: room._id, sessionId } : "skip"
  );

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

    const others = players.filter((player) => player._id !== myPlayer._id);
    return [myPlayer, ...others];
  }, [players, myPlayer]);

  const playerCount =
    players?.filter((player) => player.status !== "disconnected").length ?? 0;

  const handleSettingsChange = useCallback(
    (field: "maxPlayers" | "rounds", delta: number) => {
      if (!room || !sessionId || !isHost) return;

      const current = room.settings[field];
      const minimum =
        field === "maxPlayers" ? Math.max(MIN_PLAYERS, playerCount) : MIN_ROUNDS;
      const maximum = field === "maxPlayers" ? MAX_PLAYERS : MAX_ROUNDS;
      const nextValue = Math.max(minimum, Math.min(maximum, current + delta));

      if (nextValue === current) return;

      void updateSettings({
        roomId: room._id,
        sessionId,
        settings: { [field]: nextValue },
      });
    },
    [isHost, playerCount, room, sessionId, updateSettings]
  );

  const handleModeChange = useCallback(
    (mode: "word" | "question") => {
      if (!room || !sessionId || !isHost || room.mode === mode) return;

      void updateSettings({
        roomId: room._id,
        sessionId,
        settings: {},
        mode,
      });
    },
    [isHost, room, sessionId, updateSettings]
  );

  const handleToggleHint = useCallback(() => {
    if (!room || !sessionId || !isHost) return;
    setActionError("");

    void updateSettings({
      roomId: room._id,
      sessionId,
      settings: { impostorHint: !room.settings.impostorHint },
    });
  }, [isHost, room, sessionId, updateSettings]);

  const handleAddBot = useCallback(async () => {
    if (!room || !sessionId || !isHost || isAddingBot) return;
    if (playerCount >= room.settings.maxPlayers) return;

    setActionError("");
    setIsAddingBot(true);

    try {
      await addBot({ roomId: room._id, sessionId });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Nao foi possivel adicionar o bot."
      );
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
        setActionError(
          error instanceof Error ? error.message : "Nao foi possivel remover o bot."
        );
      } finally {
        setRemovingBotId(null);
      }
    },
    [isHost, removeBot, removingBotId, room, sessionId]
  );

  const handleLeave = useCallback(async () => {
    if (!myPlayer || !sessionId) return;

    setActionError("");
    await leaveRoom({ playerId: myPlayer._id, sessionId });
    router.push("/");
  }, [leaveRoom, myPlayer, router, sessionId]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/room/${code.toUpperCase()}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be unavailable in some browser contexts.
    }
  }, [code]);

  const handleStartGame = useCallback(async () => {
    if (!room || !sessionId || !isHost || playerCount < MIN_PLAYERS || isStartingGame) {
      return;
    }

    setActionError("");
    setIsStartingGame(true);

    try {
      await startGame({ roomId: room._id, sessionId });
      router.push(`/room/${code.toUpperCase()}/play`);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Nao foi possivel iniciar a partida."
      );
      setIsStartingGame(false);
    }
  }, [
    code,
    isHost,
    isStartingGame,
    playerCount,
    room,
    router,
    sessionId,
    startGame,
    setActionError,
  ]);

  useEffect(() => {
    if (room?.status === "playing") {
      router.replace(`/room/${code.toUpperCase()}/play`);
    }
  }, [code, room?.status, router]);

  useEffect(() => {
    if (!myPlayer?._id || !sessionId) return;

    void updateStatus({ playerId: myPlayer._id, sessionId, status: "connected" });

    return () => {
      void updateStatus({
        playerId: myPlayer._id,
        sessionId,
        status: "disconnected",
      });
    };
  }, [myPlayer?._id, sessionId, updateStatus]);

  if (!sessionId) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-display text-2xl text-white animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (room === undefined || players === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="font-display text-2xl text-white animate-pulse">
          Entrando na sala...
        </p>
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <p className="font-display text-3xl text-white">Sala nao encontrada</p>
        <GameButton variant="outline" size="lg" onClick={() => router.push("/")}>
          Voltar
        </GameButton>
      </div>
    );
  }

  const surroundingPlayers = myPlayer ? arrangedPlayers.slice(1) : arrangedPlayers;
  const canShowAddBotSlot =
    Boolean(myPlayer) &&
    isHost &&
    playerCount < room.settings.maxPlayers &&
    surroundingPlayers.length < POSITIONS.length;
  const nextOpenPosition = canShowAddBotSlot
    ? POSITIONS[surroundingPlayers.length]
    : null;
  const startDisabled = playerCount < MIN_PLAYERS || isStartingGame;

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="font-display text-4xl tracking-wide text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.3)] sm:text-5xl">
        SUS
      </h1>

      <div className="mx-auto flex w-full max-w-[700px] flex-col items-center">
        {myPlayer && (
          <div
            className="relative flex flex-col items-center"
            style={{ marginBottom: "-48px", zIndex: 20 }}
          >
            <PlayerAvatar
              name={myPlayer.name}
              avatarSeed={myPlayer.emoji}
              isHost={myPlayer.isHost}
              isBot={myPlayer.isBot}
              status={getAvatarStatus(myPlayer.status)}
              size="2xl"
              hideName
            />
          </div>
        )}

        <div className="relative flex w-full items-center justify-center">
          {surroundingPlayers.map((player, index) => {
            if (index >= POSITIONS.length) return null;

            const position = POSITIONS[index];

            return (
              <div
                key={player._id}
                className="absolute z-20"
                style={{
                  top: position.top,
                  left: position.left,
                  transform: position.transform,
                }}
              >
                <PlayerAvatar
                  name={player.name}
                  avatarSeed={player.emoji}
                  isHost={player.isHost}
                  isBot={player.isBot}
                  canRemove={isHost && player.isBot && !removingBotId}
                  onRemove={
                    player.isBot ? () => void handleRemoveBot(player._id) : undefined
                  }
                  status={getAvatarStatus(player.status)}
                />
              </div>
            );
          })}

          {nextOpenPosition && (
            <div
              className="absolute z-20"
              style={{
                top: nextOpenPosition.top,
                left: nextOpenPosition.left,
                transform: nextOpenPosition.transform,
              }}
            >
              <AddBotSlot onAdd={handleAddBot} disabled={isAddingBot} />
            </div>
          )}

          <GameCircle className="shadow-[0_12px_60px_rgba(0,0,0,0.3)]">
            <div className="flex w-full max-w-[340px] flex-col items-center gap-3 px-2 pt-16 sm:max-w-[400px] sm:gap-4 sm:pt-20">
              <div className="flex flex-col items-center gap-2">
                <span className="font-condensed text-sm uppercase tracking-widest text-surface-primary/70">
                  Codigo da Sala:
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCodeHidden((current) => !current)}
                    className="text-surface-primary/60 hover:text-surface-primary"
                  >
                    {codeHidden ? (
                      <Icon icon="solar:eye-closed-bold" width={20} height={20} />
                    ) : (
                      <Icon icon="solar:eye-bold" width={20} height={20} />
                    )}
                  </button>

                  <CodeBlock code={code.toUpperCase()} hidden={codeHidden} />

                  <button
                    type="button"
                    onClick={handleShare}
                    className="text-surface-primary/60 hover:text-surface-primary"
                  >
                    <Icon icon="solar:share-bold" width={20} height={20} />
                  </button>
                </div>
                {copied && (
                  <span className="font-body text-xs text-game-safe">Link copiado!</span>
                )}
              </div>

              <div className="flex gap-8">
                <Counter
                  label="Jogadores"
                  value={room.settings.maxPlayers}
                  onDecrement={() => handleSettingsChange("maxPlayers", -1)}
                  onIncrement={() => handleSettingsChange("maxPlayers", 1)}
                  disableDecrement={
                    !isHost ||
                    room.settings.maxPlayers <= Math.max(MIN_PLAYERS, playerCount)
                  }
                  disableIncrement={!isHost || room.settings.maxPlayers >= MAX_PLAYERS}
                />
                <Counter
                  label="Rodadas"
                  value={room.settings.rounds}
                  onDecrement={() => handleSettingsChange("rounds", -1)}
                  onIncrement={() => handleSettingsChange("rounds", 1)}
                  disableDecrement={!isHost || room.settings.rounds <= MIN_ROUNDS}
                  disableIncrement={!isHost || room.settings.rounds >= MAX_ROUNDS}
                />
              </div>

              <div className="flex rounded-full bg-surface-primary/10 p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("word")}
                  disabled={!isHost}
                  className={
                    room.mode === "word"
                      ? "rounded-full bg-surface-primary px-5 py-1.5 text-sm font-black uppercase tracking-wider text-white transition-all"
                      : "px-5 py-1.5 text-sm font-black uppercase tracking-wider text-surface-primary/50 transition-all"
                  }
                >
                  Palavra
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("question")}
                  disabled={!isHost}
                  className={
                    room.mode === "question"
                      ? "rounded-full bg-surface-primary px-5 py-1.5 text-sm font-black uppercase tracking-wider text-white transition-all"
                      : "px-5 py-1.5 text-sm font-black uppercase tracking-wider text-surface-primary/50 transition-all"
                  }
                >
                  Pergunta
                </button>
              </div>

              {room.mode === "word" && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleHint}
                    disabled={!isHost}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      room.settings.impostorHint ? "bg-game-safe" : "bg-surface-primary/20"
                    } ${!isHost ? "pointer-events-none opacity-50" : ""}`}
                  >
                    <div
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        room.settings.impostorHint ? "translate-x-5" : ""
                      }`}
                    />
                  </button>

                  <div className="group relative inline-flex cursor-help items-center gap-1">
                    <span className="font-condensed text-xs uppercase tracking-wider text-surface-primary/70">
                      Dica do Impostor
                    </span>
                    <span className="text-xs text-surface-primary/40 ml-1">i</span>
                    <div className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg bg-black/80 px-3 py-2 text-center text-xs text-white transition-all group-hover:visible">
                      O impostor recebe uma palavra de dica relacionada a palavra
                      dos outros jogadores
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center gap-2">
                <p className="font-body text-sm text-surface-primary/60">
                  {playerCount} jogador{playerCount !== 1 ? "es" : ""} na sala
                  {playerCount < MIN_PLAYERS && (
                    <span className="ml-1 text-game-warning">(minimo 3)</span>
                  )}
                </p>

                {isHost && playerCount < room.settings.maxPlayers && (
                  <button onClick={handleAddBot} className="flex items-center gap-1.5 rounded-full bg-surface-primary/10 border border-surface-primary/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-surface-primary/60 hover:bg-surface-primary/20 hover:text-surface-primary transition-all">
                    <Plus size={12} /> Adicionar Bot
                  </button>
                )}

                {playerCount < 3 && (
                  <p className="font-condensed text-xs uppercase tracking-widest text-surface-primary/40 text-center">
                    Aguarde jogadores entrarem ou adicione bots.
                  </p>
                )}
              </div>

              {actionError && (
                <p className="text-center font-body text-sm text-game-impostor">
                  {actionError}
                </p>
              )}

              <div className="flex w-full flex-col gap-3">
                {isHost && (
                  <GameButton
                    variant="filled"
                    size="lg"
                    icon={<Icon icon="solar:play-bold" width={20} height={20} />}
                    onClick={handleStartGame}
                    disabled={startDisabled}
                    className={
                      startDisabled
                        ? "!pointer-events-auto !cursor-not-allowed !border-gray-200 !bg-gray-200 !text-gray-400 !shadow-none !opacity-100 hover:!translate-y-0 hover:!brightness-100 hover:!shadow-none active:!translate-y-0"
                        : ""
                    }
                  >
                    Iniciar
                  </GameButton>
                )}

                <GameButton
                  variant="outline"
                  size="lg"
                  icon={<Icon icon="solar:arrow-left-bold" width={20} height={20} />}
                  onClick={handleLeave}
                >
                  Voltar
                </GameButton>
              </div>
            </div>
          </GameCircle>
        </div>
      </div>
    </div>
  );
}
