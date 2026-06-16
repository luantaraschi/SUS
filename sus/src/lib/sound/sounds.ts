/**
 * sound/sounds.ts — Game-event → sound definitions for SUS.
 *
 * Every event function composes engine primitives (playTone / playNoise)
 * on the C4 pentatonic major scale for cohesion across all game sounds.
 * All functions are browser-only; SSR guards are in the engine layer.
 */

import { playTone, playNoise, scaleNote, noteToFreq } from "./engine";

// ---------------------------------------------------------------------------
// SoundEvent union type
// ---------------------------------------------------------------------------

export type SoundEvent =
  | "ui.click"      // noise — short UI click
  | "ui.toggle"     // noise — toggle switch
  | "lobby.join"    // tone  — player joined
  | "lobby.leave"   // tone  — player left/kicked
  | "chat.message"  // tone  — incoming chat message
  | "role.reveal"   // tone  — role card revealed (tense, lower register)
  | "phase.enter"   // tone  — entering a new game phase
  | "turn.you"      // tone  — it's your turn
  | "vote.cast"     // tone  — a vote was cast
  | "vote.consensus"// tone  — all votes in / consensus reached
  | "timer.tick"    // noise — countdown tick
  | "result.win"    // tone  — ascending pentatonic arpeggio (win)
  | "result.lose"   // tone  — descending/darker (lose)
  | "round.next"    // tone  — next round starting
  | "error";        // tone  — low gentle error tone

// ---------------------------------------------------------------------------
// Sound definitions
// ---------------------------------------------------------------------------

/** ui.click — very short bandpass noise burst (high, crisp) */
function soundUiClick(): void {
  playNoise({ duration: 0.012, bandpass: 4200, q: 4, gain: 0.28 });
}

/** ui.toggle — slightly longer, softer bandpass noise */
function soundUiToggle(): void {
  playNoise({ duration: 0.018, bandpass: 3800, q: 5, gain: 0.22 });
}

/** lobby.join — two ascending scale tones (C5 → E5) */
function soundLobbyJoin(): void {
  const f1 = noteToFreq(scaleNote(5)); // C5 (72)
  const f2 = noteToFreq(scaleNote(7)); // G5 (79)
  playTone({ freq: f1, type: "sine", duration: 0.1, gain: 0.3 });
  setTimeout(() => playTone({ freq: f2, type: "sine", duration: 0.14, gain: 0.28 }), 90);
}

/** lobby.leave — two descending scale tones (G4 → C4) */
function soundLobbyLeave(): void {
  const f1 = noteToFreq(scaleNote(2)); // E4 (64)
  const f2 = noteToFreq(scaleNote(0)); // C4 (60)
  playTone({ freq: f1, type: "sine", duration: 0.1, gain: 0.25 });
  setTimeout(() => playTone({ freq: f2, type: "sine", duration: 0.16, gain: 0.2 }), 85);
}

/** chat.message — gentle single tone (D4) with slight pitch drop */
function soundChatMessage(): void {
  const freq = noteToFreq(scaleNote(1)); // D4 (62)
  playTone({ freq, sweepTo: freq * 0.96, type: "sine", duration: 0.12, gain: 0.22 });
}

/**
 * role.reveal — slow tense arpeggio in lower register (C3 → G3 → C4),
 * intentionally slower and lower than win/lose for dramatic effect.
 */
function soundRoleReveal(): void {
  const f1 = noteToFreq(scaleNote(0) - 12); // C3 (48)
  const f2 = noteToFreq(scaleNote(2) - 12); // E3 (52)
  const f3 = noteToFreq(scaleNote(5) - 12); // C4 (60) — next octave
  playTone({ freq: f1, type: "triangle", duration: 0.18, gain: 0.28 });
  setTimeout(() => playTone({ freq: f2, type: "triangle", duration: 0.2, gain: 0.26 }), 160);
  setTimeout(() => playTone({ freq: f3, type: "triangle", duration: 0.28, gain: 0.3 }), 330);
}

/** phase.enter — two quick tones signalling a transition (D4 → G4) */
function soundPhaseEnter(): void {
  const f1 = noteToFreq(scaleNote(1)); // D4 (62)
  const f2 = noteToFreq(scaleNote(3)); // G4 (67)
  playTone({ freq: f1, type: "sine", duration: 0.1, gain: 0.28 });
  setTimeout(() => playTone({ freq: f2, type: "sine", duration: 0.18, gain: 0.3 }), 90);
}

