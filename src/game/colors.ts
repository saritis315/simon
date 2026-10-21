export type ColorId = 'green' | 'red' | 'yellow' | 'blue';

export interface SimonColor {
  id: ColorId;
  label: string; // Hebrew accessible name
  hex: string;
  // Spatial position on the board (not mirrored by RTL)
  gridArea: string;
}

export const COLORS: SimonColor[] = [
  { id: 'green', label: 'ירוק', hex: '#00D26A', gridArea: '1 / 1' },
  { id: 'red', label: 'אדום', hex: '#FF3B30', gridArea: '1 / 2' },
  { id: 'yellow', label: 'צהוב', hex: '#FFD600', gridArea: '2 / 1' },
  { id: 'blue', label: 'כחול', hex: '#00A3FF', gridArea: '2 / 2' },
];
