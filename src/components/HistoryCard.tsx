import type { GameResult } from '../history/historyStorage';

const formatter = new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' });

function roundsText(n: number) {
  if (n === 0) return 'אף שלב לא הושלם';
  if (n === 1) return 'שלב אחד שהושלם';
  return `${n} שלבים שהושלמו`;
}

export function HistoryCard({ result }: { result: GameResult }) {
  return (
    <li className={`history-card history-${result.outcome}`}>
      <div className="history-date">{formatter.format(new Date(result.finishedAt))}</div>
      <div className="history-rounds">{roundsText(result.completedRounds)}</div>
      <div className="history-outcome">{result.outcome === 'won' ? 'ניצחון' : 'הפסד'}</div>
    </li>
  );
}
