import { test, expect } from "vitest";
import { noteToFreq, scaleNote, envelopeTimes } from "../engine";

test("A4 (midi 69) is 440Hz", () => expect(Math.round(noteToFreq(69))).toBe(440));

test("scaleNote is deterministic and ascends", () => {
  expect(scaleNote(0)).toBe(scaleNote(0));
  expect(scaleNote(5)).toBeGreaterThan(scaleNote(0)); // next octave higher
});

test("envelope uses anti-click attack and 0.001 release target", () => {
  const e = envelopeTimes({ duration: 0.2 });
  expect(e.attack).toBeGreaterThan(0);
  expect(e.releaseTarget).toBeCloseTo(0.001);
});
