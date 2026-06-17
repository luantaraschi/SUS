"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { useSessionId } from "@/lib/useSessionId";
import GameCircle from "@/components/game/GameCircle";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "@/components/game/PlayerAvatar";
import SignInModal from "@/components/auth/SignInModal";
import GameSettingsButton from "@/components/game/GameSettingsButton";
import LobbyPanel from "@/components/game/lobby/LobbyPanel";
import { MIN_PLAYERS, useRoomSettings } from "@/components/game/lobby/useRoomSettings";
import { BubbleText } from "@/components/ui/bubble-text";
import { Burst } from "@/components/ui/Burst";
import { spring, staggerContainer } from "@/lib/motion";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useSound } from "@/lib/useSound";

function getAvatarStatus(status: "connected" | "ready" | "disconnected") {
  return status === "connected" ? "online" : status === "ready" ? "ready" : "disconnected";
}

type OrbitPlayer = {
  _id: string;
  name: string;
  emoji?: string;
  avatarImageUrl?: string | null;
  isHost: boolean;
  isBot?: boolean;
  joinedAt: number;
  status: "connected" | "ready" | "disconnected";
};

/** Avatars "report for duty": pop slightly past 1.0 then settle (spring.pop). */
const orbitArrival = {
  initial: { opacity: 0, scale: 0.6, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring.pop },
};

/** Animated, removable avatar used in the orbit rings around the lobby panel. */
function OrbitAvatar({
  player,
  canRemove,
  onRemove,
  launchKey,
  mountedAt,
}: {
  player: OrbitPlayer;
  canRemove: boolean;
  onRemove?: () => void;
  /** A changing value makes the whole squad give a synchronized upward hop. */
  launchKey: number;
  /** Stable page-mount timestamp; bot Burst only fires for bots that joined after this. */
  mountedAt: number;
}) {
  const reduceMotion = useReducedMotion();
  // Deterministic per-player jitter so the squad hop reads as "almost together".
  const hopDelay = (player._id.charCodeAt(player._id.length - 1) % 8) * 0.012;
  // Only burst for bots that joined after the page mounted — not pre-existing ones.
  const botJoinedAfterMount = Boolean(player.isBot) && player.joinedAt > mountedAt;
  return (
    <motion.div
      layout
      variants={reduceMotion ? { initial: { opacity: 0 }, animate: { opacity: 1 } } : orbitArrival}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.2 } }}
    >
      {/* Synchronized "go" hop, keyed off the launch beat. */}
      <motion.div
        className="relative"
        key={`hop-${launchKey}`}
        initial={false}
        animate={reduceMotion || launchKey === 0 ? { y: 0 } : { y: [0, -10, 0] }}
        transition={reduceMotion ? { duration: 0 } : { ...spring.pop, delay: hopDelay }}
      >
        {/* Playful puff only for bots that joined after this page mounted. */}
        {!reduceMotion && botJoinedAfterMount && (
          <Burst fire colors={["var(--color-info)", "var(--glass-2)"]} count={8} />
        )}
        <PlayerAvatar
          name={player.name}
          avatarSeed={player.emoji}
          imageUrl={player.avatarImageUrl}
          isHost={player.isHost}
          isBot={player.isBot}
          status={getAvatarStatus(player.status)}
          size="orbit"
          interactive
          canRemove={canRemove}
          onRemove={onRemove}
        />
      </motion.div>
    </motion.div>
  );
}

