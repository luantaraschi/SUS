"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import { motion } from "framer-motion";

interface VotingPhaseProps {
  round: Omit<Doc<"rounds">, "impostorId">;
  players: Doc<"players">[];
  myPlayer: Doc<"players">;
  sessionId: string;
  room: Doc<"rooms">;
}

export function VotingPhase({ round, players, myPlayer, sessionId, room }: VotingPhaseProps) {
  const isMaster = round.masterId === myPlayer._id;
  const me = myPlayer;
  const [selectedSuspect, setSelectedSuspect] = useState<Id<"players"> | null>(null);
  
  const submitVote = useMutation(api.votes.submitVote);
  const votes = useQuery(api.votes.getVotes, { roundId: round._id });

  const activePlayers = players.filter(p => p.status !== "disconnected" && p._id !== round.masterId);
  const totalVoters = activePlayers.length;
  const myVote = votes?.find(v => v.voterId === me?._id);
  const hasVoted = !!myVote;

  const handleVote = async () => {
    if (!me || !sessionId || !selectedSuspect || hasVoted) return;
    
    await submitVote({
      roundId: round._id,
      voterId: me._id,
      sessionId,
      suspectId: selectedSuspect,
    });
  };

  useEffect(() => {
    if (!isMaster || !votes) return;

    // Master coordinates bot votes
    const bots = activePlayers.filter(p => p.isBot);
    
    bots.forEach(bot => {
      const botVoted = votes.some(v => v.voterId === bot._id);
      if (!botVoted) {
        // Random timeout for bot voting (2000-5000ms)
        const delay = Math.floor(Math.random() * 3000) + 2000;
        
        setTimeout(() => {
          // Select a random active player to vote for (mostly random, maybe avoid self)
          const others = activePlayers.filter(p => p._id !== bot._id);
          if (others.length > 0) {
            const target = others[Math.floor(Math.random() * others.length)];
            submitVote({
              roundId: round._id,
              voterId: bot._id,
              sessionId: bot.sessionId || "bot-session",
              suspectId: target._id,
            }).catch(() => {
               // ignore errors silently for bots since it might have already voted or timeout issue
            });
          }
        }, delay);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMaster, votes?.length]); // trigger when votes array length changes or initial load

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto h-[100dvh] pt-12 pb-6 px-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-display text-white mb-2">Hora de Votar</h2>
        <p className="text-white/60">Quem é o Impostor?</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full flex-1 content-start">
        {activePlayers.map((player) => {
          const isSelected = selectedSuspect === player._id;
          const isMe = me?._id === player._id;
          
          return (
            <motion.button
              key={player._id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !hasVoted && !isMe && !isMaster && setSelectedSuspect(player._id)}
              disabled={hasVoted || isMe || isMaster}
              className={`relative p-4 rounded-2xl flex flex-col items-center gap-3 transition-colors ${
                isSelected 
                  ? "bg-red-500/20 border-2 border-red-500" 
                  : "bg-white/5 border-2 border-transparent hover:bg-white/10"
              } ${(hasVoted || isMe || isMaster) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <PlayerAvatar name={player.name} avatarSeed={player.emoji} size="lg" />
              <span className="text-white font-medium">{player.name}</span>
            </motion.button>
          );
        })}
      </div>

      {!isMaster && !hasVoted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
          <Button
            className="w-full py-6 text-lg font-bold"
            disabled={!selectedSuspect}
            onClick={handleVote}
            variant={selectedSuspect ? "destructive" : "secondary"}
          >
            Confirmar Voto
          </Button>
        </div>
      )}

      {(hasVoted || isMaster) && (
        <div className="fixed bottom-0 left-0 right-0 p-8 text-center bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-white/80 font-medium">
            Aguardando votos... ({votes?.length || 0}/{totalVoters})
          </p>
        </div>
      )}
    </div>
  );
}
