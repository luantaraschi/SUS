"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import ShareResult from "../ShareResult";
import { AnimatePresence, motion } from "framer-motion";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";

interface ResultsPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  sessionId: string;
  room: Doc<"rooms">;
}

export function ResultsPhase({ round, players, myPlayer, sessionId, room }: ResultsPhaseProps) {
  const isHost = myPlayer.isHost;
  const [showResults, setShowResults] = useState(false);
  const startNextRound = useMutation(api.rooms.startNextRound);

  const votes = useQuery(api.votes.getVotes, { roundId: round._id });
  const roundResult = useQuery(api.rounds.getRoundResult, { roundId: round._id });

  useEffect(() => {
    const timer = window.setTimeout(() => setShowResults(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  const realImpostors = roundResult
    ? players.filter((player) => roundResult.impostorIds?.includes(player._id))
    : [];
  const votedOut = roundResult?.votedOutId
    ? players.find((player) => player._id === roundResult.votedOutId) ?? null
    : null;
  const groupWon = roundResult ? !roundResult.impostorWon : false;

  return (
    <div className="fixed inset-0 z-40 flex h-[100dvh] w-full flex-col items-center justify-center bg-black/80 px-4 pb-6 pt-12 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key="loading"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5, repeatType: "reverse", repeat: Infinity }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-24 w-24 animate-spin rounded-full border-8 border-white/20 border-t-white" />
            <p className="text-2xl font-bold uppercase tracking-widest text-white">Calculando...</p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full flex-col items-center gap-8"
          >
            <h1
              className={`text-center font-display text-4xl font-black uppercase tracking-tight drop-shadow-[0_0_15px_currentColor] md:text-5xl ${
                groupWon ? "text-game-safe" : "text-game-impostor"
              }`}
            >
              {groupWon ? "Vitoria do Grupo" : "Vitoria do Impostor"}
            </h1>

            <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl border-2 border-white/10 bg-surface-primary p-6 shadow-2xl">
              <span className="text-sm font-bold uppercase tracking-widest text-white/60">
                {realImpostors.length > 1 ? "Os Impostores eram:" : "O Impostor era:"}
              </span>
              <div className="flex flex-row flex-wrap justify-center gap-6">
                {realImpostors.map((impostor) => (
                  <div key={impostor._id} className="flex flex-col items-center gap-3">
                    <PlayerAvatar
                      name={impostor.name}
                      avatarSeed={impostor.emoji}
                      imageUrl={impostor.avatarImageUrl}
                      size="xl"
                    />
                    <span className="text-xl font-bold text-white">{impostor.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full text-center">
              <p className="mb-2 text-lg text-white/80">
                {roundResult?.votedOutId
                  ? `${votedOut?.name} foi votado e ${realImpostors.find((player) => player._id === votedOut?._id) ? "era" : "nao era"} o Impostor.`
                  : "Houve um empate nos votos!"}
              </p>
            </div>

            <div className="mx-auto mt-4 grid max-h-[25dvh] w-full max-w-xl grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {votes?.map((vote) => {
                const voterPlayer = players.find((player) => player._id === vote.voterId);
                const targetPlayer = players.find((player) => player._id === vote.targetId);
                if (!voterPlayer || !targetPlayer) return null;

                return (
                  <div
                    key={vote._id}
                    className="flex flex-col items-center gap-2 rounded-lg border border-white/5 bg-surface-primary/50 p-2 sm:flex-row sm:justify-center"
                  >
                    <span className="max-w-[80px] truncate text-xs text-white/70">{voterPlayer.name}</span>
                    <span className="hidden text-xs text-white/30 sm:block">→</span>
                    <span className="text-[10px] text-white/30 sm:hidden">Votou em</span>
                    <span className="max-w-[80px] truncate text-xs font-bold text-red-400">
                      {targetPlayer.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-sm flex-col gap-3">
              <ShareResult
                title={`SUS - Sala ${room.code}`}
                text={`O Impostor era: ${realImpostors.map((impostor) => impostor.name).join(", ")}!\n\n${groupWon ? "Vitoria do GRUPO!" : "Vitoria do IMPOSTOR!"}`}
                url={typeof window !== "undefined" ? `${window.location.origin}/room/${room.code}` : ""}
              />

              {isHost && (
                <Button
                  className="w-full py-6 font-bold"
                  onClick={() => void startNextRound({ roomId: round.roomId, sessionId })}
                >
                  Proxima Rodada
                </Button>
              )}
            </div>

            {!isHost && <p className="mt-8 text-center font-medium text-white/60">Aguardando o host...</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
