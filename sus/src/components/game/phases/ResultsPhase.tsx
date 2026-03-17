"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import ShareResult from "../ShareResult";
import { AnimatePresence, motion } from "framer-motion";
import PhaseIndicator from "../PhaseIndicator";
import { useRouter } from "next/navigation";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";

interface ResultsPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  sessionId: string;
  room: Doc<"rooms">;
}

function isMasterQuestionMode(room: { mode: string; questionMode?: string }) {
  return room.mode === "question" && (room.questionMode ?? "system") === "master";
}

export function ResultsPhase({ round, players, myPlayer, sessionId, room }: ResultsPhaseProps) {
  const router = useRouter();
  const isHost = myPlayer.isHost;
  const isSpectator = myPlayer.isSpectator;
  const isMasterMode = isMasterQuestionMode(room);
  const [showResults, setShowResults] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const startNextRound = useMutation(api.rooms.startNextRound);
  const requestNextRound = useMutation(api.rounds.requestNextRound);
  const recomputeResults = useMutation(api.rounds.recomputeResults);

  const votes = useQuery(api.votes.getVotes, { roundId: round._id });
  const roundResult = useQuery(api.rounds.getRoundResult, { roundId: round._id });

  useEffect(() => {
    const timer = window.setTimeout(() => setShowResults(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (roundResult !== null) return;
    void recomputeResults({ roundId: round._id, sessionId });
  }, [recomputeResults, round._id, roundResult, sessionId]);

  useEffect(() => {
    if (roundResult) return;
    const timer = window.setTimeout(() => setShowRetry(true), 8000);
    return () => window.clearTimeout(timer);
  }, [roundResult]);

  if (roundResult === undefined || roundResult === null) {
    return (
      <div className="fixed inset-0 z-40 flex h-dvh w-full flex-col items-center justify-center bg-black/80 px-4 pb-6 pt-12 backdrop-blur-md">
        <div className="h-24 w-24 animate-spin rounded-full border-8 border-white/20 border-t-white" />
        <p className="mt-6 text-2xl font-bold uppercase tracking-widest text-white">Calculando...</p>
        {showRetry && (
          <button
            onClick={() => void recomputeResults({ roundId: round._id, sessionId })}
            className="mt-6 rounded-full border border-white/20 bg-white/10 px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-white/20"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  const realImpostors = players.filter((player) => roundResult.impostorIds?.includes(player._id));
  const votedOut = roundResult.votedOutId
    ? players.find((player) => player._id === roundResult.votedOutId) ?? null
    : null;
  const groupWon = !roundResult.impostorWon;

  return (
    <div className="fixed inset-0 z-40 flex h-[100dvh] w-full flex-col items-center justify-center bg-black/80 px-4 pb-6 pt-12 backdrop-blur-md">
      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key="loading"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0, transition: { duration: 0.3 } }}
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
            className="flex w-full max-w-5xl flex-col items-center gap-8"
          >
            <PhaseIndicator currentPhase="results" mode={round.mode} questionMode={room.questionMode} />
            <h1
              className={`text-center font-display text-4xl font-black uppercase tracking-tight drop-shadow-[0_0_15px_currentColor] md:text-5xl ${
                groupWon ? "text-game-safe" : "text-game-impostor"
              }`}
            >
              {groupWon ? "Vitoria do grupo" : "Vitoria do impostor"}
            </h1>

            <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl border-2 border-white/10 bg-surface-primary p-6 shadow-2xl">
              <span className="text-sm font-bold uppercase tracking-widest text-white/60">
                {realImpostors.length > 1 ? "Os impostores eram:" : "O impostor era:"}
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
                {roundResult.votedOutId
                  ? `${votedOut?.name} foi votado e ${realImpostors.find((player) => player._id === votedOut?._id) ? "era" : "nao era"} o impostor.`
                  : "Houve um empate nos votos."}
              </p>
              {isMasterMode && round.questionMain && (
                <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-game-safe/30 bg-game-safe/10 p-4">
                  <p className="font-condensed text-xs uppercase tracking-wider text-game-safe/70">Pergunta Normal</p>
                  <p className="mt-1 font-body text-base text-white">&quot;{round.questionMain}&quot;</p>
                </div>
              )}
              {isMasterMode && round.questionImpostor && (
                <div className="mx-auto mt-3 max-w-xl rounded-2xl border border-game-impostor/30 bg-game-impostor/10 p-4">
                  <p className="font-condensed text-xs uppercase tracking-wider text-game-impostor/70">Pergunta do SUS</p>
                  <p className="mt-1 font-body text-base text-white">&quot;{round.questionImpostor}&quot;</p>
                </div>
              )}
              {!isMasterMode && round.mode === "question" && round.questionMain && round.questionImpostor && (
                <p className="mx-auto mt-3 max-w-3xl font-body text-sm text-white/65 sm:text-base">
                  Pergunta normal: &quot;{round.questionMain}&quot; | Pergunta do impostor: &quot;{round.questionImpostor}&quot;
                </p>
              )}
              {round.mode === "word" && round.word && (
                <p className="mx-auto mt-3 max-w-3xl font-body text-sm text-white/65 sm:text-base">
                  Palavra da rodada: &quot;{round.word}&quot;
                </p>
              )}
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
                    <span className="hidden text-xs text-white/30 sm:block">-&gt;</span>
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
                text={`O impostor era: ${realImpostors.map((impostor) => impostor.name).join(", ")}!\n\n${groupWon ? "Vitoria do GRUPO!" : "Vitoria do IMPOSTOR!"}`}
                url={typeof window !== "undefined" ? `${window.location.origin}/room/${room.code}` : ""}
              />

              {isMasterMode && !isSpectator ? (
                <>
                  {isHost ? (
                    <Button
                      className="w-full py-6 font-bold"
                      onClick={() => void startNextRound({ roomId: round.roomId, sessionId })}
                    >
                      Proxima rodada (Host)
                    </Button>
                  ) : (
                    <Button
                      className="w-full py-6 font-bold"
                      disabled={round.nextRoundReadyBy?.includes(myPlayer._id) ?? false}
                      onClick={() => void requestNextRound({ roundId: round._id, playerId: myPlayer._id, sessionId })}
                    >
                      {round.nextRoundReadyBy?.includes(myPlayer._id)
                        ? `Aguardando... (${round.nextRoundReadyBy?.length ?? 0} votos)`
                        : `Proxima rodada (${round.nextRoundReadyBy?.length ?? 0} votos)`}
                    </Button>
                  )}
                </>
              ) : !isSpectator && isHost ? (
                <Button
                  className="w-full py-6 font-bold"
                  onClick={() => void startNextRound({ roomId: round.roomId, sessionId })}
                >
                  Proxima rodada
                </Button>
              ) : null}

              <button
                onClick={() => router.push(`/room/${room.code}`)}
                className="w-full rounded-xl border border-white/20 bg-white/10 py-4 font-bold text-white transition-all hover:bg-white/20"
              >
                Voltar ao Lobby
              </button>
            </div>

            {!isMasterMode && !isHost && <p className="mt-8 text-center font-medium text-white/60">Aguardando o host...</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
