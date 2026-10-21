import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { audio } from './game/audio';
import { randomColor } from './game/random';
import confetti from 'canvas-confetti';
import type { ColorId } from './game/colors';

vi.mock('./game/audio', () => ({
  audio: {
    unlock: vi.fn(),
    playColor: vi.fn(),
    playWin: vi.fn(),
    playLose: vi.fn(),
    stopAll: vi.fn(),
  },
}));
vi.mock('./game/random', () => ({ randomColor: vi.fn() }));
vi.mock('canvas-confetti', () => {
  const fn = Object.assign(vi.fn(), { reset: vi.fn() });
  return { default: fn };
});

const NAMES: Record<ColorId, string> = { green: 'ירוק', red: 'אדום', yellow: 'צהוב', blue: 'כחול' };

let queue: ColorId[] = [];
const stopSound = vi.fn();

const press = (c: ColorId) => fireEvent.pointerDown(screen.getByRole('button', { name: NAMES[c] }));
const click = async (name: string) => {
  fireEvent.click(screen.getByRole('button', { name }));
  await act(async () => {});
};
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const playedColors = () => vi.mocked(audio.playColor).mock.calls.map((c) => c[0]);

async function startAndReachInput(first: ColorId = 'green') {
  queue = [first, 'red', 'blue', 'yellow'];
  render(<App />);
  await click('התחל משחק');
  await advance(1600); // lead-in 1000 + 600 light
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(audio.unlock).mockResolvedValue(true);
  vi.mocked(audio.playColor).mockReturnValue(stopSound);
  vi.mocked(randomColor).mockImplementation(() => queue.shift() ?? 'green');
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('game flow', () => {
  it('presents one color in round 1, then waits for the player', async () => {
    queue = ['green'];
    render(<App />);
    await click('התחל משחק');
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'התחל משחק' })).toBeNull();
    await advance(999);
    expect(audio.playColor).not.toHaveBeenCalled();
    await advance(1);
    expect(playedColors()).toEqual(['green']);
    await advance(600);
    expect(stopSound).toHaveBeenCalled();
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
  });

  it('ignores presses while the sequence is being presented', async () => {
    queue = ['green'];
    render(<App />);
    await click('התחל משחק');
    press('red');
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
    expect(audio.playColor).not.toHaveBeenCalled();
  });

  it('advances to round 2 after a correct round, with the same pace and a longer sequence', async () => {
    await startAndReachInput();
    press('green');
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument(); // completed round stays visible
    press('red'); // input is blocked during the wait
    await advance(1000);
    expect(screen.getByText('שלב 2 מתוך 10')).toBeInTheDocument();
    vi.mocked(audio.playColor).mockClear();
    await advance(1000); // lead-in
    expect(playedColors()).toEqual(['green']);
    await advance(850);
    expect(playedColors()).toEqual(['green', 'red']);
    await advance(600);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
  });

  it('loses on a wrong press: color sound at once, end message and sound after 1s, no confetti', async () => {
    await startAndReachInput();
    vi.mocked(audio.playColor).mockClear();
    press('red');
    expect(playedColors()).toEqual(['red']);
    expect(screen.queryByText('נפסלת!')).toBeNull();
    expect(audio.playLose).not.toHaveBeenCalled();
    await advance(1000);
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.getByText('0 שלבים שהושלמו')).toBeInTheDocument();
    expect(audio.playLose).toHaveBeenCalledTimes(1);
    expect(confetti).not.toHaveBeenCalled();
    await click('אישור');
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
  });

  it('starts a fresh sequence in the next game after "אישור" and "התחל משחק"', async () => {
    await startAndReachInput('green');
    press('red');
    await advance(1000);
    await click('אישור');
    queue = ['yellow'];
    vi.mocked(audio.playColor).mockClear();
    await click('התחל משחק');
    await advance(1000);
    expect(playedColors()).toEqual(['yellow']);
  });

  it('wins after round 10 with confetti and the win sound once', async () => {
    queue = Array(10).fill('green');
    render(<App />);
    await click('התחל משחק');
    for (let r = 1; r <= 10; r++) {
      await advance(1000 + 850 * r);
      for (let i = 0; i < r; i++) press('green');
      if (r < 10) await advance(1000);
    }
    expect(screen.queryByText('כל הכבוד! ניצחת!')).toBeNull();
    expect(screen.getByText('שלב 10 מתוך 10')).toBeInTheDocument();
    await advance(1000);
    expect(screen.getByText('כל הכבוד! ניצחת!')).toBeInTheDocument();
    expect(audio.playWin).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledTimes(1);
    await click('אישור');
    expect(confetti.reset).toHaveBeenCalled();
  });

  it('pauses when navigating to About and stops sound; no automatic resume on return', async () => {
    queue = ['green'];
    render(<App />);
    await click('התחל משחק');
    await advance(1100);
    expect(playedColors()).toEqual(['green']);
    await click('אודות');
    expect(audio.stopAll).toHaveBeenCalled();
    await advance(10000);
    expect(playedColors()).toEqual(['green']);
    await click('בית');
    expect(screen.getByText('המשחק מושהה')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'משחק חדש' })).toBeInTheDocument();
    await advance(5000);
    expect(playedColors()).toEqual(['green']);
  });

  it('does not show resume/new-game buttons before a game or after it ends', async () => {
    render(<App />);
    expect(screen.queryByRole('button', { name: 'המשך משחק' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'משחק חדש' })).toBeNull();
  });

  it('resume replays the whole sequence of the same round without adding a color', async () => {
    await startAndReachInput();
    press('green');
    await advance(1000);
    await advance(1000 + 850 + 600); // round 2 presented
    press('green'); // partial input in round 2
    await click('אודות');
    await click('בית');
    vi.mocked(audio.playColor).mockClear();
    queue = ['yellow']; // must not be consumed
    await click('המשך משחק');
    expect(screen.getByText('שלב 2 מתוך 10')).toBeInTheDocument();
    await advance(1000 + 850 + 600);
    expect(playedColors()).toEqual(['green', 'red']);
    expect(queue).toEqual(['yellow']);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    // Input restarts from the beginning of the sequence
    press('green');
    press('red');
    expect(screen.getByText('שלב 2 מתוך 10')).toBeInTheDocument();
  });

  it('"משחק חדש" starts round 1 with a new sequence', async () => {
    await startAndReachInput();
    press('green');
    await advance(1000);
    await click('אודות');
    await click('בית');
    queue = ['blue'];
    vi.mocked(audio.playColor).mockClear();
    await click('משחק חדש');
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
    await advance(1000);
    expect(playedColors()).toEqual(['blue']);
  });

  it('pauses on visibilitychange and pagehide, and does not resume when visible again', async () => {
    queue = ['green'];
    render(<App />);
    await click('התחל משחק');
    await advance(500);
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(audio.stopAll).toHaveBeenCalled();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await advance(5000);
    expect(audio.playColor).not.toHaveBeenCalled();
    expect(screen.getByText('המשחק מושהה')).toBeInTheDocument();

    await click('משחק חדש');
    await advance(500);
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(screen.getByText('המשחק מושהה')).toBeInTheDocument();
  });

  it('keeps the result when leaving during the end wait, and shows it silently on return', async () => {
    await startAndReachInput();
    press('red');
    await click('אודות');
    vi.mocked(audio.playColor).mockClear();
    await advance(1000);
    await click('בית');
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(audio.playLose).not.toHaveBeenCalled();
    expect(confetti).not.toHaveBeenCalled();
  });

  it('does not start the game when audio cannot be unlocked, and allows a retry', async () => {
    vi.mocked(audio.unlock).mockResolvedValueOnce(false);
    queue = ['green'];
    render(<App />);
    await click('התחל משחק');
    expect(screen.getByText('לא הצלחנו להפעיל צליל. נסו שוב.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    await advance(3000);
    expect(audio.playColor).not.toHaveBeenCalled();
    await click('התחל משחק');
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
  });

  it('starts from idle after a remount and stores no active game in localStorage', async () => {
    await startAndReachInput();
    expect(localStorage.length).toBe(0);
    document.body.innerHTML = '';
    render(<App />);
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
  });
});
