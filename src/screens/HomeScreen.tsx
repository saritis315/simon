import { SimonBoard } from '../components/SimonBoard';

export function HomeScreen() {
  return (
    <main className="screen home">
      <header className="screen-header">
        <h1>סיימון</h1>
      </header>
      <h3 className="round-indicator">שלב 1 מתוך 10</h3>
      <div className="status-line" aria-hidden="true" />
      <SimonBoard />
      <div className="actions">
        <button type="button" className="btn btn-primary">
          התחל משחק
        </button>
      </div>
    </main>
  );
}
