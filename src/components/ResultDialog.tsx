interface Props {
  outcome: 'won' | 'lost';
  completedRounds: number;
}

function roundsText(n: number) {
  if (n === 1) return 'שלב אחד שהושלם';
  return `${n} שלבים שהושלמו`;
}

// End-of-game message shown over the board; the confirm button lives below the board
export function ResultDialog({ outcome, completedRounds }: Props) {
  return (
    <div className={`result result-${outcome}`} role="status">
      {outcome === 'won' ? (
        <h2>כל הכבוד! ניצחת!</h2>
      ) : (
        <>
          <h2>נפסלת!</h2>
          <p>{roundsText(completedRounds)}</p>
        </>
      )}
    </div>
  );
}
