import { SimonBoard } from '../components/SimonBoard';
import { ResultDialog } from '../components/ResultDialog';
import { UpdateBanner } from '../components/UpdateBanner';
import { MAX_ROUNDS } from '../game/config';
import type { Game } from '../game/useGame';

interface Props {
  game: Game;
  saveError: boolean;
}

export function HomeScreen({ game, saveError }: Props) {
  const { status } = game;
  const finished = status === 'won' || status === 'lost';

  return (
    <main className="screen home">
      <header className="screen-header">
        <h1>סיימון</h1>
      </header>
      <h3 className="round-indicator">
        שלב {game.displayedRound} מתוך {MAX_ROUNDS}
      </h3>
      <div className="status-line" aria-live="polite">
        {game.statusText}
      </div>
      <div className="board-wrap">
        <SimonBoard
          litColor={game.litColor}
          dimmed={status === 'presenting' || status === 'paused'}
          disabled={status !== 'awaitingInput'}
          onPressStart={game.pressStart}
          onPressEnd={game.pressEnd}
        />
        {finished && game.outcome && (
          <ResultDialog outcome={game.outcome} completedRounds={game.completedRounds} />
        )}
      </div>
      <p className="hint">{game.hint}</p>
      {finished && saveError && (
        <p className="error-text" role="alert">
          לא הצלחנו לשמור את התוצאה בהיסטוריה.
        </p>
      )}
      <div className="actions">
        {status === 'idle' && (
          <button type="button" className="btn btn-primary" onClick={game.startGame}>
            התחל משחק
          </button>
        )}
        {status === 'paused' && (
          <>
            <button type="button" className="btn btn-primary" onClick={game.resumeGame}>
              המשך משחק
            </button>
            <button type="button" className="btn btn-secondary" onClick={game.newGame}>
              משחק חדש
            </button>
          </>
        )}
        {finished && (
          <button type="button" className="btn btn-primary" onClick={game.dismiss}>
            אישור
          </button>
        )}
      </div>
      {/* Updates are only offered before a game starts, never during or while paused */}
      {status === 'idle' && <UpdateBanner />}
    </main>
  );
}
