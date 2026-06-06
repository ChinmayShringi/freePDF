import type { PDFPageProxy } from '@/types/pdf';

/** Clamp devicePixelRatio so huge-DPR displays do not blow up canvas memory. */
const MAX_DPR = 2;

export interface RenderResult {
  /** CSS width in pixels (PDF points * scale). */
  cssWidth: number;
  /** CSS height in pixels (PDF points * scale). */
  cssHeight: number;
}

/**
 * Render a PDF page into a canvas at the given zoom scale, accounting for
 * device pixel ratio so the output is crisp on high-DPR screens.
 *
 * The canvas backing store is sized at `cssSize * dpr` while the CSS size is
 * kept at `cssSize`, which is the standard pattern for sharp canvas rendering.
 * Returns the CSS dimensions so the overlay layer can match them exactly.
 */
export async function renderPageToCanvas(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number,
): Promise<RenderResult> {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const viewport = page.getViewport({ scale: scale * dpr });
  const cssViewport = page.getViewport({ scale });

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not acquire 2D canvas context');
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(cssViewport.width)}px`;
  canvas.style.height = `${Math.floor(cssViewport.height)}px`;

  await page.render({ canvas, canvasContext: context, viewport }).promise;

  return {
    cssWidth: Math.floor(cssViewport.width),
    cssHeight: Math.floor(cssViewport.height),
  };
}
