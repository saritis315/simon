import { COLORS, type ColorId } from './colors';

// Game randomness only; no need for a cryptographic RNG
export function randomColor(): ColorId {
  return COLORS[Math.floor(Math.random() * COLORS.length)].id;
}
