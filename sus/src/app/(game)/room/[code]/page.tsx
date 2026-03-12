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
import { BubbleText } from "@/components/ui/bubble-text";
import { Icon } from "@iconify/react";
import { Plus } from "lucide-react";

import SignInModal from "@/components/auth/SignInModal";

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 10;

const POSITIONS: Array<{ top: string; left: string; transform: string }> = [
  { top: "25%", left: "-2%", transform: "translate(-50%, -50%)" },
  { top: "25%", left: "102%", transform: "translate(-50%, -50%)" },
  { top: "50%", left: "-2%", transform: "translate(-50%, -50%)" },
  { top: "50%", left: "102%", transform: "translate(-50%, -50%)" },
  { top: "75%", left: "-2%", transform: "translate(-50%, -50%)" },
  { top: "75%", left: "102%", transform: "translate(-50%, -50%)" },
  { top: "3%", left: "18%", transform: "translate(-50%, -50%)" },
  { top: "3%", left: "82%", transform: "translate(-50%, -50%)" },
  { top: "106%", left: "23%", transform: "translate(-50%, -35%)" },
  { top: "106%", left: "50%", transform: "translate(-50%, -35%)" },
  { top: "106%", left: "77%", transform: "translate(-50%, -35%)" },
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
    <div className="flex gap-2 sm:gap-3">
      {code.split("").map((char, index) => (
        <div
          key={index}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-primary font-display text-2xl font-black text-white sm:h-16 sm:w-16 sm:rounded-2xl sm:text-4xl"
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
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-condensed text-xs uppercase tracking-wider text-surface-primary/70 sm:text-sm">
        {label}
      </span>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={disableDecrement}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-primary text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10 sm:rounded-lg"
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
          className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-primary text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10 sm:rounded-lg"
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
  const players = useQuery(
    api.rooms.getPlayers,
    room ? { roomId: room._id } : "skip"
  );
  const myPlayer = useQuery(
    api.rooms.getMyPlayer,
    room && sessionId ? { roomId: room._id, sessionId } : "skip"
  );
  const user = useQuery(api.users.current);
  const myPacks = useQuery(
    api.packs.getMyPacks,
    user && room ? { mode: room.mode } : "skip"
  );
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
      const maximum = field === "maxPlayers" ? MAX_PLAYERS : field === "rounds" ? MAX_ROUNDS : 3;
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
        ...(mode === "question" ? { questionMode: "system" } : {}),
      });
    },
    [isHost, room, sessionId, updateSettings]
  );

  const handleQuestionModeChange = useCallback(
    (questionMode: "system" | "master") => {
      if (!room || !sessionId || !isHost || room.questionMode === questionMode) return;
      
      void updateSettings({
        roomId: room._id,
        sessionId,
        settings: {},
        questionMode,
      });
    },
    [isHost, room, sessionId, updateSettings]
  );

  const handleMasterChange = useCallback(
    (playerId: string) => {
      if (!room || !sessionId || !isHost) return;
      void updateSettings({
        roomId: room._id,
        sessionId,
        settings: { customMasterId: playerId },
      });
    },
    [isHost, room, sessionId, updateSettings]
  );

  const handlePackChange = useCallback(
    (packId: string) => {
      if (!room || !sessionId || !isHost) return;
      void updateSettings({
        roomId: room._id,
        sessionId,
        settings: { customPackId: packId ? (packId as Id<"customPacks">) : undefined },
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
  const startDisabled = playerCount < MIN_PLAYERS || isStartingGame;

  return (
    <div className="flex flex-col items-center gap-6 relative">
      {/* Botão de Conta Superior Direito */}
      <div className="absolute top-4 right-4 z-50">
        {user ? (
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all shadow-sm"
          >
            <PlayerAvatar name={user.name || "Conta"} avatarSeed={user.image || "default"} size="sm" hideName />
            <span className="font-display tracking-widest text-sm hidden sm:inline">Perfil</span>
          </button>
        ) : (
          <button
            onClick={() => setShowSignIn(true)}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-all shadow-sm"
          >
            <Icon icon="solar:user-circle-bold" width={24} height={24} />
            <span className="font-display tracking-widest text-sm hidden sm:inline">Criar Conta</span>
          </button>
        )}
      </div>

      <BubbleText
        text="SUS"
        className="font-display text-7xl tracking-wide drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] sm:text-[100px] mt-8"
      />

      <div className="mx-auto flex w-full max-w-[640px] flex-col items-center px-3 sm:px-4">
        {myPlayer && (
          <div className="relative z-20 -mb-12 flex flex-col items-center sm:-mb-14">
            <PlayerAvatar
              name={myPlayer.name}
              avatarSeed={myPlayer.emoji}
              isHost={myPlayer.isHost}
              isBot={myPlayer.isBot}
              status={getAvatarStatus(myPlayer.status)}
              size="xl"
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
                  size="lobby"
                  canRemove={isHost && player.isBot && !removingBotId}
                  onRemove={
                    player.isBot ? () => void handleRemoveBot(player._id) : undefined
                  }
                  status={getAvatarStatus(player.status)}
                />
              </div>
            );
          })}

          <GameCircle className="pt-12 pb-8 sm:pt-20 sm:pb-14 shadow-[0_12px_60px_rgba(0,0,0,0.3)]">
            <div className="flex w-full h-[540px] max-h-[70vh] max-w-[420px] sm:max-w-[480px] flex-col px-3 sm:px-6">
              
              {/* Scrollable Config Area */}
              <div className="flex w-full flex-col items-center gap-2 sm:gap-4 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1 min-h-0">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className="font-condensed text-sm uppercase tracking-widest text-surface-primary/70 sm:text-base">
                    Codigo da Sala:
                  </span>
                  <div className="flex items-center gap-4 sm:gap-5">
                    <button
                      type="button"
                      onClick={() => setCodeHidden((current) => !current)}
                      className="text-surface-primary/60 hover:text-surface-primary"
                    >
                      {codeHidden ? (
                        <Icon icon="solar:eye-closed-bold" width={28} height={28} />
                      ) : (
                        <Icon icon="solar:eye-bold" width={28} height={28} />
                      )}
                    </button>

                    <CodeBlock code={code.toUpperCase()} hidden={codeHidden} />

                    <button
                      type="button"
                      onClick={handleShare}
                      className="text-surface-primary/60 hover:text-surface-primary"
                    >
                      <Icon icon="solar:share-bold" width={28} height={28} />
                    </button>
                  </div>
                  {copied && (
                    <span className="font-body text-sm text-game-safe sm:text-base">Link copiado!</span>
                  )}
                </div>

                <div className="flex gap-4 sm:gap-8 shrink-0 flex-wrap justify-center">
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
                  <Counter
                    label="Impostores"
                    value={room.settings.numImpostors || 1}
                    onDecrement={() => {
                        if (isHost && (room.settings.numImpostors || 1) > 1) {
                           void updateSettings({ roomId: room._id, sessionId, settings: { numImpostors: (room.settings.numImpostors || 1) - 1 } });
                        }
                    }}
                    onIncrement={() => {
                        if (isHost && (room.settings.numImpostors || 1) < 3) {
                           void updateSettings({ roomId: room._id, sessionId, settings: { numImpostors: (room.settings.numImpostors || 1) + 1 } });
                        }
                    }}
                    disableDecrement={!isHost || (room.settings.numImpostors || 1) <= 1}
                    disableIncrement={!isHost || (room.settings.numImpostors || 1) >= 3 || (room.settings.numImpostors || 1) >= room.settings.maxPlayers - 2}
                  />
                </div>

                <div className="flex rounded-full bg-surface-primary/10 p-1 sm:p-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleModeChange("word")}
                    disabled={!isHost}
                    className={
                      room.mode === "word"
                        ? "rounded-full bg-surface-primary px-6 py-2 text-sm font-black uppercase tracking-wider text-white transition-all sm:px-8 sm:py-2.5 sm:text-base"
                        : "px-6 py-2 text-sm font-black uppercase tracking-wider text-surface-primary/50 transition-all sm:px-8 sm:py-2.5 sm:text-base"
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
                        ? "rounded-full bg-surface-primary px-6 py-2 text-sm font-black uppercase tracking-wider text-white transition-all sm:px-8 sm:py-2.5 sm:text-base"
                        : "px-6 py-2 text-sm font-black uppercase tracking-wider text-surface-primary/50 transition-all sm:px-8 sm:py-2.5 sm:text-base"
                    }
                  >
                    Pergunta
                  </button>
                </div>

                {user && myPacks && myPacks.length > 0 && (
                  <div className="flex flex-col items-center gap-1.5 mt-1 shrink-0 w-full max-w-[240px]">
                    <span className="font-condensed text-[10px] uppercase tracking-widest text-surface-primary/70 sm:text-sm">
                      Pacote de Cartas
                    </span>
                    <select
                      value={room.settings.customPackId || ""}
                      onChange={(e) => handlePackChange(e.target.value)}
                      disabled={!isHost}
                      className="w-full rounded-lg bg-surface-primary/10 border border-surface-primary/20 px-3 py-2 text-sm font-body text-surface-primary outline-none focus:border-surface-primary focus:ring-1 focus:ring-surface-primary disabled:opacity-50"
                    >
                      <option value="">Padrão do Jogo</option>
                      {myPacks.map((pack: any) => (
                        <option key={pack._id} value={pack._id}>
                          {pack.title} ({pack.items.length})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {room.mode === "word" && (
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleHint}
                      disabled={!isHost}
                      className={`relative h-6 w-11 rounded-full transition-colors sm:h-8 sm:w-14 ${
                        room.settings.impostorHint ? "bg-game-safe" : "bg-surface-primary/20"
                      } ${!isHost ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <div
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform sm:h-7 sm:w-7 ${
                          room.settings.impostorHint ? "translate-x-5 sm:translate-x-6" : ""
                        }`}
                      />
                    </button>

                    <div className="group relative inline-flex cursor-help items-center gap-1.5">
                      <span className="font-condensed text-xs uppercase tracking-wider text-surface-primary/70 sm:text-sm">
                        Dica do Impostor
                      </span>
                      <span className="text-xs text-surface-primary/40 ml-0.5">i</span>
                      <div className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg bg-black/80 px-4 py-3 text-center text-sm text-white transition-all group-hover:visible">
                        O impostor recebe uma palavra de dica relacionada a palavra
                        dos outros jogadores
                      </div>
                    </div>
                  </div>
                )}

                {room.mode === "question" && (
                  <div className="flex flex-col w-full gap-2 mt-0 px-4 py-2 bg-black/5 rounded-2xl border border-surface-primary/10 shrink-0">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-condensed text-xs uppercase tracking-widest text-surface-primary/70 sm:text-sm">
                        Tipo de Pergunta
                      </span>
                      <div className="flex rounded-full bg-surface-primary/10 p-1 sm:p-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuestionModeChange("system")}
                          disabled={!isHost}
                          className={
                            room.questionMode !== "master"
                              ? "rounded-full bg-surface-primary px-4 py-1.5 text-xs font-black uppercase text-white transition-all"
                              : "px-4 py-1.5 text-xs font-black uppercase text-surface-primary/50 transition-all"
                          }
                        >
                          Prontas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuestionModeChange("master")}
                          disabled={!isHost}
                          className={
                            room.questionMode === "master"
                              ? "rounded-full bg-surface-primary px-4 py-1.5 text-xs font-black uppercase text-white transition-all"
                              : "px-4 py-1.5 text-xs font-black uppercase text-surface-primary/50 transition-all"
                          }
                        >
                          Mestre Cria
                        </button>
                      </div>
                    </div>

                    {room.questionMode === "master" && (
                      <div className="flex flex-col items-center gap-1.5 mt-1">
                        <span className="font-condensed text-[10px] uppercase tracking-widest text-surface-primary/70 sm:text-sm">
                          Quem será o Mestre?
                        </span>
                        <select
                          value={room.settings.customMasterId || players?.find((p: any) => p.isHost)?._id}
                          onChange={(e) => handleMasterChange(e.target.value)}
                          disabled={!isHost}
                          className="w-full max-w-[200px] rounded-lg bg-surface-primary/10 border border-surface-primary/20 px-3 py-2 text-sm font-body text-surface-primary outline-none focus:border-surface-primary focus:ring-1 focus:ring-surface-primary"
                        >
                          {players?.filter((p: any) => p.status !== "disconnected").map((p: any) => (
                            <option key={p._id} value={p._id}>{p.name} {p.isHost ? "(Host)" : ""}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                  <p className="font-body text-sm text-center text-surface-primary/60 sm:text-base">
                    {playerCount} jogador{playerCount !== 1 ? "es" : ""} na sala
                    {playerCount < MIN_PLAYERS && (
                      <span className="ml-1 text-game-warning">(minimo 3)</span>
                    )}
                  </p>

                  {isHost && playerCount < room.settings.maxPlayers && (
                    <button
                      onClick={handleAddBot}
                      className="flex items-center gap-1.5 rounded-full border border-surface-primary/20 bg-surface-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-surface-primary/60 transition-all hover:bg-surface-primary/20 hover:text-surface-primary sm:px-4 sm:py-2 sm:text-sm"
                    >
                      <Plus size={16} /> Adicionar Bot
                    </button>
                  )}

                  {playerCount < 3 && (
                    <p className="font-condensed text-center text-[10px] uppercase tracking-widest text-surface-primary/40 sm:text-xs">
                      Aguarde jogadores entrarem ou adicione bots.
                    </p>
                  )}
                </div>
                
              </div>

              {/* Fixed Bottom Action Area */}
              <div className="w-full pt-3 mt-auto shrink-0 border-t border-surface-primary/10 flex flex-col gap-2">
                {actionError && (
                  <p className="text-center font-body text-xs text-game-impostor sm:text-sm">
                    {actionError}
                  </p>
                )}

                <div className="flex w-full flex-col gap-2">
                  {isHost && (
                    <GameButton
                      variant="filled"
                      size="lg"
                      icon={<Icon icon="solar:play-bold" width={20} height={20} />}
                      onClick={handleStartGame}
                      disabled={startDisabled}
                      className={
                        startDisabled
                          ? "!pointer-events-auto !cursor-not-allowed !border-gray-200 !bg-gray-200 !text-gray-400 !shadow-none !opacity-100"
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
            </div>
          </GameCircle>
        </div>
      </div>

      {showSignIn && (
        <SignInModal 
          onClose={() => setShowSignIn(false)} 
          onSuccess={() => {
            setShowSignIn(false);
            if (sessionId) {
              linkSession({ sessionId }).catch(console.error);
            }
          }} 
        />
      )}
    </div>
  );
}
