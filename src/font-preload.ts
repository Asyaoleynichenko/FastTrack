import knockoutFontUrl from './assets/fonts/Knockout-Bold.ttf?url';

/** Runs before `index.css` so the browser can start fetching Knockout alongside Inter. */
if (typeof document !== 'undefined' && !document.querySelector('link[data-preload-knockout]')) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/ttf';
  link.href = knockoutFontUrl;
  link.crossOrigin = 'anonymous';
  link.setAttribute('data-preload-knockout', '');
  document.head.appendChild(link);
}
