import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('App shell', () => {
  it('shows the home screen first', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'סיימון' })).toBeInTheDocument();
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    for (const name of ['ירוק', 'אדום', 'צהוב', 'כחול']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('navigates between home and about', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'אודות' }));
    expect(screen.getByRole('heading', { name: 'על המשחק' })).toBeInTheDocument();
    expect(screen.getByText('אין עדיין משחקים שמורים.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'מחק היסטוריה' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'בית' }));
    expect(screen.getByText('שלב 1 מתוך 10')).toBeInTheDocument();
  });
});
