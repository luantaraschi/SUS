"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import ShareResult from "../ShareResult";
import { motion, AnimatePresence } from "framer-motion";

interface ResultsPhaseProps {
  round: Omit<Doc<"rounds">, "impostorId">;
  players: Doc<"players">[];
  myPlayer: Doc<"players">;
  sessionId: string;
  room: Doc<"rooms">;
}

export function ResultsPhase({ round, players, myPlayer, sessionId, room }: ResultsPhaseProps) {
  const isHost = myPlayer.isHost;
  const [showResults, setShowResults] = useState(false);
  const startNextRound = useMutation(api.rooms.startNextRound);

  const votes = useQuery(api.votes.getVotes, { roundId: round._id });
  // Usa query segura que só retorna impostorId quando round.status === "results"
  const roundResult = useQuery(api.rounds.getRoundResult, { roundId: round._id });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowResults(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const realImpostors = roundResult 
    ? players.filter((p) => roundResult.impostorIds?.includes(p._id) || p._id === roundResult.impostorId)
    : [];
  const votedOut = roundResult?.votedOutId ? players.find((p) => p._id === roundResult.votedOutId) : null;
  const groupWon = roundResult ? !roundResult.impostorWon : false;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center w-full h-[100dvh] pt-12 pb-6 px-4">
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

            <div className="bg-surface-primary rounded-3xl p-6 flex flex-col items-center gap-6 w-full max-w-xl mx-auto shadow-2xl border-2 border-white/10">
              <span className="text-white/60 text-sm font-bold uppercase tracking-widest">
                {realImpostors.length > 1 ? "Os Impostores eram:" : "O Impostor era:"}
              </span>
              <div className="flex flex-row flex-wrap justify-center gap-6">
                {realImpostors.map((imp) => (
                  <div key={imp._id} className="flex flex-col items-center gap-3">
                    <PlayerAvatar
                      name={imp.name}
                      avatarSeed={imp.emoji}
                      size="xl"
                    />
                    <span className="text-xl font-bold text-white">{imp.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full text-center">
              <p className="text-white/80 text-lg mb-2">
                {roundResult?.votedOutId 
                  ? `${votedOut?.name} foi votado e ${realImpostors.find(p => p._id === votedOut?._id) ? "era" : "NÃO era"} o Impostor.`
                  : "Houve um empate nos votos!"}
              </p>
            </div>

             {/* Votes Recap */}
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-xl mx-auto mt-4 max-h-[25dvh] overflow-y-auto pr-1">
                {votes?.map((vote) => {
                  const voterPlayer = players.find(p => p._id === vote.voterId);
                  const targetPlayer = players.find(p => p._id === vote.targetId);
                  if (!voterPlayer || !targetPlayer) return null;
                  return (
                    <div key={vote._id} className="bg-surface-primary/50 rounded-lg p-2 gap-2 flex flex-col sm:flex-row items-center sm:justify-center border border-white/5">
                       <span className="text-xs text-white/70 truncate max-w-[80px]">{voterPlayer.name}</span>
                       <span className="text-xs text-white/30 hidden sm:block">→</span>
                       <span className="text-[10px] text-white/30 sm:hidden">Votou em</span>
                       <span className="text-xs font-bold text-red-400 truncate max-w-[80px]">{targetPlayer.name}</span>
                    </div>
                  );
                })}
             </div>

              <div className="w-full max-w-sm mx-auto flex flex-col gap-3 mt-4">
                <ShareResult
                  title={`SUS - Sala ${room.code}`}
                  text={`O Impostor era: ${realImpostors.map(imp => imp.name).join(", ")}!\n\n${groupWon ? "Vitória do GRUPO! 🕵️" : "Vitória do IMPOSTOR! 🤡"}`}
                  url={typeof window !== "undefined" ? `${window.location.origin}/room/${room.code}` : ""}
                />
             
               {isHost && (
                  <Button
                    className="w-full py-6 font-bold"
                    variant="default"
                    onClick={() => sessionId && startNextRound({ roomId: round.roomId, sessionId })}
                  >
                    Próxima Rodada
                  </Button>
               )}
              </div>

              {!isHost && (
                <p className="mt-8 text-white/60 text-center font-medium">Aguardando o host...</p>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}