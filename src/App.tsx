import { useState } from 'react';
import { NavBar, type Screen } from './components/NavBar';
import { RotateNotice } from './components/RotateNotice';
import { HomeScreen } from './screens/HomeScreen';
import { AboutScreen } from './screens/AboutScreen';

export function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <div className="app">
      {screen === 'home' ? <HomeScreen /> : <AboutScreen />}
      <NavBar screen={screen} onChange={setScreen} />
      <RotateNotice />
    </div>
  );
}
