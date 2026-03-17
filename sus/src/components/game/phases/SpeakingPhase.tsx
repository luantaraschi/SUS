"use client";

import { useMutation, useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import PhaseIndicator from "../PhaseIndicator";
import SpeakingOrbit from "../SpeakingOrbit";
import { GlassPanel, GlassSection } from "../ui/glass";
import { ArrowRight, MessageCircleMore, ShieldAlert, Sparkles } from "lucide-react";

interface SpeakingPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  sessionId: string;
}

export function SpeakingPhase({
  round,
  players,
  myPlayer,
  myRole,
  sessionId,
}: SpeakingPhaseProps) {
  const speakingState = useQuery(api.rounds.getSpeakingState, {
    roundId: round._id,
  });
  const passTurn = useMutation(api.rounds.passTurn);
  const requestVoting = useMutation(api.rounds.requestVoting);

  const isHost = myPlayer.isHost;
  const isImpostor = myRole?.isImpostor ?? false;

  if (!speakingState) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-primary border-t-transparent" />
      </div>
    );
  }

  const {
    speakingOrder,
    currentSpeakerIndex,
    speakingTurnCount,
    votingRequestedBy,
  } = speakingState;
  const orderedPlayers = speakingOrder
    .map((id) => players.find((player) => player._id === id))
    .filter(Boolean) as PublicPlayer[];
  const totalSpeakers = orderedPlayers.length;
  const currentSpeaker = orderedPlayers[currentSpeakerIndex] ?? null;
  const nextSpeaker =
    totalSpeakers > 0 ? orderedPlayers[(currentSpeakerIndex + 1) % totalSpeakers] ?? null : null;
  const isMyTurn = currentSpeaker?._id === myPlayer._id;
  const lap = totalSpeakers > 0 ? Math.floor(speakingTurnCount / totalSpeakers) + 1 : 1;
  const progressIndex = totalSpeakers > 0 ? speakingTurnCount % totalSpeakers : 0;

  const humanActive = players.filter((player) => player.status !== "disconnected" && !player.isBot);
  const majority = Math.ceil(humanActive.length / 2);
  const hasRequestedVoting = votingRequestedBy.includes(myPlayer._id);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-8 sm:py-10">
      <PhaseIndicator currentPhase="speaking" mode="word" className="mb-6 justify-center" />

      <GlassPanel tone="info" className="rounded-[34px] px-5 py-5 sm:px-6">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.26em] text-white/58">
              <MessageCircleMore size={14} />
              Ordem em movimento
            </div>
            <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
              A rodada gira em ciclos
            </h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-white/72 sm:text-base">
              A ordem foi sorteada aleatoriamente. A trilha mostra quem ja falou neste ciclo, quem esta falando agora e quem vem na sequencia.
            </p>
          </div>

          <GlassSection className="rounded-[26px] px-4 py-4 lg:min-w-[260px]">
            <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/54">
              Fluxo da vez
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-white/42">
                  Agora
                </span>
                <span className="max-w-[140px] truncate font-body text-sm text-white/88">
                  {currentSpeaker?.name ?? "..."}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-white/42">
                  Proximo
                </span>
                <span className="max-w-[140px] truncate font-body text-sm text-white/72">
                  {nextSpeaker?.name ?? "..."}
                </span>
              </div>
            </div>
          </GlassSection>
        </div>
      </GlassPanel>

      <div className="mt-6 grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div className="order-2 lg:order-1">
          <SpeakingOrbit
            players={orderedPlayers}
            currentSpeakerIndex={currentSpeakerIndex}
            progressIndex={progressIndex}
            lap={lap}
            myPlayerId={myPlayer._id}
            centerContent={
              <div className="space-y-4 text-center">
                {isImpostor ? (
                  <div>
                    <p className="font-condensed text-[11px] uppercase tracking-[0.26em] text-rose-100/70">
                      Seu papel
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-rose-300/16 bg-rose-300/12 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-rose-50">
                      <ShieldAlert size={12} />
                      Voce e o SUS
                    </div>
                    <p className="mt-3 font-body text-sm leading-relaxed text-white/70">
                      {myRole?.secretContent
                        ? `Dica de contexto: ${myRole.secretContent}`
                        : "Leia a mesa e improvise sem se comprometer cedo demais."}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-condensed text-[11px] uppercase tracking-[0.26em] text-white/58">
                      Sua palavra
                    </p>
                    <p className="mt-2 font-display text-3xl text-emerald-200 sm:text-4xl">
                      {myRole?.secretContent ?? "???"}
                    </p>
                  </div>
                )}

                <div className="h-px bg-white/10" />

                <div>
                  <p className="font-condensed text-[11px] uppercase tracking-[0.26em] text-white/52">
                    Vez de
                  </p>
                  <p className="mt-2 font-display text-2xl text-white sm:text-3xl">
                    {currentSpeaker?.name ?? "..."}
                  </p>
                  <p className="mt-2 font-body text-sm text-white/68">
                    {isMyTurn
                      ? "Sua fala esta aberta. Entregue uma pista curta e passe a vez."
                      : `Aguardando ${currentSpeaker?.name ?? "o jogador atual"} concluir.`}
                  </p>
                </div>

                <GlassSection className="rounded-[22px] px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <ArrowRight size={14} className="text-sky-100" />
                    <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-white/64">
                      Proximo
                    </span>
                    <span className="max-w-[120px] truncate font-body text-sm text-white/88">
                      {nextSpeaker?.name ?? "..."}
                    </span>
                  </div>
                </GlassSection>
              </div>
            }
          />
        </div>

        <div className="order-1 flex flex-col gap-4 lg:order-2">
          <GlassPanel tone={isMyTurn ? "info" : "neutral"} className="rounded-[30px] p-5">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.24em] text-white/58">
                <Sparkles size={14} />
                Estado da rodada
              </div>
              <p className="mt-4 font-display text-2xl text-white">
                {isMyTurn ? "Sua vez de falar" : `Aguardando ${currentSpeaker?.name ?? "..."}`}
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-white/70">
                {isMyTurn
                  ? "Quando terminar, passe a vez para manter o ritmo do ciclo."
                  : "A roda continua automaticamente na ordem sorteada."}
              </p>

              <Button
                onClick={() =>
                  void passTurn({
                    roundId: round._id,
                    playerId: myPlayer._id,
                    sessionId,
                  })
                }
                disabled={!isMyTurn}
                className={cn(
                  "mt-5 h-[54px] w-full rounded-[22px] border border-white/12 bg-white text-[15px] font-semibold text-[#1a0b3d] shadow-[0_16px_36px_rgba(255,255,255,0.16)] transition-transform hover:-translate-y-0.5 hover:bg-white disabled:border-white/8 disabled:bg-white/20 disabled:text-white/42",
                  isMyTurn && "shadow-[0_18px_42px_rgba(0,184,235,0.18)]"
                )}
              >
                {isMyTurn ? "Ja falei" : "Aguardando sua vez"}
              </Button>
            </div>
          </GlassPanel>

          <GlassPanel tone="special" className="rounded-[30px] p-5">
            <div className="relative z-10">
              <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/54">
                Ir para votacao
              </p>
              <p className="mt-3 font-body text-sm leading-relaxed text-white/70">
                O host pode abrir a votacao a qualquer momento. Jogadores contam por maioria simples.
              </p>

              <Button
                onClick={() =>
                  void requestVoting({
                    roundId: round._id,
                    playerId: myPlayer._id,
                    sessionId,
                  })
                }
                disabled={hasRequestedVoting && !isHost}
                className={cn(
                  "mt-5 h-[52px] w-full rounded-[22px] border px-4 text-[14px] font-semibold transition-transform hover:-translate-y-0.5",
                  hasRequestedVoting && !isHost
                    ? "border-amber-300/12 bg-amber-300/10 text-amber-50/55"
                    : "border-amber-300/18 bg-amber-300/16 text-amber-50 hover:bg-amber-300/22"
                )}
              >
                {isHost
                  ? "Iniciar Votacao (Host)"
                  : hasRequestedVoting
                    ? "Voto registrado"
                    : "Pedir votacao"}
              </Button>

              <GlassSection className="mt-4 rounded-[20px] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-condensed text-[11px] uppercase tracking-[0.22em] text-white/48">
                    Consenso
                  </span>
                  <span className="font-body text-sm text-white/84">
                    {votingRequestedBy.length}/{majority} votos
                  </span>
                </div>
              </GlassSection>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