/** turn.you — bright single tone (A4) to grab attention */
function soundTurnYou(): void {
  const freq = noteToFreq(scaleNote(4)); // A4 (69)
  playTone({ freq, sweepTo: freq * 1.02, type: "sine", duration: 0.2, gain: 0.35 });
}

/** vote.cast — soft single tone (E4) */
function soundVoteCast(): void {
  const freq = noteToFreq(scaleNote(2)); // E4 (64)
  playTone({ freq, type: "sine", duration: 0.1, gain: 0.24 });
}

/** vote.consensus — two-tone confirmation (E4 → A4) */
function soundVoteConsensus(): void {
  const f1 = noteToFreq(scaleNote(2)); // E4 (64)
  const f2 = noteToFreq(scaleNote(4)); // A4 (69)
  playTone({ freq: f1, type: "sine", duration: 0.12, gain: 0.28 });
  setTimeout(() => playTone({ freq: f2, type: "sine", duration: 0.2, gain: 0.32 }), 105);
}

/** timer.tick — very short high-frequency noise click */
function soundTimerTick(): void {
  playNoise({ duration: 0.008, bandpass: 4500, q: 3, gain: 0.2 });
}

/**
 * result.win — ascending pentatonic arpeggio (C4 → E4 → G4 → C5),
 * 3 tones scheduled with increasing brightness.
 */
function soundResultWin(): void {
  const f1 = noteToFreq(scaleNote(0)); // C4 (60)
  const f2 = noteToFreq(scaleNote(2)); // E4 (64)
  const f3 = noteToFreq(scaleNote(3)); // G4 (67)
  const f4 = noteToFreq(scaleNote(5)); // C5 (72)
  playTone({ freq: f1, type: "sine", duration: 0.14, gain: 0.38 });
  setTimeout(() => playTone({ freq: f2, type: "sine", duration: 0.14, gain: 0.38 }), 120);
  setTimeout(() => playTone({ freq: f3, type: "sine", duration: 0.16, gain: 0.4 }), 240);
  setTimeout(() => playTone({ freq: f4, type: "sine", duration: 0.3, gain: 0.4 }), 370);
}

/**
 * result.lose — descending pentatonic arpeggio in lower register,
 * triangle waveform for a darker, muted tone.
 */
function soundResultLose(): void {
  const f1 = noteToFreq(scaleNote(3));       // G4 (67)
  const f2 = noteToFreq(scaleNote(1));       // D4 (62)
  const f3 = noteToFreq(scaleNote(0) - 12); // C3 (48)
  playTone({ freq: f1, type: "triangle", duration: 0.18, gain: 0.3 });
  setTimeout(
    () => playTone({ freq: f2, type: "triangle", duration: 0.22, gain: 0.25 }),
    160
  );
  setTimeout(
    () => playTone({ freq: f3, sweepTo: f3 * 0.9, type: "triangle", duration: 0.35, gain: 0.22 }),
    340
  );
}

/** round.next — three ascending tones like a fanfare (C4 → E4 → G4) */
function soundRoundNext(): void {
  const f1 = noteToFreq(scaleNote(0)); // C4 (60)
  const f2 = noteToFreq(scaleNote(2)); // E4 (64)
  const f3 = noteToFreq(scaleNote(3)); // G4 (67)
  playTone({ freq: f1, type: "sine", duration: 0.1, gain: 0.3 });
  setTimeout(() => playTone({ freq: f2, type: "sine", duration: 0.1, gain: 0.3 }), 95);
  setTimeout(() => playTone({ freq: f3, type: "sine", duration: 0.2, gain: 0.32 }), 190);
}

/** error — low gentle tone (C3), soft triangle so it's not alarming */
function soundError(): void {
  const freq = noteToFreq(scaleNote(0) - 12); // C3 (48)
  playTone({ freq, type: "triangle", duration: 0.22, gain: 0.2 });
}

// ---------------------------------------------------------------------------
// SOUND_MAP — public record keyed by SoundEvent
// ---------------------------------------------------------------------------

export const SOUND_MAP: Record<SoundEvent, () => void> = {
  "ui.click": soundUiClick,
  "ui.toggle": soundUiToggle,
  "lobby.join": soundLobbyJoin,
  "lobby.leave": soundLobbyLeave,
  "chat.message": soundChatMessage,
  "role.reveal": soundRoleReveal,
  "phase.enter": soundPhaseEnter,
  "turn.you": soundTurnYou,
  "vote.cast": soundVoteCast,
  "vote.consensus": soundVoteConsensus,
  "timer.tick": soundTimerTick,
  "result.win": soundResultWin,
  "result.lose": soundResultLose,
  "round.next": soundRoundNext,
  "error": soundError,
};
