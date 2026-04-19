import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(<App />);

function loadFonts(): void {
  void import('./styles/fonts.css');
}

if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(() => loadFonts(), { timeout: 1500 });
} else {
  setTimeout(loadFonts, 0);
}
  