export type Screen = 'home' | 'about';

interface Props {
  screen: Screen;
  onChange: (screen: Screen) => void;
}

const ITEMS: { id: Screen; label: string }[] = [
  { id: 'home', label: 'בית' },
  { id: 'about', label: 'אודות' },
];

export function NavBar({ screen, onChange }: Props) {
  return (
    <nav className="navbar" aria-label="ניווט ראשי">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item${screen === item.id ? ' active' : ''}`}
          aria-current={screen === item.id ? 'page' : undefined}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
