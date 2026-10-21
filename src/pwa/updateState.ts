import { useSyncExternalStore } from 'react';

// Tiny store: main.tsx reports a waiting service worker, the home screen reads it
let available = false;
let applyUpdate: (() => void) | null = null;
const listeners = new Set<() => void>();

export function setUpdateAvailable(apply: () => void) {
  available = true;
  applyUpdate = apply;
  listeners.forEach((l) => l());
}

export function resetUpdateState() {
  available = false;
  applyUpdate = null;
  listeners.forEach((l) => l());
}

export function runUpdate() {
  applyUpdate?.();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useUpdateAvailable() {
  return useSyncExternalStore(subscribe, () => available);
}
