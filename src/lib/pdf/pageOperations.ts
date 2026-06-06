import { PDFDocument, degrees } from 'pdf-lib';

/**
 * Pure pdf-lib page-structure operations. Each takes PDF bytes and returns new
 * PDF bytes, leaving the input untouched (immutable). These are independent of
 * the overlay/coordinate machinery, which makes them reliable and easy to test.
 */

/** Load bytes into a fresh PDFDocument, copying so the caller's buffer is safe. */
async function load(bytes: Uint8Array): Promise<PDFDocument> {
  return PDFDocument.load(bytes.slice());
}

/**
 * Build a new document containing the given source pages in the given order.
 * This single primitive implements delete (omit indices), reorder (permute),
 * and split (subset). `order` is a list of 0-based page indices from `bytes`.
 */
export async function arrangePages(
  bytes: Uint8Array,
  order: number[],
): Promise<Uint8Array> {
  const src = await load(bytes);
  const pageCount = src.getPageCount();
  const valid = order.filter((i) => Number.isInteger(i) && i >= 0 && i < pageCount);
  if (valid.length === 0) {
    throw new Error('Cannot produce a PDF with zero pages.');
  }
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, valid);
  for (const page of copied) out.addPage(page);
  return out.save();
}

/** Remove the pages at the given 0-based indices. */
export async function deletePages(
  bytes: Uint8Array,
  indices: number[],
): Promise<Uint8Array> {
  const src = await load(bytes);
  const remove = new Set(indices);
  const order = Array.from({ length: src.getPageCount() }, (_, i) => i).filter(
    (i) => !remove.has(i),
  );
  return arrangePages(bytes, order);
}

/** Move the page at `from` to position `to` (0-based), shifting the rest. */
export async function movePage(
  bytes: Uint8Array,
  from: number,
  to: number,
): Promise<Uint8Array> {
  const src = await load(bytes);
  const count = src.getPageCount();
  if (from < 0 || from >= count) throw new Error('movePage: from out of range');
  const clampedTo = Math.min(Math.max(to, 0), count - 1);
  const order = Array.from({ length: count }, (_, i) => i);
  const [moved] = order.splice(from, 1);
  order.splice(clampedTo, 0, moved);
  return arrangePages(bytes, order);
}

/** Rotate a single page by a delta (degrees, clockwise), normalized to 0-359. */
export async function rotatePage(
  bytes: Uint8Array,
  pageIndex: number,
  deltaDegrees: number,
): Promise<Uint8Array> {
  const doc = await load(bytes);
  const page = doc.getPage(pageIndex);
  const current = page.getRotation().angle;
  // pdf-lib only accepts multiples of 90, so snap defensively.
  const raw = current + deltaDegrees;
  const next = ((((Math.round(raw / 90) * 90) % 360) + 360) % 360);
  page.setRotation(degrees(next));
  return doc.save();
}

/** Concatenate multiple PDFs (by bytes) into one, in order. */
export async function mergePdfs(parts: Uint8Array[]): Promise<Uint8Array> {
  if (parts.length === 0) throw new Error('mergePdfs: no input documents');
  const out = await PDFDocument.create();
  for (const part of parts) {
    const src = await PDFDocument.load(part.slice());
    const copied = await out.copyPages(src, src.getPageIndices());
    for (const page of copied) out.addPage(page);
  }
  return out.save();
}

/** Extract the given pages into a new document (split). */
export async function splitPages(
  bytes: Uint8Array,
  indices: number[],
): Promise<Uint8Array> {
  const order = [...indices].sort((a, b) => a - b);
  return arrangePages(bytes, order);
}
