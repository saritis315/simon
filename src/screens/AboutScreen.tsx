export function AboutScreen() {
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
        <p className="empty">אין עדיין משחקים שמורים.</p>
      </section>
    </main>
  );
}