export default function RoomLobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const sessionId = useSessionId();

  const { play: playSound } = useSound();
  const prevPlayerCountRef = useRef<number | null>(null);

  const [mountedAt] = useState(() => Date.now());
  const [codeHidden, setCodeHidden] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [launchKey, setLaunchKey] = useState(0);
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

  const settings = useRoomSettings({ room, sessionId, isHost, playerCount });

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
    async (botPlayerId: string) => {
      if (!room || !sessionId || !isHost || removingBotId) return;
      setActionError("");
      setRemovingBotId(botPlayerId);
      try {
        await removeBot({ roomId: room._id, sessionId, botPlayerId: botPlayerId as Id<"players"> });
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
      // Fire the "arm the game" celebration only on success (Burst + panel settle + squad hop).
      setLaunchKey((k) => k + 1);
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
      if (count > prev) playSound("lobby.join");
      else if (count < prev) playSound("lobby.leave");
    }
    prevPlayerCountRef.current = count;
  }, [players, playSound]);

  if (!sessionId) {
    return (
      <div className="flex min-h-dvh items-center justify-center font-display text-2xl text-[var(--color-text)]">
        Carregando...
      </div>
    );
  }

  if (room === undefined || players === undefined || profile === undefined || startReadiness === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center font-display text-2xl text-[var(--color-text)]">
        Entrando na sala...
      </div>
    );
  }

  if (room === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <p className="font-display text-3xl text-[var(--color-text)]">Sala nao encontrada</p>
        <Button variant="glass" size="game-lg" onClick={() => router.push("/")} className="!w-auto px-8">
          Voltar
        </Button>
      </div>
    );
  }

  const startDisabled = playerCount < MIN_PLAYERS || isStartingGame || !startReadiness.ready;

  const lobbyPanel = (
    <LobbyPanel
      room={room}
      code={code}
      codeHidden={codeHidden}
      copied={copied}
      codeCopied={codeCopied}
      playerCount={playerCount}
      numImpostors={settings.numImpostors}
      maxImpostors={settings.maxImpostors}
      packOptions={packOptions ?? []}
      players={players}
      isHost={isHost}
      actionError={actionError}
      isAddingBot={isAddingBot}
      isStartingGame={isStartingGame}
      startDisabled={startDisabled}
      launchKey={launchKey}
      startReadinessMessage={startReadiness.message}
      onToggleCodeHidden={() => setCodeHidden((current) => !current)}
      onShare={handleShare}
      onCopyCode={handleCopyCode}
      onChangeMaxPlayers={settings.changeMaxPlayers}
      onChangeRounds={settings.changeRounds}
      onChangeImpostors={settings.changeImpostors}
      onModeChange={settings.changeMode}
      onQuestionModeChange={settings.changeQuestionMode}
      onMasterChange={settings.changeMaster}
      onPackChange={settings.changePack}
      onToggleHint={settings.toggleHint}
      onAddBot={handleAddBot}
      onStart={handleStartGame}
      onLeave={async () => {
        if (!myPlayer || !sessionId) return;
        await leaveRoom({ playerId: myPlayer._id, sessionId });
        router.push("/");
      }}
    />
  );

  const renderOrbit = (player: OrbitPlayer) => (
    <OrbitAvatar
      key={player._id}
      player={player}
      canRemove={isHost && Boolean(player.isBot) && !removingBotId}
      onRemove={player.isBot ? () => void handleRemoveBot(player._id) : undefined}
      launchKey={launchKey}
      mountedAt={mountedAt}
    />
  );

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      {/* Top bar: settings + account/profile */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-end px-4 pt-3 sm:px-6 sm:pt-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <GameSettingsButton sessionId={sessionId} />
          {profile ? (
            <button
              onClick={() => router.push("/profile")}
              className="flex h-11 items-center gap-2 rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-4 text-[var(--color-text)] shadow-[var(--shadow-sm)] backdrop-blur-[var(--blur-md)] transition-[background-color,transform] duration-[var(--t-quick)] hover:bg-[var(--glass-2)] active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-[var(--ring-focus)]"
            >
              <PlayerAvatar name={profile.displayName} avatarSeed={profile.avatarSeed} imageUrl={profile.avatarUrl} size="sm" hideName />
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

      <div className="flex w-full min-h-0 flex-1 flex-col px-2 pt-4 sm:px-4 sm:pt-6">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-4">
          <BubbleText
            text="SUS"
            className="font-display text-[clamp(3.4rem,6vw,5.8rem)] tracking-wide [text-shadow:0_5px_0_rgba(0,0,0,0.18),0_0_34px_rgba(214,77,194,0.4)]"
          />

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
            {/* Mobile / tablet layout */}
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden lg:hidden">
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex flex-wrap items-center justify-center gap-3"
              >
                <AnimatePresence mode="popLayout">{mobileTopPlayers.map(renderOrbit)}</AnimatePresence>
              </motion.div>

              <GameCircle className="flex h-full min-h-0 max-h-[min(76dvh,100%)] max-w-[740px] px-4 pb-4 pt-12 sm:px-6 sm:pb-5 sm:pt-14">
                <div className="flex h-full min-h-0 w-full flex-col">{lobbyPanel}</div>
              </GameCircle>

              {mobileBottomPlayers.length > 0 && (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="flex flex-wrap items-center justify-center gap-3"
                >
                  <AnimatePresence mode="popLayout">{mobileBottomPlayers.map(renderOrbit)}</AnimatePresence>
                </motion.div>
              )}
            </div>

            {/* Desktop layout */}
            <div className="hidden h-full min-h-0 items-center justify-center gap-4 lg:flex">
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex w-20 flex-col items-center gap-3"
              >
                <AnimatePresence mode="popLayout">{leftPlayers.map(renderOrbit)}</AnimatePresence>
              </motion.div>

              <GameCircle className="flex h-full min-h-0 max-h-[min(78dvh,100%)] max-w-[740px] flex-1 px-6 pb-5 pt-12">
                <div className="flex h-full min-h-0 w-full flex-col">{lobbyPanel}</div>
              </GameCircle>

              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex w-20 flex-col items-center gap-3"
              >
                <AnimatePresence mode="popLayout">{rightPlayers.map(renderOrbit)}</AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

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
