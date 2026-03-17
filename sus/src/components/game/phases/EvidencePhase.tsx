"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import { motion, AnimatePresence } from "framer-motion";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import { getCenteredOddGridItemClass } from "@/lib/utils";

interface EvidencePhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  room: Doc<"rooms">;
  sessionId: string;
}

export function EvidencePhase({
  round,
  players,
  myPlayer,
  myRole,
  room,
  sessionId,
}: EvidencePhaseProps) {
  const [showQuestion, setShowQuestion] = useState(false);
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });
  const requestAdvance = useMutation(api.rounds.requestAdvanceToVoting);

  const isMaster = round.masterId === myPlayer._id;
  const isHost = myPlayer.isHost;
  const isSpectator = myPlayer.isSpectator;

  const activePlayers = players.filter(
    (p) => p.status !== "disconnected" && !p.isSpectator && !p.isBot && p._id !== round.masterId
  );
  const readyCount = round.evidenceReadyBy?.length ?? 0;
  const majority = Math.ceil(activePlayers.length / 2);
  const hasVoted = round.evidenceReadyBy?.includes(myPlayer._id) ?? false;

  // 2-3 seconds after mount, reveal the normal question
  useEffect(() => {
    const timer = window.setTimeout(() => setShowQuestion(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const handleRequestVoting = () => {
    void requestAdvance({
      roundId: round._id,
      playerId: myPlayer._id,
      sessionId,
    });
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col items-center px-4 py-8">
      <PhaseIndicator currentPhase="evidence" mode={round.mode} questionMode={room.questionMode} className="mb-6" />

      {/* Question reveal (appears after 2-3s) */}
      <AnimatePresence>
        {showQuestion && round.questionMain && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-6 w-full rounded-[32px] border border-white/10 bg-black/20 px-5 py-4 text-center backdrop-blur-md"
          >
            <p className="font-condensed text-xs uppercase tracking-[0.3em] text-white/60">
              Pergunta da rodada
            </p>
            <h2 className="mt-2 font-display text-2xl text-white md:text-3xl">
              {round.questionMain}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {!showQuestion && (
        <div className="mb-6 w-full rounded-[32px] border border-white/10 bg-black/20 px-5 py-4 text-center backdrop-blur-md">
          <h2 className="font-display text-2xl text-white">Quadro de Evidencias</h2>
          <p className="mt-2 font-body text-white/75">
            Analisem as respostas de todos...
          </p>
        </div>
      )}

      {/* Answer cards grid */}
      <div className="mt-2 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
        {answers?.map((answer, index) => {
          const player = players.find((p) => p._id === answer.playerId);
          if (!player) return null;

          const isMarkedByMaster =
            myRole?.role === "master" && myRole.masterImpostorIds?.includes(player._id);

          return (
            <ReactionAnchor
              key={answer._id}
              playerId={String(player._id)}
              className={getCenteredOddGridItemClass(index, answers?.length ?? 0, "md")}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="rounded-[28px] border border-white/10 bg-[var(--panel-surface)] p-5 text-center text-[var(--panel-text)] shadow-lg"
              >
                <div className="mb-3 flex flex-col items-center">
                  <PlayerAvatar
                    name={player.name}
                    avatarSeed={player.emoji}
                    imageUrl={player.avatarImageUrl}
                    size="sm"
                    hideName
                  />
                  <span className="mt-1.5 flex items-center gap-1 font-hand text-sm text-[var(--panel-soft-text)]">
                    [{player.name}]
                    {isMarkedByMaster && (
                      <span className="ml-1 text-xs font-bold uppercase text-game-impostor" title="Impostor">
                        ?
                      </span>
                    )}
                  </span>
                </div>
                <p className="w-full break-words font-body text-xl font-medium">
                  &quot;{answer.text}&quot;
                </p>
              </motion.div>
            </ReactionAnchor>
          );
        })}
      </div>

      {/* Voting request / advance buttons */}
      {showQuestion && (
        <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3">
          {!isMaster && !isSpectator && (
            <Button
              className="w-full py-6 text-lg font-bold"
              disabled={hasVoted}
              onClick={handleRequestVoting}
              variant={hasVoted ? "secondary" : "default"}
            >
              {hasVoted
                ? `Aguardando... (${readyCount}/${majority} votos)`
                : `Ir para Votacao (${readyCount}/${majority})`}
            </Button>
          )}

          {isHost && !hasVoted && (
            <Button
              className="w-full py-4"
              variant="secondary"
              onClick={handleRequestVoting}
            >
              Forcar Votacao (Host)
            </Button>
          )}

          {(isMaster || isSpectator) && (
            <p className="text-center font-body text-white/60">
              {isMaster
                ? "O mestre observa esta rodada."
                : "Voce esta como espectador."}
            </p>
          )}

          <p className="text-center font-condensed text-sm uppercase tracking-[0.24em] text-white/50">
            {readyCount}/{majority} votos para avancar
          </p>
        </div>
      )}
    </div>
  );
}
