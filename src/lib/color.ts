import type { RgbColor } from '@/types/edits';

/** Convert a 0..1 RGB color to a `#rrggbb` hex string for <input type="color">. */
export function rgbToHex({ r, g, b }: RgbColor): string {
  const toByte = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

/** Convert a `#rrggbb` hex string to a 0..1 RGB color. */
export function hexToRgb(hex: string): RgbColor {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  return { r, g, b };
}
