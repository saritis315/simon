import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { ColorId } from './colors';
import { FINISH_DELAY_MS, PRESS_MIN_MS, ROUND_DONE_MS } from './config';
import { gameReducer, initialGameState } from './gameReducer';
import { audio } from './audio';
import { randomColor } from './random';
import { after, presentSequence } from './sequenceController';

type ScreenId = 'home' | 'about';

const AUDIO_ERROR = 'לא הצלחנו להפעיל צליל. נסו שוב.';

export function useGame(screen: ScreenId) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [litColor, setLitColor] = useState<ColorId | null>(null);
  const [audioError, setAudioError] = useState(false);

  const screenRef = useRef(screen);
  screenRef.current = screen;
  const busyRef = useRef(false);
  // Player press in progress: sound stop function, min-duration timer, and start time
  const pressRef = useRef<{ stop: () => void; startedAt: number; timer: number | null } | null>(
    null,
  );

  const clearPress = useCallback(() => {
    const p = pressRef.current;
    if (!p) return;
    if (p.timer !== null) window.clearTimeout(p.timer);
    p.stop();
    pressRef.current = null;
    setLitColor(null);
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: 'pause' });
    audio.stopAll();
    clearPress();
  }, [clearPress]);

  // Background / screen-lock handling; coming back never resumes automatically
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', pause);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', pause);
    };
  }, [pause]);

  // Navigating to About pauses the game
  useEffect(() => {
    if (screen === 'about') pause();
  }, [screen, pause]);

  // Sequence presentation (lead-in, lights and sounds)
  useEffect(() => {
    if (state.status !== 'presenting') return;
    return presentSequence(state.sequence, {
      light: setLitColor,
      playSound: (c) => audio.playColor(c),
      done: () => dispatch({ type: 'presentationDone' }),
    });
    // presentationId changes on every new presentation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.presentationId]);

  // Wait between rounds; the completed round stays on screen
  useEffect(() => {
    if (state.status !== 'advancing') return;
    return after(ROUND_DONE_MS, () => dispatch({ type: 'advanceDone' }));
  }, [state.status, state.presentationId]);

  // Wait before the end message; the result is already decided
  useEffect(() => {
    if (state.status !== 'finishing') return;
    return after(FINISH_DELAY_MS, () => {
      const silent = screenRef.current !== 'home' || document.hidden;
      if (!silent) {
        clearPress();
        if (state.outcome === 'won') {
          audio.playWin();
          confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 }, disableForReducedMotion: true });
        } else {
          audio.playLose();
        }
      }
      dispatch({ type: 'finishDone', silent });
    });
  }, [state.status, state.gameId, state.outcome, clearPress]);

  // Clear confetti when leaving the won state
  useEffect(() => {
    if (state.status !== 'won') return;
    return () => {
      confetti.reset();
    };
  }, [state.status]);

  const unlockThen = useCallback(async (action: () => void) => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const ok = await audio.unlock();
      setAudioError(!ok);
      if (ok) action();
    } finally {
      busyRef.current = false;
    }
  }, []);

  const startGame = useCallback(
    () => unlockThen(() => dispatch({ type: 'start', firstColor: randomColor() })),
    [unlockThen],
  );
  const resumeGame = useCallback(
    () => unlockThen(() => dispatch({ type: 'resume' })),
    [unlockThen],
  );
  const newGame = useCallback(
    () => unlockThen(() => dispatch({ type: 'newGame', firstColor: randomColor() })),
    [unlockThen],
  );
  const dismiss = useCallback(() => dispatch({ type: 'dismiss' }), []);

  // Judging, sound and highlight start immediately on press
  const pressStart = useCallback(
    (color: ColorId) => {
      if (state.status !== 'awaitingInput') return;
      // A quick next tap cuts the previous highlight short
      clearPress();
      pressRef.current = { stop: audio.playColor(color), startedAt: Date.now(), timer: null };
      setLitColor(color);
      dispatch({ type: 'press', color, nextColor: randomColor() });
    },
    [state.status, clearPress],
  );

  // Release keeps the highlight for at least PRESS_MIN_MS
  const pressEnd = useCallback(() => {
    const p = pressRef.current;
    if (!p || p.timer !== null) return;
    const remaining = Math.max(0, PRESS_MIN_MS - (Date.now() - p.startedAt));
    p.timer = window.setTimeout(clearPress, remaining);
  }, [clearPress]);

  useEffect(() => {
    window.addEventListener('pointerup', pressEnd);
    window.addEventListener('pointercancel', pressEnd);
    return () => {
      window.removeEventListener('pointerup', pressEnd);
      window.removeEventListener('pointercancel', pressEnd);
    };
  }, [pressEnd]);

  const { status } = state;
  const displayedRound = status === 'advancing' ? state.round - 1 : state.round;

  let statusText = '';
  let hint = '';
  if (audioError) {
    statusText = AUDIO_ERROR;
  } else if (status === 'presenting') {
    statusText = 'המשחק מציג את הרצף';
  } else if (status === 'awaitingInput') {
    statusText = 'התור שלך';
    hint = 'הקש על הצבעים לפי הסדר';
  } else if (status === 'paused') {
    statusText = 'המשחק מושהה';
  }

  return {
    status,
    gameId: state.gameId,
    displayedRound,
    completedRounds: state.completedRounds,
    outcome: state.outcome,
    litColor,
    statusText,
    hint,
    pressStart,
    pressEnd,
    pause,
    startGame,
    resumeGame,
    newGame,
    dismiss,
  };
}

export type Game = ReturnType<typeof useGame>;
