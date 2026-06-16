"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PhaseIndicator from "../PhaseIndicator";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";
import { useSound } from "@/lib/useSound";
import { GlassPanel } from "../ui/glass";
import { ResultsDisplay } from "./results/ResultsDisplay";
import { Leaderboard } from "./results/Leaderboard";
import { ShareSection } from "./results/ShareSection";

interface ResultsPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  sessionId: string;
  room: Doc<"rooms">;
  onBackToLobby: () => Promise<void>;
  isReturningToLobby: boolean;
}

function isMasterQuestionMode(room: { mode: string; questionMode?: string }) {
  return room.mode === "question" && (room.questionMode ?? "system") === "master";
}

export function ResultsPhase({
  round,
  players,
  myPlayer,
  sessionId,
  room,
  onBackToLobby,
  isReturningToLobby,
}: ResultsPhaseProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const isHost = myPlayer.isHost;
  const isSpectator = myPlayer.isSpectator ?? false;
  const isMasterMode = isMasterQuestionMode(room);
  const { play: playSound } = useSound();

  const [showResults, setShowResults] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);

  const startNextRound = useMutation(api.rooms.startNextRound);
  const requestNextRound = useMutation(api.rounds.requestNextRound);
  const recomputeResults = useMutation(api.rounds.recomputeResults);
  const updateMasterForNextRound = useMutation(api.rooms.updateMasterForNextRound);

  const votes = useQuery(api.votes.getVotes, { roundId: round._id });
  const roundResult = useQuery(api.rounds.getRoundResult, { roundId: round._id });

  // Brief loading→results beat for the reveal payoff.
  useEffect(() => {
    const timer = window.setTimeout(() => setShowResults(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  // Recompute when the result hasn't settled yet.
  useEffect(() => {
    if (roundResult !== null) return;
    void recomputeResults({ roundId: round._id, sessionId });
  }, [recomputeResults, round._id, roundResult, sessionId]);

  // Wired reveal sounds — win/lose, fired once the results swap in.
  useEffect(() => {
    if (!showResults || !roundResult) return;
    playSound(roundResult.impostorWon ? "result.lose" : "result.win");
  }, [showResults, roundResult, playSound]);

  // Offer a manual retry if the result stays unresolved.
  useEffect(() => {
    if (roundResult) return;
    const timer = window.setTimeout(() => setShowRetry(true), 8000);
    return () => window.clearTimeout(timer);
  }, [roundResult]);

  // Still computing the result — calculating panel with retry fallback.
  if (roundResult === undefined || roundResult === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 py-10">
        <GlassPanel tone="info" className="w-full max-w-xl rounded-[var(--r-2xl)] px-6 py-8 text-center">
          <div className="relative z-10">
            <div className="mx-auto h-20 w-20 animate-spin rounded-full border-[6px] border-[var(--w-16)] border-t-[var(--color-info)]" />
            <p className="mt-5 font-condensed text-xs uppercase tracking-[0.34em] text-[var(--text-dim)]">
              Fechando a rodada
            </p>
            <h2 className="mt-3 font-display text-3xl text-[var(--color-text)] sm:text-4xl">
              Calculando resultado
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              Consolidando votos, impostores e placar final desta rodada.
            </p>

            {showRetry && (
              <Button
                onClick={() => void recomputeResults({ roundId: round._id, sessionId })}
                className="mt-6 h-[50px] rounded-[var(--r-md)] border border-[var(--glass-border)] bg-[var(--glass-2)] px-6 text-sm font-semibold text-[var(--color-text)] transition-[background-color] duration-[var(--t-quick)] hover:bg-[var(--w-16)]"
              >
                Tentar novamente
              </Button>
            )}
          </div>
        </GlassPanel>
      </div>
    );
  }

  // --- Result computation (preserved) ---
  const realImpostors = players.filter((player) => roundResult.impostorIds?.includes(player._id));
  const impostorIds = (roundResult.impostorIds ?? []).map((id) => String(id));
  const votedOut = roundResult.votedOutId
    ? players.find((player) => player._id === roundResult.votedOutId) ?? null
    : null;
  const groupWon = !roundResult.impostorWon;

  const outcomeSummary = !roundResult.votedOutId
    ? "Houve empate nos votos. Sem eliminacao, o SUS escapou da rodada."
    : `${votedOut?.name ?? "Alguem"} foi votado e ${
        realImpostors.some((player) => player._id === votedOut?._id) ? "era" : "nao era"
      } o impostor.`;

  // Share payload (passed to the shared ShareResult via ShareSection).
  const impostorNames = realImpostors.map((player) => player.name).filter(Boolean).join(", ");
  const share = {
    title: `SUS - Sala ${room.code}`,
    text: `${impostorNames ? `O impostor era: ${impostorNames}. ` : ""}${
      roundResult.impostorWon ? "Vitoria do IMPOSTOR!" : "Vitoria do GRUPO!"
    }`,
    url: typeof window !== "undefined" ? `${window.location.origin}/room/${room.code}` : "",
  };

  // Next-round / lobby handlers — keep the wired round.next sound.
  const handleStartNextRoundHost = async () => {
    if (selectedMasterId) {
      await updateMasterForNextRound({
        roomId: round.roomId,
        sessionId,
        customMasterId: selectedMasterId,
      });
    }
    playSound("round.next");
    await startNextRound({ roomId: round.roomId, sessionId });
  };

  const handleRequestNextRound = () => {
    playSound("round.next");
    void requestNextRound({
      roundId: round._id,
      playerId: myPlayer._id,
      sessionId,
    });
  };

  const handleStartNextRoundDefault = () => {
    playSound("round.next");
    void startNextRound({ roomId: round.roomId, sessionId });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-8 sm:py-10">
      <AnimatePresence mode="wait" initial={false}>
        {!showResults ? (
          <motion.div
            key="loading"
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 1.04, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-[60dvh] items-center justify-center"
          >
            <GlassPanel
              tone="special"
              className="w-full max-w-xl rounded-[var(--r-2xl)] px-6 py-8 text-center"
            >
              <div className="relative z-10">
                <div className="mx-auto h-20 w-20 animate-spin rounded-full border-[6px] border-[var(--w-16)] border-t-[var(--color-special)]" />
                <p className="mt-5 font-condensed text-xs uppercase tracking-[0.34em] text-[var(--text-dim)]">
                  Resultado sincronizado
                </p>
                <h2 className="mt-3 font-display text-3xl text-[var(--color-text)] sm:text-4xl">
                  Revelando a rodada
                </h2>
              </div>
            </GlassPanel>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <PhaseIndicator
              currentPhase="results"
              mode={round.mode}
              questionMode={room.questionMode}
            />

            <div className="mt-6 flex flex-col gap-6">
              <ResultsDisplay
                round={round}
                players={players}
                realImpostors={realImpostors}
                votedOut={votedOut}
                groupWon={groupWon}
                outcomeSummary={outcomeSummary}
                votes={votes}
              />

              <Leaderboard
                players={players}
                myPlayerId={String(myPlayer._id)}
                impostorIds={impostorIds}
              />

              <ShareSection
                round={round}
                players={players}
                myPlayer={myPlayer}
                room={room}
                isMasterMode={isMasterMode}
                isHost={isHost}
                isSpectator={isSpectator}
                isReturningToLobby={isReturningToLobby}
                selectedMasterId={selectedMasterId}
                onSelectMaster={setSelectedMasterId}
                share={share}
                onStartNextRoundHost={() => void handleStartNextRoundHost()}
                onRequestNextRound={handleRequestNextRound}
                onStartNextRoundDefault={handleStartNextRoundDefault}
                onBackToLobby={() => void onBackToLobby()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
