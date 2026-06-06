import { Util } from 'pdfjs-dist';
import type { PDFPageProxy } from '@/types/pdf';

/**
 * A run of text extracted from a PDF page, expressed in display space
 * (top-left origin, points at scale 1) so it lines up with overlay edits.
 */
export interface TextRun {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

/**
 * Extract text runs from a page in display space. PDF.js gives each item a
 * transform from text space to PDF user space; composing it with the page
 * viewport transform yields display coordinates (y-down, top-left origin) with
 * rotation already applied, so this works on rotated pages too.
 */
export async function extractTextRuns(page: PDFPageProxy): Promise<TextRun[]> {
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const runs: TextRun[] = [];

  for (const item of content.items) {
    if (!('str' in item)) continue;
    if (!item.str.trim()) continue;
    const tx = Util.transform(viewport.transform, item.transform);
    const fontHeight = Math.hypot(tx[2], tx[3]);
    if (fontHeight === 0) continue;
    // tx[4], tx[5] are the baseline-left origin in display coordinates.
    runs.push({
      text: item.str,
      x: tx[4],
      y: tx[5] - fontHeight,
      width: item.width,
      height: fontHeight,
      fontSize: fontHeight,
    });
  }

  return runs;
}

/**
 * Find the smallest text run whose box contains the given display-space point,
 * or null if none. The smallest is preferred so overlapping runs resolve to the
 * most specific one under the cursor.
 */
export function findRunAt(
  runs: TextRun[],
  x: number,
  y: number,
): TextRun | null {
  let best: TextRun | null = null;
  for (const run of runs) {
    const inside =
      x >= run.x &&
      x <= run.x + run.width &&
      y >= run.y &&
      y <= run.y + run.height;
    if (!inside) continue;
    if (!best || run.width * run.height < best.width * best.height) {
      best = run;
    }
  }
  return best;
}
