import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";

interface AnsweringPhaseProps {
  round: any;
  myPlayer: any;
  myRole?: any;
  players: any[];
  room: any;
  sessionId: string;
}

export function AnsweringPhase({ round, myPlayer, myRole, players, room, sessionId }: AnsweringPhaseProps) {
  const [answer, setAnswer] = useState("");
  const submitAnswer = useMutation(api.answers.submitAnswer);
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });

  const hasAnswered = answers?.some((a) => a.playerId === myPlayer._id);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    submitAnswer({
      roundId: round._id,
      playerId: myPlayer._id,
      sessionId,
      answer: answer.trim(),
    });
  };

  if (hasAnswered || myPlayer.role === "master") {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <h2 className="font-display text-2xl text-white mb-6 text-center">Aguardando todos responderem...</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {players.filter(p => !p.isBot && p.role !== "master").map(p => {
            const answered = answers?.some(a => a.playerId === p._id);
            return (
              <div key={p._id} className="relative flex flex-col items-center text-center">
                <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-primary/10 border ${answered ? "border-game-safe/50" : "border-surface-primary/20"}`}>
                  <PlayerAvatar name={p.name} avatarSeed={p.emoji} size="sm" hideName />
                  {answered ? (
                    <div className="absolute -bottom-2 -right-2 bg-game-safe text-black rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-md">
                      ✓
                    </div>
                  ) : (
                    <div className="absolute -top-2 -right-2 text-white/50 animate-pulse text-lg">
                      ⏳
                    </div>
                  )}
                </div>
                <p className="mt-2 text-white/70 font-condensed text-sm truncate w-16 flex justify-center items-center gap-1">
                  {p.name}
                  {myPlayer.role === "master" && myRole?.masterImpostorIds?.includes(p._id) && (
                     <span className="text-game-impostor text-xs" title="Impostor">🤡</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center p-4">
      <div className="flex flex-col items-center mb-6">
        <PlayerAvatar name={myPlayer.name} avatarSeed={myPlayer.emoji} size="md" />
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-2xl w-full flex flex-col items-center text-center border-b-4 border-surface-primary/20">
        <h3 className="font-display text-xl font-black text-gray-800 mb-4 text-center">
          {room.mode === "question" && myPlayer.role === "impostor" ? round.questionImpostor : round.questionMain}
        </h3>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Digite sua resposta..."
          className="rounded-2xl border-2 border-surface-primary/20 focus:border-surface-primary focus:outline-none p-4 resize-none min-h-[120px] w-full text-black font-body text-lg mb-6"
        />

        <Button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className="w-full text-lg h-14"
        >
          Enviar resposta
        </Button>
      </div>
    </div>
  );
}
