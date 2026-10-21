import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/heebo/hebrew-400.css';
import '@fontsource/heebo/hebrew-600.css';
import '@fontsource/heebo/hebrew-700.css';
import '@fontsource/heebo/latin-400.css';
import '@fontsource/heebo/latin-600.css';
import '@fontsource/heebo/latin-700.css';
import './styles/global.css';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { setUpdateAvailable } from './pwa/updateState';

// No skipWaiting: the new version only activates when the player taps "update"
const updateSW = registerSW({
  onNeedRefresh: () => setUpdateAvailable(() => void updateSW(true)),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
