import { useState } from 'react';
import { NavBar, type Screen } from './components/NavBar';
import { RotateNotice } from './components/RotateNotice';
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';
import { useGame } from './game/useGame';

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  // Game state lives here so switching screens never tears it down; leaving Home pauses it
  const game = useGame(screen);

  return (
    <div className="app">
      {screen === 'home' ? <HomeScreen game={game} /> : <AboutScreen />}
      <NavBar screen={screen} onChange={setScreen} />
      <RotateNotice />
    </div>
  );
}
