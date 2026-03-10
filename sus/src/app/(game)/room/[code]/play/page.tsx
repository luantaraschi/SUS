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

  useEffect(() => {
    if (!myPlayer?._id || !sessionId) return;
    void updateStatus({ playerId: myPlayer._id, sessionId, status: "connected" });
  }, [myPlayer?._id, sessionId, updateStatus]);

  useEffect(() => {
    if (room && room.status !== "playing") {
      router.push(`/room/${code}`);
    }
  }, [room, code, router]);

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
    case "answering":
      return <AnsweringPhase {...phaseProps} />;
    case "revealing":
      return <RevealingPhase round={round} players={players} />;
    case "voting":
      return <VotingPhase {...phaseProps} />;
    case "results":
      return <ResultsPhase {...phaseProps} />;
    default:
      return null;
  }
}
