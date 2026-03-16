"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import { motion } from "framer-motion";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";

interface VotingPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  sessionId: string;
}

export function VotingPhase({ round, players, myPlayer, sessionId }: VotingPhaseProps) {
  const [selectedSuspect, setSelectedSuspect] = useState<Id<"players"> | null>(null);
  const submitVote = useMutation(api.votes.submitVote);
  const votes = useQuery(api.votes.getVotes, { roundId: round._id });

  const isMaster = round.masterId === myPlayer._id;
  const activePlayers = players.filter(
    (player) => player.status !== "disconnected" && player._id !== round.masterId
  );
  const totalVoters = activePlayers.length;
  const myVote = votes?.find((vote) => vote.voterId === myPlayer._id);
  const hasVoted = Boolean(myVote);

  const handleVote = async () => {
    if (!selectedSuspect || hasVoted || isMaster) return;

    await submitVote({
      roundId: round._id,
      voterId: myPlayer._id,
      sessionId,
      suspectId: selectedSuspect,
    });
  };

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-2xl flex-col items-center px-4 pb-6 pt-12">
      <div className="mb-8 text-center">
        <h2 className="mb-2 font-display text-3xl text-white">Hora de Votar</h2>
        <p className="text-white/60">Quem e o Impostor?</p>
      </div>

      <div className="grid w-full flex-1 content-start grid-cols-2 gap-4">
        {activePlayers.map((player) => {
          const isSelected = selectedSuspect === player._id;
          const isMe = myPlayer._id === player._id;

          return (
            <motion.button
              key={player._id}
              whileHover={{ scale: hasVoted || isMe || isMaster ? 1 : 1.02 }}
              whileTap={{ scale: hasVoted || isMe || isMaster ? 1 : 0.98 }}
              onClick={() => !hasVoted && !isMe && !isMaster && setSelectedSuspect(player._id)}
              disabled={hasVoted || isMe || isMaster}
              className={`relative flex flex-col items-center gap-3 rounded-2xl border-2 p-4 transition-colors ${
                isSelected
                  ? "border-red-500 bg-red-500/20"
                  : "border-transparent bg-white/5 hover:bg-white/10"
              } ${(hasVoted || isMe || isMaster) ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <PlayerAvatar
                name={player.name}
                avatarSeed={player.emoji}
                imageUrl={player.avatarImageUrl}
                size="lg"
              />
              <span className="font-medium text-white">{player.name}</span>
            </motion.button>
          );
        })}
      </div>

      {!isMaster && !hasVoted ? (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
          <Button
            className="w-full py-6 text-lg font-bold"
            disabled={!selectedSuspect}
            onClick={() => void handleVote()}
            variant={selectedSuspect ? "destructive" : "secondary"}
          >
            Confirmar Voto
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 flex flex-col items-center bg-gradient-to-t from-black via-black/80 to-transparent p-8 text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="font-medium text-white/80">
            Aguardando votos... ({votes?.length || 0}/{totalVoters})
          </p>
        </div>
      )}
    </div>
  );
}
