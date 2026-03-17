"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import { motion } from "framer-motion";
import PhaseIndicator from "../PhaseIndicator";
import Timer from "../Timer";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";

function isMasterQuestionMode(room: { mode: string; questionMode?: string }) {
  return room.mode === "question" && (room.questionMode ?? "system") === "master";
}

interface VotingPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  room: Doc<"rooms">;
  sessionId: string;
}

export function VotingPhase({ round, players, myPlayer, myRole, room, sessionId }: VotingPhaseProps) {
  const [selectedSuspect, setSelectedSuspect] = useState<Id<"players"> | null>(null);
  const submitVote = useMutation(api.votes.submitVote);
  const votes = useQuery(api.votes.getVotes, { roundId: round._id });
  const isMasterMode = room ? isMasterQuestionMode(room) : false;
  const answers = useQuery(api.answers.getAnswersByRound, isMasterMode ? { roundId: round._id } : "skip");

  const isMaster = round.masterId === myPlayer._id;
  const activePlayers = players.filter(
    (player) => player.status !== "disconnected" && player._id !== round.masterId
  );
  const totalVoters = activePlayers.length;
  const myVote = votes?.find((vote) => vote.voterId === myPlayer._id);
  const hasVoted = Boolean(myVote);
  const votedPlayerIds = new Set(votes?.map((vote) => vote.voterId));

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
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 py-8">
      <div className="text-center">
        <PhaseIndicator currentPhase="voting" mode={round.mode} questionMode={room?.questionMode} className="mb-4 justify-center" />
        <h2 className="font-display text-3xl text-white">Hora de votar</h2>
        <p className="mt-2 text-white/70">Quem voce acha que e o impostor?</p>
        {!isMasterMode && <Timer endsAt={round.phaseEndsAt} className="mt-4" />}
      </div>

      <div className="mt-3 text-center font-condensed text-sm uppercase tracking-[0.24em] text-white/60">
        {votes?.length || 0}/{totalVoters} votos enviados
      </div>

      {/* In master mode, show the question pinned at top */}
      {isMasterMode && round.questionMain && (
        <div className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center backdrop-blur-sm">
          <p className="font-condensed text-xs uppercase tracking-[0.2em] text-white/50">Pergunta da rodada</p>
          <p className="mt-1 font-display text-lg text-white">{round.questionMain}</p>
        </div>
      )}

      <div className="mt-8 grid w-full flex-1 content-start grid-cols-1 gap-4 md:grid-cols-2">
        {activePlayers.map((player) => {
          const isSelected = selectedSuspect === player._id;
          const isMe = myPlayer._id === player._id;

          return (
            <motion.button
              key={player._id}
              whileHover={{ scale: hasVoted || isMe || isMaster ? 1 : 1.015 }}
              whileTap={{ scale: hasVoted || isMe || isMaster ? 1 : 0.985 }}
              onClick={() => !hasVoted && !isMe && !isMaster && setSelectedSuspect(player._id)}
              disabled={hasVoted || isMe || isMaster}
              className={`relative rounded-[28px] border p-4 text-left transition-colors ${
                isSelected
                  ? "border-game-impostor bg-game-impostor/20"
                  : "border-white/10 bg-black/15 hover:bg-white/10"
              } ${(hasVoted || isMe || isMaster) ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-4">
                <PlayerAvatar
                  name={player.name}
                  avatarSeed={player.emoji}
                  imageUrl={player.avatarImageUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-2xl text-white">{player.name}</p>
                  <p className="font-condensed text-xs uppercase tracking-[0.24em] text-white/60">
                    {isMe ? "Voce" : votedPlayerIds.has(player._id) ? "Ja votou" : "Aguardando"}
                  </p>
                </div>
                {votedPlayerIds.has(player._id) && (
                  <span className="h-3 w-3 rounded-full bg-game-safe" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* In master mode, show answer cards for reference */}
      {isMasterMode && answers && answers.length > 0 && (
        <div className="mt-6 w-full">
          <p className="mb-3 text-center font-condensed text-xs uppercase tracking-[0.24em] text-white/50">
            Respostas para consulta
          </p>
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
            {answers.map((answer) => {
              const answerPlayer = players.find((p) => p._id === answer.playerId);
              if (!answerPlayer) return null;
              const isMarkedByMaster =
                myRole?.role === "master" && myRole.masterImpostorIds?.includes(answerPlayer._id);
              return (
                <div
                  key={answer._id}
                  className="rounded-2xl border border-white/10 bg-black/15 p-4 text-center"
                >
                  <p className="mb-1 flex items-center justify-center gap-1 font-hand text-sm text-white/60">
                    [{answerPlayer.name}]
                    {isMarkedByMaster && (
                      <span className="text-xs text-game-impostor">?</span>
                    )}
                  </p>
                  <p className="break-words font-body text-base text-white/90">
                    &quot;{answer.text}&quot;
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isMaster && !hasVoted ? (
        <div className="mx-auto mt-6 w-full max-w-md">
          <Button
            className="w-full py-6 text-lg font-bold"
            disabled={!selectedSuspect}
            onClick={() => void handleVote()}
            variant={selectedSuspect ? "destructive" : "secondary"}
          >
            Confirmar voto
          </Button>
        </div>
      ) : (
        <div className="mt-6 text-center font-body text-white/70">
          {isMaster ? "O mestre observa esta rodada e nao vota." : "Seu voto foi registrado. Aguarde o restante da sala."}
        </div>
      )}
    </div>
  );
}
