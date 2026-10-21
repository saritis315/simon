import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addResult,
  clearHistory,
  createResult,
  loadHistory,
  type GameResult,
} from './historyStorage';

interface FinishedGame {
  status: string;
  gameId: number;
  outcome: 'won' | 'lost' | null;
  completedRounds: number;
}

export function useHistory(game: FinishedGame) {
  const [initial] = useState(loadHistory);
  const [results, setResults] = useState<GameResult[]>(initial.results);
  const [loadError, setLoadError] = useState(initial.error);
  const [saveError, setSaveError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // Last game id already recorded; keeps a game from being saved twice (Strict Mode runs effects twice)
  const savedGameId = useRef(0);

  // Record the result the moment the outcome is decided
  useEffect(() => {
    if (game.status !== 'finishing' || !game.outcome) return;
    if (savedGameId.current === game.gameId) return;
    savedGameId.current = game.gameId;
    const saved = addResult(createResult(game.outcome, game.completedRounds));
    setResults(saved.results);
    setSaveError(!saved.ok);
    if (saved.ok) setLoadError(false);
  }, [game.status, game.gameId, game.outcome, game.completedRounds]);

  // A new game clears the previous save warning
  useEffect(() => {
    if (game.status === 'presenting') setSaveError(false);
  }, [game.status, game.gameId]);

  const deleteAll = useCallback((): boolean => {
    const ok = clearHistory();
    if (ok) {
      setResults([]);
      setLoadError(false);
    }
    setDeleteError(!ok);
    return ok;
  }, []);

  return { results, loadError, saveError, deleteError, deleteAll };
}

export type History = ReturnType<typeof useHistory>;
