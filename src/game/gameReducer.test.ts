import { gameReducer, initialGameState, type GameAction, type GameState } from './gameReducer';

function run(actions: GameAction[], from: GameState = initialGameState) {
  return actions.reduce(gameReducer, from);
}

const startGreen: GameAction = { type: 'start', firstColor: 'green' };
const ready = (s: GameState) => gameReducer(s, { type: 'presentationDone' });

describe('gameReducer', () => {
  it('starts a game with a single-color sequence at round 1', () => {
    const s = run([startGreen]);
    expect(s.status).toBe('presenting');
    expect(s.sequence).toEqual(['green']);
    expect(s.round).toBe(1);
    expect(s.completedRounds).toBe(0);
  });

  it('grows the sequence by one color per round and keeps the previous one as a prefix', () => {
    let s = ready(run([startGreen]));
    s = gameReducer(s, { type: 'press', color: 'green', nextColor: 'red' });
    expect(s.status).toBe('advancing');
    expect(s.round).toBe(2);
    expect(s.completedRounds).toBe(1);
    expect(s.sequence).toEqual(['green', 'red']);
    s = ready(gameReducer(s, { type: 'advanceDone' }));
    s = gameReducer(s, { type: 'press', color: 'green', nextColor: 'blue' });
    expect(s.inputIndex).toBe(1);
    s = gameReducer(s, { type: 'press', color: 'red', nextColor: 'red' });
    expect(s.sequence).toEqual(['green', 'red', 'red']);
    expect(s.sequence.length).toBe(s.round);
  });

  it('loses on the first wrong press in round 1 with 0 completed rounds', () => {
    const s = gameReducer(ready(run([startGreen])), {
      type: 'press',
      color: 'red',
      nextColor: 'blue',
    });
    expect(s.status).toBe('finishing');
    expect(s.outcome).toBe('lost');
    expect(s.completedRounds).toBe(0);
    expect(gameReducer(s, { type: 'finishDone', silent: false }).status).toBe('lost');
  });

  it('loses in a later round with completed rounds = round - 1', () => {
    let s = ready(run([startGreen]));
    s = gameReducer(s, { type: 'press', color: 'green', nextColor: 'red' });
    s = ready(gameReducer(s, { type: 'advanceDone' }));
    s = gameReducer(s, { type: 'press', color: 'green', nextColor: 'red' });
    s = gameReducer(s, { type: 'press', color: 'blue', nextColor: 'red' });
    expect(s.outcome).toBe('lost');
    expect(s.round).toBe(2);
    expect(s.completedRounds).toBe(1);
  });

  it('wins after completing round 10 and never reaches round 11', () => {
    let s = ready(run([startGreen]));
    for (let r = 1; r <= 10; r++) {
      for (let i = 0; i < r; i++) {
        s = gameReducer(s, { type: 'press', color: 'green', nextColor: 'green' });
      }
      if (r < 10) s = ready(gameReducer(s, { type: 'advanceDone' }));
    }
    expect(s.status).toBe('finishing');
    expect(s.outcome).toBe('won');
    expect(s.completedRounds).toBe(10);
    expect(s.round).toBe(10);
    expect(s.sequence.length).toBe(10);
    expect(gameReducer(s, { type: 'finishDone', silent: false }).status).toBe('won');
  });

  it('ignores presses outside awaitingInput', () => {
    const press: GameAction = { type: 'press', color: 'green', nextColor: 'red' };
    const presenting = run([startGreen]);
    expect(gameReducer(presenting, press)).toBe(presenting);
    const paused = gameReducer(ready(presenting), { type: 'pause' });
    expect(gameReducer(paused, press)).toBe(paused);
    let adv = ready(presenting);
    adv = gameReducer(adv, press);
    expect(adv.status).toBe('advancing');
    expect(gameReducer(adv, press)).toBe(adv);
    const lost = gameReducer(ready(presenting), { ...press, color: 'red' });
    expect(gameReducer(lost, press)).toBe(lost);
  });

  it('pauses only active states and drops partial input', () => {
    let s = ready(run([startGreen]));
    s = gameReducer(s, { type: 'press', color: 'green', nextColor: 'red' });
    s = ready(gameReducer(s, { type: 'advanceDone' }));
    s = gameReducer(s, { type: 'press', color: 'green', nextColor: 'red' });
    expect(s.inputIndex).toBe(1);
    const id = s.presentationId;
    const paused = gameReducer(s, { type: 'pause' });
    expect(paused.status).toBe('paused');
    expect(paused.inputIndex).toBe(0);
    expect(paused.presentationId).toBeGreaterThan(id);
    expect(gameReducer(initialGameState, { type: 'pause' })).toBe(initialGameState);
    const finishing = gameReducer(ready(run([startGreen])), {
      type: 'press',
      color: 'red',
      nextColor: 'red',
    });
    expect(gameReducer(finishing, { type: 'pause' })).toBe(finishing);
  });

  it('resume keeps round and sequence; newGame restarts from round 1', () => {
    let s = ready(run([startGreen]));
    s = gameReducer(s, { type: 'press', color: 'green', nextColor: 'red' });
    const paused = gameReducer(s, { type: 'pause' });
    const resumed = gameReducer(paused, { type: 'resume' });
    expect(resumed.status).toBe('presenting');
    expect(resumed.round).toBe(2);
    expect(resumed.sequence).toEqual(['green', 'red']);
    const fresh = gameReducer(paused, { type: 'newGame', firstColor: 'blue' });
    expect(fresh.round).toBe(1);
    expect(fresh.sequence).toEqual(['blue']);
    expect(fresh.gameId).toBeGreaterThan(paused.gameId);
    expect(gameReducer(initialGameState, { type: 'newGame', firstColor: 'blue' })).toBe(
      initialGameState,
    );
    expect(gameReducer(initialGameState, { type: 'resume' })).toBe(initialGameState);
  });

  it('dismiss returns to idle and the next game gets a new sequence and id', () => {
    let s = gameReducer(ready(run([startGreen])), { type: 'press', color: 'red', nextColor: 'red' });
    s = gameReducer(s, { type: 'finishDone', silent: false });
    const gameId = s.gameId;
    const idle = gameReducer(s, { type: 'dismiss' });
    expect(idle.status).toBe('idle');
    expect(idle.sequence).toEqual([]);
    const next = gameReducer(idle, { type: 'start', firstColor: 'yellow' });
    expect(next.sequence).toEqual(['yellow']);
    expect(next.gameId).toBeGreaterThan(gameId);
  });
});
