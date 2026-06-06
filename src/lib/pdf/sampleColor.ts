import type { RgbColor } from '@/types/edits';
import type { TextRun } from '@/lib/pdf/textRuns';

/**
 * Approximate the color of a text run by reading the rendered page canvas and
 * taking the darkest opaque pixel within the run's box. Text is almost always
 * darker than its background, so the darkest pixel is the ink color. Returns
 * null if the canvas is unavailable or the region looks like blank background.
 */
export function sampleRunColor(
  pageIndex: number,
  run: TextRun,
  scale: number,
): RgbColor | null {
  const wrapper = document.querySelector(
    `[data-page-number="${pageIndex + 1}"]`,
  );
  const canvas = wrapper?.querySelector('canvas');
  if (!(canvas instanceof HTMLCanvasElement) || canvas.clientWidth === 0) {
    return null;
  }
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Map display-space (points at scale 1) to device pixels on the canvas.
  const sx = canvas.width / canvas.clientWidth;
  const sy = canvas.height / canvas.clientHeight;
  const x0 = Math.max(0, Math.floor(run.x * scale * sx));
  const y0 = Math.max(0, Math.floor(run.y * scale * sy));
  const w = Math.min(canvas.width - x0, Math.ceil(run.width * scale * sx));
  const h = Math.min(canvas.height - y0, Math.ceil(run.height * scale * sy));
  if (w <= 0 || h <= 0) return null;

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(x0, y0, w, h).data;
  } catch {
    return null;
  }

  let best: RgbColor | null = null;
  let bestLum = Infinity;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue; // skip transparent
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < bestLum) {
      bestLum = lum;
      best = { r: r / 255, g: g / 255, b: b / 255 };
    }
  }

  // If even the darkest pixel is very light, the box was effectively blank.
  if (!best || bestLum > 230) return null;
  return best;
}
