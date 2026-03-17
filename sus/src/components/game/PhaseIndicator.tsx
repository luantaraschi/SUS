"use client";

type PhaseStep = "distributing" | "speaking" | "answering" | "revealing" | "discussion" | "voting" | "results";

interface PhaseIndicatorProps {
  currentPhase: PhaseStep;
  mode?: "word" | "question";
  className?: string;
}

const WORD_PHASES: PhaseStep[] = [
  "distributing",
  "speaking",
  "voting",
  "results",
];

const QUESTION_PHASES: PhaseStep[] = [
  "distributing",
  "answering",
  "revealing",
  "discussion",
  "voting",
  "results",
];

const PHASE_LABELS: Record<PhaseStep, string> = {
  distributing: "Segredo",
  speaking: "Rodada",
  answering: "Resposta",
  revealing: "Revelacao",
  discussion: "Discussao",
  voting: "Votacao",
  results: "Resultado",
};

export default function PhaseIndicator({
  currentPhase,
  mode = "question",
  className = "",
}: PhaseIndicatorProps) {
  const phases = mode === "word" ? WORD_PHASES : QUESTION_PHASES;
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {phases.map((phase, index) => {
        const isActive = phase === currentPhase;
        const isPast = index < currentIndex;

        return (
          <div key={phase} className="flex items-center gap-2">
            <div
              className={`rounded-full border px-3 py-1 font-condensed text-[11px] uppercase tracking-[0.24em] transition-colors ${
                isActive
                  ? "border-game-info bg-game-info/15 text-white"
                  : isPast
                    ? "border-game-safe/35 bg-game-safe/10 text-white/75"
                    : "border-white/10 bg-white/5 text-white/45"
              }`}
            >
              {isPast ? "OK " : ""}
              {PHASE_LABELS[phase]}
            </div>
            {phase !== phases[phases.length - 1] && (
              <div className={`h-0.5 w-4 ${isPast ? "bg-game-safe/50" : "bg-white/15"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
