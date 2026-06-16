/**
 * sound/engine.ts — Web Audio engine primitives for SUS.
 *
 * Pure helpers (noteToFreq, scaleNote, envelopeTimes) are node-safe and
 * import-safe: they reference no Web Audio types whatsoever.
 *
 * Audio functions (getContext, getMasterGain, playTone, playNoise) are
 * browser-only and lazily access AudioContext. They are guarded against SSR
 * and always wrapped in try/catch so failures never propagate to callers.
 */

// ---------------------------------------------------------------------------
// Pure helpers — safe to call in node / tests
// ---------------------------------------------------------------------------

/**
 * Convert a MIDI note number to its frequency in Hz.
 * Formula: 440 * 2^((midi - 69) / 12)  (A4 = midi 69 = 440 Hz)
 */
export function noteToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Pentatonic major scale intervals relative to a tonic (semitones).
 * C major pentatonic: C D E G A → intervals [0, 2, 4, 7, 9]
 */
const PENTA_INTERVALS = [0, 2, 4, 7, 9] as const;
/** Tonic: C4 = MIDI 60 */
const PENTA_TONIC = 60;

/**
 * Map a 0-based scale degree to a MIDI note number in C4 pentatonic major.
 * Degrees beyond the scale length wrap to higher octaves (fully deterministic).
 *
 * degree 0 → C4 (60)
 * degree 1 → D4 (62)
 * degree 5 → C5 (72)  ← first note of next octave
 */
export function scaleNote(degree: number): number {
  const len = PENTA_INTERVALS.length; // 5
  const octave = Math.floor(degree / len);
  const step = degree % len;
  return PENTA_TONIC + octave * 12 + PENTA_INTERVALS[step];
}

/** Shape returned by envelopeTimes. */
export interface EnvelopeParams {
  /** Anti-click linear attack duration in seconds (> 0). */
  attack: number;
  /** Time at which full gain is reached (= start + attack). Callers add to ctx.currentTime. */
  peakTime: number;
  /** Exponential release ramp ends here (= start + attack + release). */
  releaseEnd: number;
  /** Target value for exponential release — always 0.001 (never 0). */
  releaseTarget: number;
}

/**
 * Compute envelope timing params from a desired duration.
 * All times are relative to time 0 (caller adds ctx.currentTime).
 *
 * @param opts.attack  - optional explicit attack; defaults to 0.0015 s (1.5 ms anti-click)
 * @param opts.duration - total duration in seconds
 */
export function envelopeTimes(opts: {
  attack?: number;
  duration: number;
}): EnvelopeParams {
  const attack = opts.attack != null && opts.attack > 0 ? opts.attack : 0.0015;
  const release = Math.max(opts.duration - attack, 0.001);
  return {
    attack,
    peakTime: attack,
    releaseEnd: attack + release,
    releaseTarget: 0.001,
  };
}

// ---------------------------------------------------------------------------
// Browser-only audio engine — lazily initialised, SSR-safe
// ---------------------------------------------------------------------------

let _ctx: AudioContext | null = null;
let _master: GainNode | null = null;

/** Master output gain (0–1). Adjust to change global volume. */
export const MASTER_GAIN = 0.75;

/**
 * Lazily create and cache a single AudioContext.
 * Resumes if suspended (e.g. after a user-gesture policy pause).
 * Returns null in SSR / non-browser environments.
 */
export function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AC = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return null;

    if (!_ctx) {
      _ctx = new AC() as AudioContext;
    }
    if (_ctx.state === "suspended") {
      void _ctx.resume();
    }
    return _ctx;
  } catch {
    return null;
  }
}

/**
 * Lazily create and cache a master GainNode → destination.
 * All engine sounds route through this node.
 */
function getMasterGain(): GainNode | null {
  const ctx = getContext();
  if (!ctx) return null;

  if (!_master) {
    _master = ctx.createGain();
    _master.gain.value = MASTER_GAIN;
    _master.connect(ctx.destination);
  }
  return _master;
}

/**
 * Set the master output volume (0–1). Applies immediately via a short
 * exponential ramp to avoid clicks. No-ops in SSR / when context not ready.
 */
