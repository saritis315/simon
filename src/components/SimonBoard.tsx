import { COLORS, type ColorId } from '../game/colors';

interface Props {
  litColor: ColorId | null;
  // Dims all quadrants except the lit one (sequence playback, paused)
  dimmed: boolean;
  // Input is only accepted on the player's turn
  disabled: boolean;
  onPressStart: (color: ColorId) => void;
  onPressEnd: () => void;
}

// Four semantic buttons in a 2x2 grid; judged on pointerdown for instant feedback
export function SimonBoard({ litColor, dimmed, disabled, onPressStart, onPressEnd }: Props) {
  return (
    <div className={`board${dimmed ? ' dim' : ''}`}>
      {COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`quad quad-${c.id}${litColor === c.id ? ' lit' : ''}`}
          style={{ gridArea: c.gridArea }}
          aria-label={c.label}
          disabled={disabled}
          onPointerDown={() => onPressStart(c.id)}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
              e.preventDefault();
              onPressStart(c.id);
            }
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onPressEnd();
          }}
        />
      ))}
      <div className="board-center" aria-hidden="true" />
    </div>
  );
}
