import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";

interface AnsweringPhaseProps {
  round: SafeRound;
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  players: PublicPlayer[];
  room: Doc<"rooms">;
  sessionId: string;
}

export function AnsweringPhase({
  round,
  myPlayer,
  myRole,
  players,
  room,
  sessionId,
}: AnsweringPhaseProps) {
  const [answer, setAnswer] = useState("");
  const submitAnswer = useMutation(api.answers.submitAnswer);
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });

  const hasAnswered = answers?.some((currentAnswer) => currentAnswer.playerId === myPlayer._id);
  const isMaster = myPlayer.role === "master";

  const handleSubmit = () => {
    if (!answer.trim()) return;
    void submitAnswer({
      roundId: round._id,
      playerId: myPlayer._id,
      sessionId,
      answer: answer.trim(),
    });
  };

  if (hasAnswered || isMaster) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <h2 className="mb-6 text-center font-display text-2xl text-white">
          Aguardando todos responderem...
        </h2>
        <div className="grid grid-cols-3 gap-4 md:grid-cols-4">
          {players
            .filter((player) => !player.isBot && player._id !== (round.masterId ?? undefined))
            .map((player) => {
              const answered = answers?.some((currentAnswer) => currentAnswer.playerId === player._id);
              const isMarkedByMaster =
                myRole?.role === "master" && myRole.masterImpostorIds?.includes(player._id);
              return (
                <div key={player._id} className="relative flex flex-col items-center text-center">
                  <div
                    className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border bg-surface-primary/10 ${
                      answered ? "border-game-safe/50" : "border-surface-primary/20"
                    }`}
                  >
                    <PlayerAvatar
                      name={player.name}
                      avatarSeed={player.emoji}
                      imageUrl={player.avatarImageUrl}
                      size="sm"
                      hideName
                    />
                    {answered ? (
                      <div className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-game-safe text-sm text-black shadow-md">
                        ✓
                      </div>
                    ) : (
                      <div className="absolute -right-2 -top-2 text-lg text-white/50 animate-pulse">
                        ⏳
                      </div>
                    )}
                  </div>
                  <p className="mt-2 flex w-16 items-center justify-center gap-1 truncate font-condensed text-sm text-white/70">
                    {player.name}
                    {isMarkedByMaster && (
                      <span className="text-xs text-game-impostor" title="Impostor">
                        🤡
                      </span>
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
    <div className="mx-auto flex w-full max-w-md flex-col items-center p-4">
      <div className="mb-6 flex flex-col items-center">
        <PlayerAvatar
          name={myPlayer.name}
          avatarSeed={myPlayer.emoji}
          imageUrl={myPlayer.avatarImageUrl}
          size="md"
        />
      </div>

      <div className="flex w-full flex-col items-center rounded-3xl border-b-4 border-surface-primary/20 bg-white p-6 text-center shadow-2xl">
        <h3 className="mb-4 text-center font-display text-xl font-black text-gray-800">
          {room.mode === "question" && myPlayer.role === "impostor"
            ? round.questionImpostor
            : round.questionMain}
        </h3>

        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Digite sua resposta..."
          className="mb-6 min-h-[120px] w-full resize-none rounded-2xl border-2 border-surface-primary/20 p-4 font-body text-lg text-black outline-none focus:border-surface-primary"
        />

        <Button onClick={handleSubmit} disabled={!answer.trim()} className="h-14 w-full text-lg">
          Enviar resposta
        </Button>
      </div>
    </div>
  );
}
