"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { useSessionId } from "@/lib/useSessionId";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import { motion, AnimatePresence } from "framer-motion";

interface ResultsPhaseProps {
  round: Doc<"rounds">;
  players: Doc<"players">[];
  myPlayer: Doc<"players">;
}

export function ResultsPhase({ round, players, myPlayer }: ResultsPhaseProps) {
  const isMaster = round.masterId === myPlayer._id;
  const sessionId = useSessionId();
  const [showResults, setShowResults] = useState(false);
  const startNextRound = useMutation(api.rooms.startNextRound);

  const votes = useQuery(api.votes.getVotes, { roundId: round._id });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowResults(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Let's grab the real impostor details
  const realImpostor = players.find((p) => p._id === round.impostorId);
  const votedOut = players.find((p) => p._id === round.votedOutId);
  const groupWon = !round.impostorWon;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto h-[100dvh] pt-12 pb-6 px-4">
      <AnimatePresence>
        {!showResults ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5, repeatType: "reverse", repeat: Infinity }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-24 h-24 border-8 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-2xl font-bold text-white tracking-widest uppercase">
              Calculando...
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            <h1 className={`text-4xl md:text-5xl font-display font-black tracking-tight uppercase ${
                groupWon ? "text-game-safe" : "text-game-impostor"
              } drop-shadow-[0_0_15px_currentColor]`}>
              {groupWon ? "VITORIA DO GRUPO" : "VITORIA DO IMPOSTOR"}
            </h1>

            <div className="bg-black/40 rounded-3xl p-6 flex flex-col items-center gap-6 w-full border border-white/10">
              <span className="text-white/60 text-sm font-bold uppercase tracking-widest">
                O Impostor era:
              </span>
              {realImpostor && (
                <div className="flex flex-col items-center gap-3">
                  <PlayerAvatar
                    name={realImpostor.name}
                    emoji={realImpostor.emoji}
                    avatarSeed={realImpostor.emoji}
                    size="xl"
                  />
                  <span className="text-xl font-bold text-white">{realImpostor.name}</span>
                </div>
              )}
            </div>

            <div className="w-full text-center">
              <p className="text-white/80 text-lg mb-2">
                {round.votedOutId 
                  ? `${votedOut?.name} foi votado e ${votedOut?._id === realImpostor?._id ? "era" : "NÃO era"} o Impostor.`
                  : "Houve um empate nos votos!"}
              </p>
            </div>

             {/* Votes Recap */}
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-4 max-h-[25dvh] overflow-y-auto pr-1">
                {votes?.map((vote) => {
                  const voterPlayer = players.find(p => p._id === vote.voterId);
                  const targetPlayer = players.find(p => p._id === vote.targetId);
                  if (!voterPlayer || !targetPlayer) return null;
                  return (
                    <div key={vote._id} className="bg-white/5 rounded-lg p-2 flex items-center gap-2">
                       <span className="text-xs text-white/50">{voterPlayer.name}</span>
                       <span className="text-xs text-white/30">→</span>
                       <span className="text-xs font-bold text-red-400">{targetPlayer.name}</span>
                    </div>
                  );
                })}
             </div>

             {isMaster && (
                <Button
                  className="w-full py-6 mt-8 font-bold"
                  variant="default"
                  onClick={() => sessionId && startNextRound({ roomId: round.roomId, sessionId })}
                >
                  Próxima Rodada
                </Button>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}