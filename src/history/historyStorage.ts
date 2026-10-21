export const HISTORY_KEY = 'simon.history.v1';
export const MAX_HISTORY = 10;

export interface GameResult {
  id: string;
  // ISO 8601 timestamp; formatted for display only
  finishedAt: string;
  completedRounds: number;
  outcome: 'won' | 'lost';
}

interface HistoryData {
  schemaVersion: 1;
  results: GameResult[];
}

export interface LoadResult {
  results: GameResult[];
  // True when storage is unavailable or the stored data could not be read
  error: boolean;
}

function isResult(value: unknown): value is GameResult {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.finishedAt === 'string' &&
    !Number.isNaN(Date.parse(r.finishedAt)) &&
    typeof r.completedRounds === 'number' &&
    Number.isInteger(r.completedRounds) &&
    r.completedRounds >= 0 &&
    r.completedRounds <= 10 &&
    (r.outcome === 'won' || r.outcome === 'lost')
  );
}

export function loadHistory(): LoadResult {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (raw === null) return { results: [], error: false };
    const data: unknown = JSON.parse(raw);
    const list = (data as Partial<HistoryData> | null)?.results;
    if (!Array.isArray(list)) return { results: [], error: true };
    return { results: list.filter(isResult).slice(0, MAX_HISTORY), error: false };
  } catch {
    return { results: [], error: true };
  }
}

function write(results: GameResult[]): boolean {
  try {
    const data: HistoryData = { schemaVersion: 1, results };
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// Adds the newest result first and keeps only the latest MAX_HISTORY
export function addResult(result: GameResult): { ok: boolean; results: GameResult[] } {
  const { results: existing } = loadHistory();
  const results = [result, ...existing].slice(0, MAX_HISTORY);
  return { ok: write(results), results };
}

export function clearHistory(): boolean {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
}

export function createResult(
  outcome: 'won' | 'lost',
  completedRounds: number,
  now: Date = new Date(),
): GameResult {
  return {
    id: `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    finishedAt: now.toISOString(),
    completedRounds,
    outcome,
  };
}
