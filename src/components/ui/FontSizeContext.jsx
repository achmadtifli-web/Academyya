'use client';

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

const SCALE_STEPS = [
  { id: 'normal', label: 'Normal', percent: '100%' },
  { id: 'large', label: 'Besar', percent: '112.5%' },
  { id: 'xlarge', label: 'Ekstra Besar', percent: '125%' },
];

const STORAGE_KEY = 'academyya_font_scale';
const SCALE_EVENT = 'academyya-font-scale-change';

function subscribe(callback) {
  window.addEventListener('storage', callback);
  window.addEventListener(SCALE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(SCALE_EVENT, callback);
  };
}

function getSnapshot() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const idx = Number(raw);
    if (Number.isInteger(idx) && idx >= 0 && idx < SCALE_STEPS.length) {
      return idx;
    }
  } catch {
    // Ignore restricted storage errors.
  }
  return 0;
}

function getServerSnapshot() {
  return 0;
}

const FontSizeContext = createContext({
  scaleIndex: 0,
  currentScale: SCALE_STEPS[0],
  decrease: () => {},
  increase: () => {},
  canDecrease: false,
  canIncrease: true,
});

export function FontSizeProvider({ children }) {
  const scaleIndex = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.style.fontSize = SCALE_STEPS[scaleIndex].percent;
  }, [scaleIndex]);

  const applyScale = (nextIndex) => {
    const clamped = Math.max(0, Math.min(SCALE_STEPS.length - 1, nextIndex));
    try {
      window.localStorage.setItem(STORAGE_KEY, String(clamped));
      window.dispatchEvent(new Event(SCALE_EVENT));
    } catch {
      document.documentElement.style.fontSize = SCALE_STEPS[clamped].percent;
    }
  };

  return (
    <FontSizeContext.Provider
      value={{
        scaleIndex,
        currentScale: SCALE_STEPS[scaleIndex],
        decrease: () => applyScale(scaleIndex - 1),
        increase: () => applyScale(scaleIndex + 1),
        canDecrease: scaleIndex > 0,
        canIncrease: scaleIndex < SCALE_STEPS.length - 1,
      }}
    >
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
