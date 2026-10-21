import {
  HISTORY_KEY,
  MAX_HISTORY,
  addResult,
  clearHistory,
  createResult,
  loadHistory,
} from './historyStorage';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const make = (n: number, outcome: 'won' | 'lost' = 'lost') =>
  createResult(outcome, n, new Date(2026, 0, 1, 10, n));

describe('historyStorage', () => {
  it('starts empty without an error', () => {
    expect(loadHistory()).toEqual({ results: [], error: false });
  });

  it('stores a result and reads it back after a reload', () => {
    const r = make(3);
    expect(addResult(r).ok).toBe(true);
    expect(loadHistory().results).toEqual([r]);
  });

  it('keeps newest first', () => {
    const a = make(1);
    const b = make(2);
    addResult(a);
    addResult(b);
    expect(loadHistory().results.map((x) => x.id)).toEqual([b.id, a.id]);
  });

  it('keeps at most 10 and drops the oldest on the 11th game', () => {
    const all = Array.from({ length: 11 }, (_, i) => make(i));
    all.forEach((r) => addResult(r));
    const saved = loadHistory().results;
    expect(saved).toHaveLength(MAX_HISTORY);
    expect(saved[0].id).toBe(all[10].id);
    expect(saved.some((r) => r.id === all[0].id)).toBe(false);
  });

  it('clears the history', () => {
    addResult(make(1));
    expect(clearHistory()).toBe(true);
    expect(loadHistory()).toEqual({ results: [], error: false });
  });

  it('reports an error for corrupt JSON and recovers on the next save', () => {
    localStorage.setItem(HISTORY_KEY, '{not json');
    expect(loadHistory()).toEqual({ results: [], error: true });
    const r = make(2);
    expect(addResult(r).ok).toBe(true);
    expect(loadHistory()).toEqual({ results: [r], error: false });
  });

  it('filters out invalid records', () => {
    const good = make(4, 'won');
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({
        schemaVersion: 1,
        results: [good, { id: 1 }, null, { ...good, outcome: 'draw' }, { ...good, completedRounds: 11 }],
      }),
    );
    expect(loadHistory().results).toEqual([good]);
  });

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadHistory().error).toBe(true);
    expect(addResult(make(1)).ok).toBe(false);
    expect(clearHistory()).toBe(false);
  });
});
