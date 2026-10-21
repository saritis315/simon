import { useCallback, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { HistoryCard } from '../components/HistoryCard';
import type { History } from '../history/useHistory';

export function AboutScreen({ history }: { history: History }) {
  const [confirming, setConfirming] = useState(false);
  const { results, loadError, deleteError, deleteAll } = history;

  const cancel = useCallback(() => setConfirming(false), []);
  const confirm = useCallback(() => {
    deleteAll();
    setConfirming(false);
  }, [deleteAll]);

  return (
    <main className="screen about">
      <header className="screen-header">
        <h1>אודות</h1>
      </header>
      <section className="card">
        <h2>על המשחק</h2>
        <p>זכור את רצף הצבעים שמוצג. לחץ על הצבעים באותו סדר. נסה להגיע עד שלב 10!</p>
        <p>הצלילים דורשים מכשיר שאינו במצב שקט.</p>
      </section>
      <section className="history">
        <h2>10 המשחקים האחרונים</h2>
        {loadError && (
          <p className="error-text" role="alert">
            לא ניתן לקרוא את ההיסטוריה השמורה במכשיר.
          </p>
        )}
        {deleteError && (
          <p className="error-text" role="alert">
            לא הצלחנו למחוק את ההיסטוריה. נסו שוב.
          </p>
        )}
        {results.length === 0 ? (
          <p className="empty">אין עדיין משחקים שמורים.</p>
        ) : (
          <>
            <ul className="history-list">
              {results.map((r) => (
                <HistoryCard key={r.id} result={r} />
              ))}
            </ul>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirming(true)}>
              מחק היסטוריה
            </button>
          </>
        )}
      </section>
      {confirming && <ConfirmDialog onCancel={cancel} onConfirm={confirm} />}
    </main>
  );
}
