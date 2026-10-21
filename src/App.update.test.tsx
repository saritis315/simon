import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { audio } from './game/audio';
import { randomColor } from './game/random';
import { resetUpdateState, setUpdateAvailable } from './pwa/updateState';

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

const TEXT = 'יש גרסה חדשה של המשחק';
const apply = vi.fn();

const click = async (name: string) => {
  fireEvent.click(screen.getByRole('button', { name }));
  await act(async () => {});
};
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(audio.unlock).mockResolvedValue(true);
  vi.mocked(audio.playColor).mockReturnValue(vi.fn());
  vi.mocked(randomColor).mockReturnValue('green');
  apply.mockClear();
});

afterEach(() => {
  act(() => resetUpdateState());
  vi.useRealTimers();
});

describe('update banner', () => {
  it('is hidden when no update is available', () => {
    render(<App />);
    expect(screen.queryByText(TEXT)).toBeNull();
  });

  it('shows on the idle home screen and applies the update on tap', async () => {
    render(<App />);
    act(() => setUpdateAvailable(apply));
    expect(screen.getByText(TEXT)).toBeInTheDocument();
    await click('עדכן');
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('never shows during an active game', async () => {
    render(<App />);
    act(() => setUpdateAvailable(apply));
    await click('התחל משחק');
    expect(screen.queryByText(TEXT)).toBeNull();
    await advance(1600);
    expect(screen.queryByText(TEXT)).toBeNull();
  });

  it('never shows while paused, even back on the home screen', async () => {
    render(<App />);
    act(() => setUpdateAvailable(apply));
    await click('התחל משחק');
    await click('אודות');
    expect(screen.queryByText(TEXT)).toBeNull();
    await click('בית');
    expect(screen.getByText('המשחק מושהה')).toBeInTheDocument();
    expect(screen.queryByText(TEXT)).toBeNull();
  });

  it('never shows on the about screen', async () => {
    render(<App />);
    act(() => setUpdateAvailable(apply));
    await click('אודות');
    expect(screen.queryByText(TEXT)).toBeNull();
  });

  it('never shows on the result message, and returns after confirming it', async () => {
    render(<App />);
    act(() => setUpdateAvailable(apply));
    await click('התחל משחק');
    await advance(1600);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'אדום' })); // wrong
    await advance(1300);
    expect(screen.getByText('נפסלת!')).toBeInTheDocument();
    expect(screen.queryByText(TEXT)).toBeNull();
    await click('אישור');
    expect(screen.getByText(TEXT)).toBeInTheDocument();
  });
});
