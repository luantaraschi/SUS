"use client";

import { PHASES } from "@/lib/constants";

interface PhaseIndicatorProps {
  currentPhase: (typeof PHASES)[number];
  className?: string;
}

const PHASE_LABELS: Record<(typeof PHASES)[number], string> = {
  secret: "Palavra Secreta",
  answer: "Resposta",
  reveal: "Revelação",
  discussion: "Discussão",
  voting: "Votação",
  result: "Resultado",
};

export default function PhaseIndicator({
  currentPhase,
  className = "",
}: PhaseIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {PHASES.map((phase) => {
        const isActive = phase === currentPhase;
        const idx = PHASES.indexOf(phase);
        const currentIdx = PHASES.indexOf(currentPhase);
        const isPast = idx < currentIdx;

        return (
          <div key={phase} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-pill px-3 py-1 font-condensed text-xs uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-game-info text-white shadow-[0_0_12px_rgba(0,184,235,0.4)]"
                  : isPast
                    ? "bg-white/20 text-white/70"
                    : "bg-white/10 text-white/40"
              }`}
            >
              {PHASE_LABELS[phase]}
            </div>
            {phase !== PHASES[PHASES.length - 1] && (
              <div className="h-0.5 w-3 bg-white/20" />
            )}
          </div>
        );
      })}
    </div>
  );
}
