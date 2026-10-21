import { COLORS } from '../game/colors';

// Four semantic buttons in a 2x2 grid; not interactive yet in milestone 1
export function SimonBoard() {
  return (
    <div className="board">
      {COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`quad quad-${c.id}`}
          style={{ gridArea: c.gridArea }}
          aria-label={c.label}
          disabled
        />
      ))}
      <div className="board-center" aria-hidden="true" />
    </div>
  );
}
