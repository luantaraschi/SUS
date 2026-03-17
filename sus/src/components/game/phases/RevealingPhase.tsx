import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { cn, getCenteredOddGridItemClass } from "@/lib/utils";
import PlayerAvatar from "../PlayerAvatar";
import PhaseIndicator from "../PhaseIndicator";
import Timer from "../Timer";
import { ReactionAnchor } from "../reactions/ReactionAnchor";
import { GlassPanel, GlassSection } from "../ui/glass";
import type { PublicPlayer, RoleView, SafeRound } from "@/lib/game-view-types";
import { Eye, Sparkles } from "lucide-react";

interface RevealingPhaseProps {
  round: SafeRound;
  players: PublicPlayer[];
  myPlayer: Doc<"players">;
  myRole?: RoleView;
  sessionId: string;
}

export function RevealingPhase({
  round,
  players,
  myRole,
}: RevealingPhaseProps) {
  const [now, setNow] = useState(() => Date.now());
  const answers = useQuery(api.answers.getAnswersByRound, { roundId: round._id });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const countdownRemaining = useMemo(() => {
    if (!round.revealedAt) {
      return 0;
    }

    return Math.max(0, 3 - Math.floor((now - round.revealedAt) / 1000));
  }, [now, round.revealedAt]);

  const showAnswers = countdownRemaining === 0;

  if (!showAnswers) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
        <PhaseIndicator currentPhase="revealing" mode={round.mode} className="mb-7" />

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl"
        >
          <GlassPanel tone="special" className="rounded-[36px] px-6 py-8 text-center sm:px-8">
            <div className="relative z-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/14 bg-white/10 shadow-[0_20px_48px_rgba(0,0,0,0.18)]">
                <Sparkles size={28} className="text-fuchsia-100" />
              </div>
              <p className="mt-5 font-condensed text-xs uppercase tracking-[0.34em] text-white/56">
                Revelacao sincronizada
              </p>
              <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
                Respostas prestes a aparecer
              </h2>
              <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-white/72 sm:text-base">
                Em instantes todo mundo vera a mesma grade. Observe o ritmo, as escolhas e quem parece estar improvisando.
              </p>

              <div className="mt-8 flex justify-center">
                <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-white/14 bg-white/8 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                  <div className="absolute inset-4 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22),transparent_68%)] animate-[glass-breathe_5.6s_ease-in-out_infinite]" />
                  <div className="absolute inset-0 rounded-full border border-white/10" />
                  <span className="relative font-display text-[5rem] leading-none text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.18)]">
                    {countdownRemaining}
                  </span>
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col items-center px-4 py-8 sm:py-10">
      <PhaseIndicator currentPhase="revealing" mode={round.mode} className="mb-6" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <GlassPanel tone="info" className="rounded-[34px] px-5 py-5 sm:px-6">
          <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.26em] text-white/58">
                <Eye size={14} />
                Quadro aberto
              </div>
              <h2 className="mt-3 font-display text-3xl text-white sm:text-4xl">
                Respostas reveladas
              </h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-white/72 sm:text-base">
                A discussao comeca automaticamente quando esse tempo acabar. Compare padrao, vocabulario e seguranca de cada resposta.
              </p>
            </div>

            <GlassSection className="rounded-[26px] px-4 py-3 text-center lg:min-w-[240px]">
              <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/54">
                Tempo restante
              </p>
              <Timer endsAt={round.phaseEndsAt} className="mt-3 justify-center" />
            </GlassSection>
          </div>
        </GlassPanel>
      </motion.div>

      <div className="mt-6 grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
        {answers?.map((answer, index) => {
          const player = players.find((currentPlayer) => currentPlayer._id === answer.playerId);
          if (!player) return null;

          const isMarkedByMaster =
            myRole?.role === "master" && myRole.masterImpostorIds?.includes(player._id);

          return (
            <ReactionAnchor
              key={answer._id}
              playerId={String(player._id)}
              className={getCenteredOddGridItemClass(index, answers?.length ?? 0, "lg")}
            >
              <motion.div
                initial={{ opacity: 0, y: 26, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.07,
                  duration: 0.34,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <GlassPanel
                  tone={isMarkedByMaster ? "impostor" : "neutral"}
                  className={cn("rounded-[30px] p-5 sm:p-6", isMarkedByMaster && "border-rose-300/16")}
                >
                  <div className="relative z-10">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar
                          name={player.name}
                          avatarSeed={player.emoji}
                          imageUrl={player.avatarImageUrl}
                          size="sm"
                          hideName
                        />
                        <div>
                          <p className="font-body text-base text-white">{player.name}</p>
                          <p className="font-condensed text-[11px] uppercase tracking-[0.24em] text-white/50">
                            Resposta compartilhada
                          </p>
                        </div>
                      </div>

                      {isMarkedByMaster && (
                        <span className="rounded-full border border-rose-300/18 bg-rose-300/12 px-3 py-1 font-condensed text-[11px] uppercase tracking-[0.22em] text-rose-50">
                          Marcado pelo mestre
                        </span>
                      )}
                    </div>

                    <GlassSection className="rounded-[24px] px-4 py-5 sm:px-5">
                      <p className="break-words font-body text-lg font-medium leading-relaxed text-white sm:text-xl">
                        &quot;{answer.text}&quot;
                      </p>
                    </GlassSection>
                  </div>
                </GlassPanel>
              </motion.div>
            </ReactionAnchor>
          );
        })}
      </div>
    </div>
  );
}
