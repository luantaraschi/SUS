"use client";

import { use, useEffect } from "react";
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
import { useRouter } from "next/navigation";

export default function PlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const sessionId = useSessionId();

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
      router.push(`/room/${code}`);
    }
  }, [room, code, router]);

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
  };

  switch (round.status) {
    case "distributing":
      return <DistributingPhase {...phaseProps} />;
    case "speaking":
      return <SpeakingPhase {...phaseProps} />;
    case "answering":
      return <AnsweringPhase {...phaseProps} />;
    case "revealing":
      return <RevealingPhase {...phaseProps} />;
    case "discussion":
      return <DiscussionPhase {...phaseProps} />;
    case "voting":
      return <VotingPhase {...phaseProps} />;
    case "results":
      return <ResultsPhase {...phaseProps} />;
    default:
      return null;
  }
}
