import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { audio } from './game/audio';
import { randomColor } from './game/random';
import { HISTORY_KEY, loadHistory } from './history/historyStorage';
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

const press = (c: ColorId) => fireEvent.pointerDown(screen.getByRole('button', { name: NAMES[c] }));
const click = async (name: string) => {
  fireEvent.click(screen.getByRole('button', { name }));
  await act(async () => {});
};
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

// Starts a game and loses it on the first press; the result is saved at once
async function loseRound1() {
  await click('התחל משחק');
  await advance(1600);
  press('red');
}

async function winGame() {
  await click('התחל משחק');
  for (let r = 1; r <= 10; r++) {
    await advance(1000 + 850 * r);
    for (let i = 0; i < r; i++) press('green');
    if (r < 10) await advance(1000);
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(audio.unlock).mockResolvedValue(true);
  vi.mocked(audio.playColor).mockReturnValue(vi.fn());
  vi.mocked(randomColor).mockReturnValue('green');
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('history', () => {
  it('shows the empty state and no delete button when there are no games', async () => {
    render(<App />);
    await click('אודות');
    expect(screen.getByText('אין עדיין משחקים שמורים.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'מחק היסטוריה' })).toBeNull();
  });

  it('records exactly one result for a loss, as soon as the outcome is decided', async () => {
    render(<App />);
    await loseRound1();
    expect(loadHistory().results).toHaveLength(1);
    await advance(1000);
    await click('אישור');
    await click('אודות');
    expect(loadHistory().results).toHaveLength(1);
    expect(screen.getByText('הפסד')).toBeInTheDocument();
    expect(screen.getByText('אף שלב לא הושלם')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'מחק היסטוריה' })).toBeInTheDocument();
  });

  it('records a win with 10 completed rounds', async () => {
    render(<App />);
    await winGame();
    await advance(1000);
    const [r] = loadHistory().results;
    expect(loadHistory().results).toHaveLength(1);
    expect(r).toMatchObject({ outcome: 'won', completedRounds: 10 });
    await click('אודות');
    expect(screen.getByText('ניצחון')).toBeInTheDocument();
    expect(screen.getByText('10 שלבים שהושלמו')).toBeInTheDocument();
  });

  it('saves once under React Strict Mode', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await loseRound1();
    await advance(1000);
    expect(loadHistory().results).toHaveLength(1);
  });

  it('does not record on pause, navigation or "משחק חדש"', async () => {
    render(<App />);
    await click('התחל משחק');
    await advance(1600);
    press('green');
    await click('אודות');
    await click('בית');
    await click('משחק חדש');
    await advance(3000);
    await click('אודות');
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
    expect(screen.getByText('אין עדיין משחקים שמורים.')).toBeInTheDocument();
  });

  it('does not record an active game that is refreshed', async () => {
    const { unmount } = render(<App />);
    await click('התחל משחק');
    await advance(1600);
    unmount();
    render(<App />);
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
  });

  it('keeps at most 10 results, newest first, and they survive a reload', async () => {
    const { unmount } = render(<App />);
    for (let i = 0; i < 11; i++) {
      await loseRound1();
      await advance(1000);
      await click('אישור');
    }
    expect(loadHistory().results).toHaveLength(10);
    unmount();
    render(<App />);
    await click('אודות');
    expect(screen.getAllByText('הפסד')).toHaveLength(10);
  });

  it('cancel keeps the history and delete (after confirmation) clears it', async () => {
    render(<App />);
    await loseRound1();
    await advance(1000);
    await click('אישור');
    await click('אודות');

    await click('מחק היסטוריה');
    expect(screen.getByText('למחוק את ההיסטוריה?')).toBeInTheDocument();
    await click('ביטול');
    expect(screen.queryByText('למחוק את ההיסטוריה?')).toBeNull();
    expect(loadHistory().results).toHaveLength(1);
    expect(screen.getByText('הפסד')).toBeInTheDocument();

    await click('מחק היסטוריה');
    await click('מחק');
    expect(screen.queryByText('למחוק את ההיסטוריה?')).toBeNull();
    expect(loadHistory().results).toHaveLength(0);
    expect(screen.getByText('אין עדיין משחקים שמורים.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'מחק היסטוריה' })).toBeNull();
  });

  it('still lets the game finish and shows a message when saving fails', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<App />);
    await loseRound1();
    await advance(1000);
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.getByText('לא הצלחנו לשמור את התוצאה בהיסטוריה.')).toBeInTheDocument();
    await click('אישור');
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
  });

  it('shows a message and keeps the list when deleting fails', async () => {
    render(<App />);
    await loseRound1();
    await advance(1000);
    await click('אישור');
    await click('אודות');
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    await click('מחק היסטוריה');
    await click('מחק');
    expect(screen.getByText('לא הצלחנו למחוק את ההיסטוריה. נסו שוב.')).toBeInTheDocument();
    expect(screen.getByText('הפסד')).toBeInTheDocument();
  });

  it('shows a message when stored history cannot be read, and the game still works', async () => {
    localStorage.setItem(HISTORY_KEY, '{broken');
    render(<App />);
    await click('אודות');
    expect(screen.getByText('לא ניתן לקרוא את ההיסטוריה השמורה במכשיר.')).toBeInTheDocument();
    await click('בית');
    await click('התחל משחק');
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
  });
});
