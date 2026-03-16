"use client";

type PhaseStep = "distributing" | "answering" | "revealing" | "discussion" | "voting" | "results";

interface PhaseIndicatorProps {
  currentPhase: PhaseStep;
  className?: string;
}

const PHASES: PhaseStep[] = [
  "distributing",
  "answering",
  "revealing",
  "discussion",
  "voting",
  "results",
];

const PHASE_LABELS: Record<PhaseStep, string> = {
  distributing: "Segredo",
  answering: "Resposta",
  revealing: "Revelacao",
  discussion: "Discussao",
  voting: "Votacao",
  results: "Resultado",
};

export default function PhaseIndicator({
  currentPhase,
  className = "",
}: PhaseIndicatorProps) {
  const currentIndex = PHASES.indexOf(currentPhase);

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {PHASES.map((phase, index) => {
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
            {phase !== PHASES[PHASES.length - 1] && (
              <div className={`h-0.5 w-4 ${isPast ? "bg-game-safe/50" : "bg-white/15"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
