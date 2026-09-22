import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import 'morphui/themes/all.css';
import './playground.css';

import gsap from 'gsap';

import { App } from './App.js';

// Dev-only handle so the transition can be scrubbed and measured from the
// console, or from an automated check, without waiting on real time.
if (import.meta.env.DEV) {
  (window as unknown as { __gsap: typeof gsap }).__gsap = gsap;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
