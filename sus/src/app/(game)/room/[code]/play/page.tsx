"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useSessionId } from "@/lib/useSessionId";
import { DistributingPhase } from "@/components/game/phases/DistributingPhase";
import { AnsweringPhase } from "@/components/game/phases/AnsweringPhase";
import { RevealingPhase } from "@/components/game/phases/RevealingPhase";
import { VotingPhase } from "@/components/game/phases/VotingPhase";
import { ResultsPhase } from "@/components/game/phases/ResultsPhase";
import { DiscussionPhase } from "@/components/game/phases/DiscussionPhase";
import { SpeakingPhase } from "@/components/game/phases/SpeakingPhase";
import { EvidencePhase } from "@/components/game/phases/EvidencePhase";
import { HostControls } from "@/components/game/HostControls";
import { SpectatorBanner } from "@/components/game/SpectatorBanner";
import FloatingChat from "@/components/game/FloatingChat";
import { ReactionProvider } from "@/components/game/reactions/ReactionProvider";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { phaseTransition } from "@/lib/motion";

export default function PlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const sessionId = useSessionId();
  const roomPath = `/room/${code.toUpperCase()}`;
  const [isReturningToLobby, setIsReturningToLobby] = useState(false);

  const room = useQuery(api.rooms.getRoomByCode, { code: code.toUpperCase() }); 
  const myPlayer = useQuery(
    api.rooms.getMyPlayer,
    room && sessionId ? { roomId: room._id, sessionId } : "skip"
  );
  
  const players = useQuery(
    api.rooms.getPlayers,
    room ? { roomId: room._id } : "skip"
  );

  const round = useQuery(
    api.rounds.getCurrentRound,
    room ? { roomId: room._id } : "skip"
  );

  const myRole = useQuery(
    api.rounds.getMyRole,
    round && sessionId ? { roundId: round._id, sessionId } : "skip"
  );

  const updateStatus = useMutation(api.players.updateStatus);
  const backToLobby = useMutation(api.rooms.backToLobby);

  const handleBackToLobby = useCallback(async () => {
    if (!room || !sessionId || isReturningToLobby) return;

    setIsReturningToLobby(true);

    try {
      await backToLobby({ roomId: room._id, sessionId });
      router.replace(roomPath);
    } catch (error) {
      setIsReturningToLobby(false);
      console.error("Failed to return room to lobby", error);
    }
  }, [backToLobby, isReturningToLobby, room, roomPath, router, sessionId]);

  // Fix 1.4: cleanup de disconnection — marca jogador como disconnected ao sair da página
  useEffect(() => {
    if (!myPlayer?._id || !sessionId) return;
    void updateStatus({ playerId: myPlayer._id, sessionId, status: "connected" });
    return () => {
      void updateStatus({ playerId: myPlayer._id, sessionId, status: "disconnected" });
    };
  }, [myPlayer?._id, sessionId, updateStatus]);

  // Redireciona para lobby se a sala não estiver em jogo
  useEffect(() => {
    if (room && room.status !== "playing") {
      router.replace(roomPath);
    }
  }, [room, roomPath, router]);

  useEffect(() => {
    if (room?.status === "playing" && round === null) {
      router.replace(roomPath);
    }
  }, [room?.status, roomPath, round, router]);

  // Fix 1.5: Se myPlayer é null (não undefined/loading), o jogador não é membro da sala
  useEffect(() => {
    if (myPlayer === null) {
      router.push("/");
    }
  }, [myPlayer, router]);

  if (!room || !myPlayer || !round || !players) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-surface-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const phaseProps = {
    round,
    myPlayer,
    myRole,
    players,
    room,
    sessionId: sessionId || "",
    onBackToLobby: handleBackToLobby,
    isReturningToLobby,
  };

  const phaseMap: Partial<Record<typeof round.status, React.ReactNode>> = {
    distributing: <DistributingPhase {...phaseProps} />,
    speaking: <SpeakingPhase {...phaseProps} />,
    answering: <AnsweringPhase {...phaseProps} />,
    revealing: <RevealingPhase {...phaseProps} />,
    discussion: <DiscussionPhase {...phaseProps} />,
    evidence: <EvidencePhase {...phaseProps} />,
    voting: <VotingPhase {...phaseProps} />,
    results: <ResultsPhase {...phaseProps} />,
  };

  const phaseComponent = phaseMap[round.status] ?? null;

  return (
    <ReactionProvider roomId={room._id}>
      {myPlayer.isHost && (
        <HostControls
          room={room}
          sessionId={sessionId || ""}
          onBackToLobby={handleBackToLobby}
          isReturningToLobby={isReturningToLobby}
        />
      )}
      {myPlayer.isSpectator && <SpectatorBanner />}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={round.status}
          variants={phaseTransition}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full"
        >
          {phaseComponent}
        </motion.div>
      </AnimatePresence>
      <FloatingChat
        roomId={room._id}
        playerId={myPlayer._id}
        sessionId={sessionId || ""}
      />
    </ReactionProvider>
  );
}