export function setMasterVolume(value: number): void {
  try {
    const master = getMasterGain();
    const ctx = getContext();
    if (!master || !ctx) return;
    const clamped = Math.min(Math.max(value, 0), 1);
    master.gain.setTargetAtTime(clamped, ctx.currentTime, 0.01);
  } catch {
    // Silently ignore
  }
}

// ---------------------------------------------------------------------------
// playTone — oscillator with optional pitch sweep and ADSR envelope
// ---------------------------------------------------------------------------

export interface PlayToneOpts {
  /** Frequency in Hz at note start. */
  freq: number;
  /** Oscillator waveform type. Default "sine". */
  type?: OscillatorType;
  /** Total sound duration in seconds. */
  duration: number;
  /** Peak gain (clamped to ≤ 1.0). Default 0.3. */
  gain?: number;
  /** If provided, pitch sweeps exponentially from freq → sweepTo over the duration. */
  sweepTo?: number;
  /** Optional attack override (seconds). */
  attack?: number;
}

/**
 * Play a tonal sound via oscillator.
 * Routing: OscillatorNode → GainNode(envelope) → masterGain → destination
 * All nodes disconnected onended.
 */
export function playTone(opts: PlayToneOpts): void {
  try {
    const ctx = getContext();
    const master = getMasterGain();
    if (!ctx || !master) return;

    const gain = Math.min(opts.gain ?? 0.3, 1.0);
    const type = opts.type ?? "sine";
    const env = envelopeTimes({ attack: opts.attack, duration: opts.duration });
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(opts.freq, t);
    if (opts.sweepTo != null) {
      // Ensure sweepTo is positive (exponentialRamp requires > 0)
      const target = Math.max(opts.sweepTo, 1);
      osc.frequency.exponentialRampToValueAtTime(target, t + env.releaseEnd);
    }

    // Envelope: start silent → linear attack to peak → exponential decay to 0.001
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.linearRampToValueAtTime(gain, t + env.attack);
    gainNode.gain.exponentialRampToValueAtTime(env.releaseTarget, t + env.releaseEnd);

    osc.connect(gainNode).connect(master);
    osc.start(t);
    osc.stop(t + env.releaseEnd + 0.005);

    osc.onended = () => {
      gainNode.disconnect();
      osc.disconnect();
    };
  } catch {
    // Silently swallow — audio failure must never break game logic
  }
}

// ---------------------------------------------------------------------------
// playNoise — filtered white noise burst for click/percussion sounds
// ---------------------------------------------------------------------------

export interface PlayNoiseOpts {
  /** Buffer duration in seconds. Default 0.008 (8 ms). */
  duration?: number;
  /** Bandpass filter centre frequency in Hz. Default 4000. */
  bandpass?: number;
  /** Filter Q. Default 3. */
  q?: number;
  /** Peak gain (clamped to ≤ 1.0). Default 0.3. */
  gain?: number;
}

/**
 * Play a short filtered white-noise burst.
 * Routing: BufferSourceNode → BiquadFilter(bandpass) → GainNode(envelope) → masterGain → destination
 */
export function playNoise(opts: PlayNoiseOpts = {}): void {
  try {
    const ctx = getContext();
    const master = getMasterGain();
    if (!ctx || !master) return;

    const duration = opts.duration ?? 0.008;
    const bandpass = opts.bandpass ?? 4000;
    const q = opts.q ?? 3;
    const gain = Math.min(opts.gain ?? 0.3, 1.0);
    const env = envelopeTimes({ duration });
    const t = ctx.currentTime;

    // Build white-noise buffer
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.ceil(sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Bandpass filter — shapes the click/percussion timbre
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = bandpass;
    filter.Q.value = q;

    // Gain envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.linearRampToValueAtTime(gain, t + env.attack);
    gainNode.gain.exponentialRampToValueAtTime(env.releaseTarget, t + env.releaseEnd);

    // Source node
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    source.connect(filter).connect(gainNode).connect(master);
    source.start(t);

    source.onended = () => {
      filter.disconnect();
      gainNode.disconnect();
      source.disconnect();
    };
  } catch {
    // Silently swallow
  }
}
