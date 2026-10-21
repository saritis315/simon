import type { ColorId } from './colors';

// One distinct pitch per color
const FREQUENCIES: Record<ColorId, number> = {
  green: 392,
  red: 330,
  yellow: 262,
  blue: 523,
};

const ATTACK = 0.01;
const RELEASE = 0.04;

interface ActiveTone {
  stop: () => void;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private active = new Set<ActiveTone>();

  // Must be called from a user gesture; resolves false if audio cannot start
  async unlock(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return false;
        this.ctx = new Ctor();
      }
      if (this.ctx.state !== 'running') await this.ctx.resume();
      return (this.ctx.state as string) === 'running';
    } catch {
      return false;
    }
  }

  // Starts a tone that lasts until the returned stop function is called
  private startTone(freq: number, type: OscillatorType, delay = 0): ActiveTone {
    const ctx = this.ctx;
    if (!ctx) return { stop: () => {} };
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.3, start + ATTACK);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    let stopped = false;
    const tone: ActiveTone = {
      stop: () => {
        if (stopped) return;
        stopped = true;
        this.active.delete(tone);
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + RELEASE);
        osc.stop(now + RELEASE);
      },
    };
    this.active.add(tone);
    return tone;
  }

  playColor(color: ColorId): () => void {
    return this.startTone(FREQUENCIES[color], 'sine').stop;
  }

  private playMotif(notes: [number, number][], type: OscillatorType) {
    let t = 0;
    for (const [freq, dur] of notes) {
      const tone = this.startTone(freq, type, t);
      window.setTimeout(tone.stop, (t + dur) * 1000);
      t += dur;
    }
  }

  playWin() {
    this.playMotif(
      [
        [523, 0.15],
        [659, 0.15],
        [784, 0.15],
        [1047, 0.4],
      ],
      'triangle',
    );
  }

  playLose() {
    this.playMotif(
      [
        [220, 0.25],
        [185, 0.25],
        [147, 0.5],
      ],
      'sawtooth',
    );
  }

  stopAll() {
    for (const tone of [...this.active]) tone.stop();
  }
}

export const audio = new AudioEngine();
