import type { ColorId } from './colors';
import { GAP_MS, LEAD_IN_MS, LIGHT_MS } from './config';

export type Cancel = () => void;

// Runs fn after ms; returns a cancel function
export function after(ms: number, fn: () => void): Cancel {
  const id = window.setTimeout(fn, ms);
  return () => window.clearTimeout(id);
}

interface PresentationHandlers {
  light: (color: ColorId | null) => void;
  playSound: (color: ColorId) => () => void;
  done: () => void;
}

// Plays the sequence at a fixed pace. Cancelling stops lights, sound and all pending timers at once.
export function presentSequence(sequence: ColorId[], h: PresentationHandlers): Cancel {
  const cancels: Cancel[] = [];
  let stopSound: (() => void) | null = null;
  const endSound = () => {
    stopSound?.();
    stopSound = null;
  };

  let t = LEAD_IN_MS;
  for (const color of sequence) {
    cancels.push(
      after(t, () => {
        h.light(color);
        stopSound = h.playSound(color);
      }),
    );
    cancels.push(
      after(t + LIGHT_MS, () => {
        endSound();
        h.light(null);
      }),
    );
    t += LIGHT_MS + GAP_MS;
  }
  cancels.push(after(t - GAP_MS, h.done));

  return () => {
    cancels.forEach((c) => c());
    endSound();
    h.light(null);
  };
}
