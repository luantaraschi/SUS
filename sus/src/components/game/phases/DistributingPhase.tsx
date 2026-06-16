"use client";

import { useEffect, useRef } from "react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import { playSound } from "@/lib/sound";
import {
  MasterCreatingQuestion,
  RolesReadinessBoard,
} from "./distributing/WaitingForRoles";
import { MasterQuestionSetup } from "./distributing/MasterQuestionSetup";
import { ReadyConfirmation } from "./distributing/ReadyConfirmation";

interface DistributingPhaseProps {
  round: SafeRound;
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  players: PublicPlayer[];
  room: Doc<"rooms">;
  sessionId: string;
}

/**
 * Thin router for the role-distribution phase. It owns the one cross-cutting
 * side effect (the `role.reveal` signature sound, fired once when the player's
 * role first arrives) and then dispatches to one of the dedicated screens based
 * on the exact same conditions the monolith used.
 */
export function DistributingPhase({
  round,
  myPlayer,
  myRole,
  players,
  room,
  sessionId,
}: DistributingPhaseProps) {
  // Fire role.reveal once when the player's role/secret first arrives.
  const roleRevealedRef = useRef(false);
  useEffect(() => {
    if (myRole && !roleRevealedRef.current) {
      roleRevealedRef.current = true;
      playSound("role.reveal");
    }
  }, [myRole]);

  const isMaster = myRole?.role === "master";

  // 1) Already confirmed (or master who finished the questions): readiness board.
  if (myPlayer.status === "ready" || (isMaster && round.questionMain != null)) {
    return <RolesReadinessBoard players={players} />;
  }

  // 2) Non-master waiting while the master writes the two questions.
  if (room.mode === "question" && !isMaster && !round.questionMain) {
    return (
      <MasterCreatingQuestion roomId={round.roomId} sessionId={sessionId} />
    );
  }

  // 3) Master setting up the round's two questions.
  if (room.mode === "question" && isMaster) {
    return (
      <MasterQuestionSetup
        round={round}
        players={players}
        room={room}
        sessionId={sessionId}
      />
    );
  }

  // 4) Player / impostor secret reveal + ready confirmation.
  return (
    <ReadyConfirmation
      round={round}
      myPlayer={myPlayer}
      myRole={myRole}
      room={room}
      sessionId={sessionId}
    />
  );
}
