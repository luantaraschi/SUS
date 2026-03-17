import { useCallback, useEffect, useRef, useState } from "react";
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

function isMasterQuestionMode(room: { mode: string; questionMode?: string }) {
  return room.mode === "question" && (room.questionMode ?? "system") === "master";
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  );
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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitAnswer = useMutation(api.answers.submitAnswer);
  const setTyping = useMutation(api.typing.setTyping);
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });
  const typingPlayerIds = useQuery(api.typing.getTypingPlayers, { roomId: round.roomId });

  const hasAnswered = answers?.some((currentAnswer) => currentAnswer.playerId === myPlayer._id);
  const isMaster = myPlayer.role === "master";

  const signalTyping = useCallback(
    (isTyping: boolean) => {
      void setTyping({
        roomId: round.roomId,
        playerId: myPlayer._id,
        sessionId,
        isTyping,
      });
    },
    [myPlayer._id, round.roomId, sessionId, setTyping]
  );

  const handleAnswerChange = useCallback(
    (value: string) => {
      setAnswer(value);
      signalTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        signalTyping(false);
      }, 2000);
    },
    [signalTyping]
  );

  // Clean up typing state on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    signalTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
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
              const isPlayerTyping =
                !answered && typingPlayerIds?.includes(player._id);
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
                    ) : isPlayerTyping ? (
                      <div className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-game-info text-sm shadow-md">
                        <TypingDots />
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
          {isMasterQuestionMode(room)
            ? myRole?.secretContent
            : (room.mode === "question" && myPlayer.role === "impostor"
              ? round.questionImpostor
              : round.questionMain)}
        </h3>

        <textarea
          value={answer}
          onChange={(event) => handleAnswerChange(event.target.value)}
          placeholder="Digite sua resposta..."
          className="mb-6 min-h-[120px] w-full resize-none rounded-2xl border-2 border-surface-primary/20 p-4 font-body text-lg text-black outline-none focus:border-surface-primary"
        />

        <Button onClick={handleSubmit} disabled={!answer.trim()} className="h-14 w-full text-lg">
          {isMasterQuestionMode(room) ? "Pronto" : "Enviar resposta"}
        </Button>
      </div>
    </div>
  );
}
