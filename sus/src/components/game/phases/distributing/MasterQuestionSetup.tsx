"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useMutation } from "convex/react";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FormField from "../../FormField";
import PostItBoard from "../../PostItBoard";
import GlassSelect from "../../ui/GlassSelect";
import {
  GlassField,
  GlassPanel,
  GlassSection,
  GlassTextarea,
  glassToneClasses,
} from "../../ui/glass";
import type { PublicPlayer, SafeRound } from "@/lib/game-view-types";
import { getRoleMeta } from "./roleMeta";
import { Crown } from "lucide-react";

interface MasterQuestionSetupProps {
  round: SafeRound;
  players: PublicPlayer[];
  room: Doc<"rooms">;
  sessionId: string;
}

/**
 * The master's setup screen: two questions (players' + impostor's) plus the
 * impostor pick. Both questions are required; FormField shows inline validation
 * once a field is touched, and submit stays disabled until both are filled.
 */
export function MasterQuestionSetup({
  round,
  players,
  room,
  sessionId,
}: MasterQuestionSetupProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [masterMain, setMasterMain] = useState("");
  const [masterImpostor, setMasterImpostor] = useState("");
  const [selectedImpostor, setSelectedImpostor] = useState("random");
  const [touchedMain, setTouchedMain] = useState(false);
  const [touchedImpostor, setTouchedImpostor] = useState(false);

  const setMasterQuestions = useMutation(api.rounds.setMasterQuestions);
  const roleMeta = getRoleMeta("master", room.mode);

  // Master board lives behind the card when no questions exist yet (question mode).
  const showMasterBoardBackground =
    room.mode === "question" && round.questionMain == null;

  const impostorOptions = useMemo(
    () => [
      { value: "random", label: "Aleatorio (Sorteio)" },
      ...players
        .filter(
          (player) =>
            !player.isBot &&
            player._id !== (round.masterId as Id<"players"> | null)
        )
        .map((player) => ({
          value: String(player._id),
          label: player.name,
        })),
    ],
    [players, round.masterId]
  );

  const mainError = !masterMain.trim()
    ? "Escreva a pergunta que os jogadores recebem."
    : undefined;
  const impostorError = !masterImpostor.trim()
    ? "Escreva uma pergunta alternativa para o impostor."
    : undefined;
  const canSubmit = !mainError && !impostorError;

  const handleConfirmQuestions = () => {
    setTouchedMain(true);
    setTouchedImpostor(true);
    if (!canSubmit) return;
    void setMasterQuestions({
      roundId: round._id,
      sessionId,
      questionMain: masterMain,
      questionImpostor: masterImpostor,
      selectedImpostorId:
        selectedImpostor === "random"
          ? undefined
          : (selectedImpostor as Id<"players">),
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-md">
      {showMasterBoardBackground && (
        <PostItBoard
          roomId={round.roomId}
          sessionId={sessionId}
          variant="background"
          allowComposer={false}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--w-08),transparent_26%),radial-gradient(circle_at_bottom,color-mix(in_srgb,var(--color-special)_20%,transparent),transparent_36%)]" />

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        <GlassPanel
          tone={roleMeta.tone}
          className="rounded-[var(--r-2xl)] px-5 py-6 sm:px-7 sm:py-8"
        >
          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-2)] text-[var(--color-special)] shadow-[var(--shadow-md)]">
                  <Crown size={24} />
                </div>
                <div>
                  <p className="font-condensed text-[11px] uppercase tracking-[0.28em] text-[var(--text-dim)]">
                    {roleMeta.accentLabel}
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-[var(--color-text)] sm:text-[2rem]">
                    {roleMeta.title}
                  </h2>
                </div>
              </div>

              <div className="self-start rounded-[var(--r-pill)] border border-[var(--glass-border)] bg-[var(--glass-1)] px-3 py-1.5 font-condensed text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                Rodada em preparo
              </div>
            </div>

            <p className="mt-5 max-w-xl font-body text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              {roleMeta.subtitle}
            </p>

            <GlassSection className="mt-6 rounded-[var(--r-lg)] p-5 text-left sm:p-6">
              <div className="grid gap-5">
                <FormField
                  label="Pergunta dos jogadores"
                  htmlFor="master-main-question"
                  error={touchedMain ? mainError : undefined}
                  help="Todos respondem a esta, menos o impostor."
                >
                  <GlassField className="rounded-[var(--r-md)]">
                    <GlassTextarea
                      id="master-main-question"
                      value={masterMain}
                      onChange={(event) => setMasterMain(event.target.value)}
                      onBlur={() => setTouchedMain(true)}
                      aria-invalid={touchedMain && Boolean(mainError)}
                      placeholder="Ex.: Qual resposta parece correta sem ser obvia?"
                    />
                  </GlassField>
                </FormField>

                <FormField
                  label="Pergunta do impostor"
                  htmlFor="master-impostor-question"
                  error={touchedImpostor ? impostorError : undefined}
                  help="Diferente, mas capaz de gerar respostas parecidas."
                >
                  <GlassField className="rounded-[var(--r-md)]">
                    <GlassTextarea
                      id="master-impostor-question"
                      value={masterImpostor}
                      onChange={(event) =>
                        setMasterImpostor(event.target.value)
                      }
                      onBlur={() => setTouchedImpostor(true)}
                      aria-invalid={touchedImpostor && Boolean(impostorError)}
                      placeholder="Crie uma pergunta diferente, mas capaz de gerar resposta parecida."
                    />
                  </GlassField>
                </FormField>

                <FormField
                  label="Quem e o impostor?"
                  htmlFor="master-impostor-select"
                  help="Deixe no sorteio ou escolha alguem da mesa."
                >
                  <GlassSelect
                    ariaLabel="Selecionar impostor da rodada"
                    value={selectedImpostor}
                    onChange={setSelectedImpostor}
                    options={impostorOptions}
                    tone="special"
                    className="rounded-[var(--r-md)]"
                  />
                </FormField>
              </div>
            </GlassSection>

            <Button
              onClick={handleConfirmQuestions}
              disabled={!canSubmit}
              className={cn(
                "mt-5 h-[52px] w-full rounded-[var(--r-md)] border border-[var(--glass-border)] bg-white text-[15px] font-semibold text-[var(--color-primary-press)] shadow-[var(--shadow-md)] transition-transform duration-[var(--t-quick)] hover:-translate-y-0.5 hover:bg-white disabled:translate-y-0 disabled:border-[var(--w-08)] disabled:bg-[var(--w-20)] disabled:text-[var(--text-dim)]",
                glassToneClasses(roleMeta.tone)
              )}
            >
              Confirmar perguntas
            </Button>
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
