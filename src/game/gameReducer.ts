import type { ColorId } from './colors';
import { MAX_ROUNDS } from './config';

export type Status =
  | 'idle'
  | 'presenting'
  | 'awaitingInput'
  | 'advancing'
  | 'finishing'
  | 'paused'
  | 'won'
  | 'lost';

export interface GameState {
  status: Status;
  sequence: ColorId[];
  round: number;
  inputIndex: number;
  completedRounds: number;
  gameId: number;
  // Bumped on every (re)start of a presentation so stale playback callbacks are ignored
  presentationId: number;
  outcome: 'won' | 'lost' | null;
  // True when the end message is shown without sound/confetti (user was away)
  silent: boolean;
}

export type GameAction =
  | { type: 'start'; firstColor: ColorId }
  | { type: 'presentationDone' }
  | { type: 'press'; color: ColorId; nextColor: ColorId }
  | { type: 'advanceDone' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'newGame'; firstColor: ColorId }
  | { type: 'finishDone'; silent: boolean }
  | { type: 'dismiss' };

export const initialGameState: GameState = {
  status: 'idle',
  sequence: [],
  round: 1,
  inputIndex: 0,
  completedRounds: 0,
  gameId: 0,
  presentationId: 0,
  outcome: null,
  silent: false,
};

function freshGame(state: GameState, firstColor: ColorId): GameState {
  return {
    ...initialGameState,
    status: 'presenting',
    sequence: [firstColor],
    gameId: state.gameId + 1,
    presentationId: state.presentationId + 1,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      return state.status === 'idle' ? freshGame(state, action.firstColor) : state;

    case 'newGame':
      return state.status === 'paused' ? freshGame(state, action.firstColor) : state;

    case 'presentationDone':
      return state.status === 'presenting'
        ? { ...state, status: 'awaitingInput', inputIndex: 0 }
        : state;

    case 'press': {
      if (state.status !== 'awaitingInput') return state;
      if (action.color !== state.sequence[state.inputIndex]) {
        return { ...state, status: 'finishing', outcome: 'lost' };
      }
      if (state.inputIndex < state.sequence.length - 1) {
        return { ...state, inputIndex: state.inputIndex + 1 };
      }
      if (state.round >= MAX_ROUNDS) {
        return { ...state, status: 'finishing', outcome: 'won', completedRounds: state.round };
      }
      return {
        ...state,
        status: 'advancing',
        round: state.round + 1,
        completedRounds: state.round,
        sequence: [...state.sequence, action.nextColor],
        inputIndex: 0,
      };
    }

    case 'advanceDone':
      return state.status === 'advancing'
        ? { ...state, status: 'presenting', presentationId: state.presentationId + 1 }
        : state;

    case 'pause':
      return state.status === 'presenting' ||
        state.status === 'awaitingInput' ||
        state.status === 'advancing'
        ? { ...state, status: 'paused', inputIndex: 0, presentationId: state.presentationId + 1 }
        : state;

    case 'resume':
      return state.status === 'paused'
        ? { ...state, status: 'presenting', inputIndex: 0, presentationId: state.presentationId + 1 }
        : state;

    case 'finishDone':
      return state.status === 'finishing' && state.outcome
        ? { ...state, status: state.outcome, silent: action.silent }
        : state;

    case 'dismiss':
      return state.status === 'won' || state.status === 'lost'
        ? { ...initialGameState, gameId: state.gameId, presentationId: state.presentationId }
        : state;
  }
}
