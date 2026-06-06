import { describe, it, expect } from 'vitest';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import {
  arrangePages,
  deletePages,
  movePage,
  rotatePage,
  mergePdfs,
  splitPages,
} from './pageOperations';

/**
 * Build a PDF whose pages are tagged with a marker number drawn as text, so we
 * can read back page order after operations. Returns bytes plus a helper that
 * reads each page's width to distinguish them (we use distinct page sizes as the
 * order signal, which survives copyPages reliably).
 */
async function makeTagged(count: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < count; i++) {
    // Distinct widths encode identity: page i has width 100 + i.
    const page = doc.addPage([100 + i, 800]);
    page.drawText(`${i}`, { x: 10, y: 10, size: 12, font });
  }
  return doc.save();
}

async function widths(bytes: Uint8Array): Promise<number[]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((p) => Math.round(p.getWidth()));
}

describe('arrangePages', () => {
  it('reorders pages by the given order', async () => {
    const bytes = await makeTagged(3); // widths 100,101,102
    const out = await arrangePages(bytes, [2, 0, 1]);
    expect(await widths(out)).toEqual([102, 100, 101]);
  });

  it('throws if the result would have zero pages', async () => {
    const bytes = await makeTagged(2);
    await expect(arrangePages(bytes, [])).rejects.toThrow();
  });

  it('ignores out-of-range indices', async () => {
    const bytes = await makeTagged(2);
    const out = await arrangePages(bytes, [0, 5, 1]);
    expect(await widths(out)).toEqual([100, 101]);
  });
});

describe('deletePages', () => {
  it('removes the specified pages', async () => {
    const bytes = await makeTagged(4); // 100,101,102,103
    const out = await deletePages(bytes, [1, 2]);
    expect(await widths(out)).toEqual([100, 103]);
  });
});

describe('movePage', () => {
  it('moves a page forward', async () => {
    const bytes = await makeTagged(3); // 100,101,102
    const out = await movePage(bytes, 0, 2);
    expect(await widths(out)).toEqual([101, 102, 100]);
  });
  it('moves a page backward', async () => {
    const bytes = await makeTagged(3);
    const out = await movePage(bytes, 2, 0);
    expect(await widths(out)).toEqual([102, 100, 101]);
  });
});

describe('rotatePage', () => {
  it('adds rotation to a single page, normalized', async () => {
    const bytes = await makeTagged(2);
    const out = await rotatePage(bytes, 0, 90);
    const doc = await PDFDocument.load(out);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(0);

    const out2 = await rotatePage(out, 0, 270);
    const doc2 = await PDFDocument.load(out2);
    expect(doc2.getPage(0).getRotation().angle).toBe(0); // (90 + 270) % 360
  });
});

describe('mergePdfs', () => {
  it('concatenates documents in order', async () => {
    const a = await makeTagged(2); // 100,101
    const b = await makeTagged(1); // 100
    const out = await mergePdfs([a, b]);
    expect(await widths(out)).toEqual([100, 101, 100]);
  });
});

describe('splitPages', () => {
  it('extracts a sorted subset into a new document', async () => {
    const bytes = await makeTagged(5); // 100..104
    const out = await splitPages(bytes, [3, 1]);
    expect(await widths(out)).toEqual([101, 103]);
  });
});
