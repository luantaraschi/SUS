"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PlayerAvatar from "../PlayerAvatar";
import { AnimatePresence, motion } from "framer-motion";
import PhaseIndicator from "../PhaseIndicator";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";
import { useSound } from "@/lib/useSound";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import GlassSelect from "../ui/GlassSelect";
import { GlassPanel, GlassSection } from "../ui/glass";
import {
  ArrowRight,
  Check,
  Copy,
  Crown,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Vote,
} from "lucide-react";

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
  const isHost = myPlayer.isHost;
  const isSpectator = myPlayer.isSpectator;
  const isMasterMode = isMasterQuestionMode(room);
  const { play: playSound } = useSound();
  const [showResults, setShowResults] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const startNextRound = useMutation(api.rooms.startNextRound);
  const requestNextRound = useMutation(api.rounds.requestNextRound);
  const recomputeResults = useMutation(api.rounds.recomputeResults);
  const updateMasterForNextRound = useMutation(api.rooms.updateMasterForNextRound);

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
    if (!showResults || !roundResult) return;
    playSound(roundResult.impostorWon ? "lose" : "win");
  }, [showResults, roundResult, playSound]);

  useEffect(() => {
    if (roundResult) return;
    const timer = window.setTimeout(() => setShowRetry(true), 8000);
    return () => window.clearTimeout(timer);
  }, [roundResult]);

  const handleShareResult = async () => {
    const impostorNames = roundResult?.impostorIds
      ?.map((impostorId) => players.find((player) => player._id === impostorId)?.name)
      .filter(Boolean)
      .join(", ");
    const shareTitle = `SUS - Sala ${room.code}`;
    const shareText = `${impostorNames ? `O impostor era: ${impostorNames}. ` : ""}${roundResult?.impostorWon ? "Vitoria do IMPOSTOR!" : "Vitoria do GRUPO!"}`;
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}/room/${room.code}` : "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n\nJogue aqui: ${shareUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (roundResult === undefined || roundResult === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 py-10">
        <GlassPanel tone="info" className="w-full max-w-xl rounded-[34px] px-6 py-8 text-center">
          <div className="relative z-10">
            <div className="mx-auto h-20 w-20 animate-spin rounded-full border-[6px] border-white/15 border-t-white" />
            <p className="mt-5 font-condensed text-xs uppercase tracking-[0.34em] text-white/54">
              Fechando a rodada
            </p>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
              Calculando resultado
            </h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-white/72 sm:text-base">
              Consolidando votos, impostores e placar final desta rodada.
            </p>

            {showRetry && (
              <Button
                onClick={() => void recomputeResults({ roundId: round._id, sessionId })}
                className="mt-6 h-[50px] rounded-[20px] border border-white/12 bg-white/12 px-6 text-sm font-semibold text-white hover:bg-white/18"
              >
                Tentar novamente
              </Button>
            )}
          </div>
        </GlassPanel>
      </div>
    );
  }

  const realImpostors = players.filter((player) => roundResult.impostorIds?.includes(player._id));
  const votedOut = roundResult.votedOutId
    ? players.find((player) => player._id === roundResult.votedOutId) ?? null
    : null;
  const groupWon = !roundResult.impostorWon;
  const resultTone = groupWon ? "safe" : "impostor";
  const nextMasterOptions = players
    .filter((player) => player.status !== "disconnected")
    .map((player) => ({
      value: String(player._id),
      label: `${player.name}${player.isHost ? " (Host)" : ""}`,
    }));

  const outcomeSummary = !roundResult.votedOutId
    ? "Houve empate nos votos. Sem eliminacao, o SUS escapou da rodada."
    : `${votedOut?.name ?? "Alguem"} foi votado e ${realImpostors.some((player) => player._id === votedOut?._id) ? "era" : "nao era"} o impostor.`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-8 sm:py-10">
      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key="loading"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.04, opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="flex min-h-[60dvh] items-center justify-center"
          >
            <GlassPanel tone="special" className="w-full max-w-xl rounded-[36px] px-6 py-8 text-center">
              <div className="relative z-10">
                <div className="mx-auto h-20 w-20 animate-spin rounded-full border-[6px] border-white/15 border-t-white" />
                <p className="mt-5 font-condensed text-xs uppercase tracking-[0.34em] text-white/56">
                  Resultado sincronizado
                </p>
                <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
                  Revelando a rodada
                </h2>
              </div>
            </GlassPanel>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <PhaseIndicator currentPhase="results" mode={round.mode} questionMode={room.questionMode} />

            <GlassPanel tone={resultTone} className="mt-6 rounded-[38px] px-6 py-7 sm:px-8 sm:py-8">
              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.28em] text-white/60">
                    {groupWon ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                    Resultado oficial
                  </div>
                  <h1
                    className={cn(
                      "mt-4 font-display text-[clamp(2.7rem,7vw,5.2rem)] leading-none text-white",
                      groupWon
                        ? "drop-shadow-[0_0_28px_rgba(77,219,168,0.28)]"
                        : "drop-shadow-[0_0_28px_rgba(255,87,123,0.28)]"
                    )}
                  >
                    {groupWon ? "Vitoria do grupo" : "Vitoria do impostor"}
                  </h1>
                  <p className="mt-4 max-w-2xl font-body text-base leading-relaxed text-white/74 sm:text-lg">
                    {outcomeSummary}
                  </p>
                </div>

                <GlassSection className="rounded-[26px] px-4 py-4 lg:min-w-[260px]">
                  <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/54">
                    Leitura final
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-white/42">
                        Eliminado
                      </span>
                      <span className="max-w-[140px] truncate font-body text-sm text-white/88">
                        {votedOut?.name ?? "Empate"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-white/42">
                        Impostores
                      </span>
                      <span className="max-w-[140px] truncate text-right font-body text-sm text-white/88">
                        {realImpostors.map((player) => player.name).join(", ")}
                      </span>
                    </div>
                  </div>
                </GlassSection>
              </div>
            </GlassPanel>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <GlassPanel tone="special" className="rounded-[34px] px-5 py-6 sm:px-6">
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/56">
                        {realImpostors.length > 1 ? "Identidades reveladas" : "Identidade revelada"}
                      </p>
                      <h2 className="mt-2 font-display text-2xl text-white sm:text-3xl">
                        {realImpostors.length > 1 ? "Os impostores eram" : "O impostor era"}
                      </h2>
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.22em] text-white/60">
                      SUS
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {realImpostors.map((impostor) => (
                      <ReactionAnchor key={impostor._id} playerId={String(impostor._id)}>
                        <GlassSection className="h-full rounded-[28px] p-5 text-center">
                          <div className="flex flex-col items-center">
                            <PlayerAvatar
                              name={impostor.name}
                              avatarSeed={impostor.emoji}
                              imageUrl={impostor.avatarImageUrl}
                              size="xl"
                            />
                            <p className="mt-4 font-display text-2xl text-white">
                              {impostor.name}
                            </p>
                            <p className="mt-2 font-condensed text-[11px] uppercase tracking-[0.24em] text-white/56">
                              Impostor confirmado
                            </p>
                          </div>
                        </GlassSection>
                      </ReactionAnchor>
                    ))}
                  </div>
                </div>
              </GlassPanel>

              <div className="flex flex-col gap-6">
                <GlassPanel tone="neutral" className="rounded-[34px] px-5 py-6 sm:px-6">
                  <div className="relative z-10">
                    <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/56">
                      Resumo da rodada
                    </p>
                    <h2 className="mt-2 font-display text-2xl text-white">
                      Conteudo jogado
                    </h2>

                    <div className="mt-5 grid gap-3">
                      {round.mode === "word" && round.word && (
                        <GlassSection className="rounded-[24px] px-4 py-4">
                          <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-emerald-100/70">
                            Palavra da rodada
                          </p>
                          <p className="mt-2 font-display text-2xl text-white">{round.word}</p>
                        </GlassSection>
                      )}

                      {round.mode === "question" && round.questionMain && (
                        <GlassSection className="rounded-[24px] px-4 py-4">
                          <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-emerald-100/70">
                            Pergunta normal
                          </p>
                          <p className="mt-2 font-body text-base leading-relaxed text-white/86">
                            &quot;{round.questionMain}&quot;
                          </p>
                        </GlassSection>
                      )}

                      {round.mode === "question" && round.questionImpostor && (
                        <GlassSection className="rounded-[24px] px-4 py-4">
                          <p className="font-condensed text-[11px] uppercase tracking-[0.22em] text-rose-100/70">
                            Pergunta do SUS
                          </p>
                          <p className="mt-2 font-body text-base leading-relaxed text-white/86">
                            &quot;{round.questionImpostor}&quot;
                          </p>
                        </GlassSection>
                      )}
                    </div>
                  </div>
                </GlassPanel>

                <GlassPanel tone="neutral" className="rounded-[34px] px-5 py-6 sm:px-6">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <Vote size={16} className="text-white/62" />
                      <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/56">
                        Ledger de votos
                      </p>
                    </div>

                    <div className="mt-4 flex max-h-[320px] flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
                      {votes?.map((vote) => {
                        const voterPlayer = players.find((player) => player._id === vote.voterId);
                        const targetPlayer = players.find((player) => player._id === vote.targetId);
                        if (!voterPlayer || !targetPlayer) return null;

                        return (
                          <GlassSection key={vote._id} className="rounded-[20px] px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="max-w-[120px] truncate font-body text-sm text-white/72">
                                {voterPlayer.name}
                              </span>
                              <ArrowRight size={14} className="shrink-0 text-white/28" />
                              <span className="max-w-[120px] truncate text-right font-body text-sm text-rose-100">
                                {targetPlayer.name}
                              </span>
                            </div>
                          </GlassSection>
                        );
                      })}
                    </div>
                  </div>
                </GlassPanel>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <GlassPanel tone="info" className="rounded-[34px] px-5 py-6 sm:px-6">
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.24em] text-white/56">
                    <Sparkles size={14} />
                    Proxima acao
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    <Button
                      onClick={() => void handleShareResult()}
                      className="h-[54px] rounded-[22px] border border-white/12 bg-white/12 text-sm font-semibold text-white hover:bg-white/18"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? "Texto copiado" : "Compartilhar resultado"}
                    </Button>

                    {isMasterMode && !isSpectator ? (
                      <>
                        {isHost ? (
                          <Button
                            className="h-[54px] rounded-[22px] border border-white/10 bg-white text-sm font-semibold text-[#1a0b3d] shadow-[0_16px_36px_rgba(255,255,255,0.16)] hover:bg-white"
                            disabled={isReturningToLobby}
                            onClick={async () => {
                              if (selectedMasterId) {
                                await updateMasterForNextRound({
                                  roomId: round.roomId,
                                  sessionId,
                                  customMasterId: selectedMasterId,
                                });
                              }
                              await startNextRound({ roomId: round.roomId, sessionId });
                            }}
                          >
                            Proxima rodada (Host)
                          </Button>
                        ) : (
                          <Button
                            className="h-[54px] rounded-[22px] border border-white/12 bg-white text-sm font-semibold text-[#1a0b3d] shadow-[0_16px_36px_rgba(255,255,255,0.16)] hover:bg-white disabled:border-white/8 disabled:bg-white/20 disabled:text-white/42"
                            disabled={round.nextRoundReadyBy?.includes(myPlayer._id) ?? false}
                            onClick={() =>
                              void requestNextRound({
                                roundId: round._id,
                                playerId: myPlayer._id,
                                sessionId,
                              })
                            }
                          >
                            {round.nextRoundReadyBy?.includes(myPlayer._id)
                              ? `Aguardando... (${round.nextRoundReadyBy?.length ?? 0} votos)`
                              : `Proxima rodada (${round.nextRoundReadyBy?.length ?? 0} votos)`}
                          </Button>
                        )}
                      </>
                    ) : !isSpectator && isHost ? (
                      <Button
                        className="h-[54px] rounded-[22px] border border-white/10 bg-white text-sm font-semibold text-[#1a0b3d] shadow-[0_16px_36px_rgba(255,255,255,0.16)] hover:bg-white"
                        disabled={isReturningToLobby}
                        onClick={() => void startNextRound({ roomId: round.roomId, sessionId })}
                      >
                        Proxima rodada
                      </Button>
                    ) : null}

                    {isHost && (
                      <Button
                        onClick={() => void onBackToLobby()}
                        disabled={isReturningToLobby}
                        className="h-[54px] rounded-[22px] border border-white/12 bg-white/8 text-sm font-semibold text-white hover:bg-white/12 disabled:opacity-60"
                      >
                        {isReturningToLobby ? "Voltando..." : "Voltar ao Lobby"}
                      </Button>
                    )}
                  </div>

                  {!isMasterMode && !isHost && (
                    <p className="mt-4 font-body text-sm text-white/58">
                      Aguardando o host iniciar a proxima rodada.
                    </p>
                  )}
                </div>
              </GlassPanel>

              {isMasterMode && isHost && !isSpectator ? (
                <GlassPanel tone="special" className="rounded-[34px] px-5 py-6 sm:px-6">
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.24em] text-white/56">
                      <Crown size={14} />
                      Mestre da proxima rodada
                    </div>
                    <p className="mt-4 font-body text-sm leading-relaxed text-white/70">
                      Defina quem conduz a proxima rodada antes de avancar.
                    </p>
                    <div className="mt-5">
                      <GlassSelect
                        ariaLabel="Selecionar mestre da proxima rodada"
                        value={
                          selectedMasterId ??
                          String(
                            room.settings.customMasterId ??
                              players.find((player) => player.isHost)?._id ??
                              ""
                          )
                        }
                        onChange={setSelectedMasterId}
                        options={nextMasterOptions}
                        tone="special"
                        className="w-full"
                      />
                    </div>
                  </div>
                </GlassPanel>
              ) : (
                <div />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
