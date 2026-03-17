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
import { EvidencePhase } from "@/components/game/phases/EvidencePhase";
import { HostControls } from "@/components/game/HostControls";
import { SpectatorBanner } from "@/components/game/SpectatorBanner";
import FloatingChat from "@/components/game/FloatingChat";
import { ReactionProvider } from "@/components/game/reactions/ReactionProvider";
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

  let phaseComponent: React.ReactNode = null;

  switch (round.status) {
    case "distributing":
      phaseComponent = <DistributingPhase {...phaseProps} />;
      break;
    case "speaking":
      phaseComponent = <SpeakingPhase {...phaseProps} />;
      break;
    case "answering":
      phaseComponent = <AnsweringPhase {...phaseProps} />;
      break;
    case "revealing":
      phaseComponent = <RevealingPhase {...phaseProps} />;
      break;
    case "discussion":
      phaseComponent = <DiscussionPhase {...phaseProps} />;
      break;
    case "evidence":
      phaseComponent = <EvidencePhase {...phaseProps} />;
      break;
    case "voting":
      phaseComponent = <VotingPhase {...phaseProps} />;
      break;
    case "results":
      phaseComponent = <ResultsPhase {...phaseProps} />;
      break;
  }

  return (
    <ReactionProvider roomId={room._id}>
      {myPlayer.isHost && <HostControls room={room} sessionId={sessionId || ""} />}
      {myPlayer.isSpectator && <SpectatorBanner />}
      {phaseComponent}
      <FloatingChat
        roomId={room._id}
        playerId={myPlayer._id}
        sessionId={sessionId || ""}
      />
    </ReactionProvider>
  );
}
