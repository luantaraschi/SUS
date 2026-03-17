type SynthNote = {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain?: number;
  ramp?: "up" | "down";
};

const SYNTH_DEFS: Record<string, SynthNote[]> = {
  click: [{ frequency: 1200, duration: 0.08, type: "sine", gain: 0.3 }],
  join: [
    { frequency: 523, duration: 0.08, type: "sine", gain: 0.35 },
    { frequency: 659, duration: 0.12, type: "sine", gain: 0.3 },
  ],
  kick: [
    { frequency: 440, duration: 0.06, type: "sine", gain: 0.35 },
    { frequency: 220, duration: 0.18, type: "sawtooth", gain: 0.25, ramp: "down" },
  ],
  vote: [{ frequency: 800, duration: 0.12, type: "sine", gain: 0.3 }],
  reveal: [
    { frequency: 440, duration: 0.12, type: "sine", gain: 0.3 },
    { frequency: 660, duration: 0.15, type: "sine", gain: 0.3 },
    { frequency: 880, duration: 0.2, type: "sine", gain: 0.3 },
  ],
  win: [
    { frequency: 523, duration: 0.12, type: "sine", gain: 0.4 },
    { frequency: 659, duration: 0.12, type: "sine", gain: 0.4 },
    { frequency: 784, duration: 0.25, type: "sine", gain: 0.4 },
  ],
  lose: [
    { frequency: 400, duration: 0.18, type: "sawtooth", gain: 0.2 },
    { frequency: 280, duration: 0.3, type: "sawtooth", gain: 0.15, ramp: "down" },
  ],
  tick: [{ frequency: 1000, duration: 0.04, type: "square", gain: 0.12 }],
  message: [{ frequency: 600, duration: 0.1, type: "sine", gain: 0.25 }],
  "next-round": [
    { frequency: 440, duration: 0.1, type: "sine", gain: 0.3 },
    { frequency: 554, duration: 0.1, type: "sine", gain: 0.3 },
    { frequency: 659, duration: 0.18, type: "sine", gain: 0.3 },
  ],
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

export function playSynth(name: string): void {
  const def = SYNTH_DEFS[name];
  if (!def) return;

  try {
    const ctx = getAudioContext();
    let offset = 0;

    for (const note of def) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const vol = note.gain ?? 0.3;

      osc.type = note.type;
      osc.frequency.value = note.frequency;

      gainNode.gain.setValueAtTime(vol, ctx.currentTime + offset);
      if (note.ramp === "down") {
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + offset + note.duration
        );
      } else {
        gainNode.gain.setValueAtTime(vol, ctx.currentTime + offset + note.duration * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + offset + note.duration
        );
      }

      osc.connect(gainNode).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + note.duration + 0.01);

      offset += note.duration * 0.8;
    }
  } catch {
    // AudioContext not available or blocked
  }
}
