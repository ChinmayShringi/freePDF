import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { buildEditedPdf, editedFileName } from './exportPdf';
import { isWinAnsiSafe } from './fontEmbedding';
import type { TextEdit } from '@/types/edits';

async function makeBasePdf(pages = 2): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([612, 792]);
  return doc.save();
}

const textEdit = (overrides: Partial<TextEdit> = {}): TextEdit => ({
  id: 't1',
  type: 'text',
  pageIndex: 0,
  x: 72,
  y: 100,
  text: 'Hello world',
  fontSize: 18,
  color: { r: 0, g: 0, b: 0 },
  fontFamily: 'Helvetica',
  ...overrides,
});

describe('isWinAnsiSafe', () => {
  it('accepts ASCII and Latin-1', () => {
    expect(isWinAnsiSafe('Hello, world!')).toBe(true);
    expect(isWinAnsiSafe('café résumé ñ ü')).toBe(true);
  });
  it('rejects characters outside WinAnsi range', () => {
    expect(isWinAnsiSafe('smart “quotes”')).toBe(false); // curly quotes
    expect(isWinAnsiSafe('em — dash')).toBe(false);
    expect(isWinAnsiSafe('Greek αβ')).toBe(false);
  });
});

describe('editedFileName', () => {
  it('appends an (edited) suffix and keeps a single .pdf', () => {
    expect(editedFileName('report.pdf')).toBe('report (edited).pdf');
    expect(editedFileName('REPORT.PDF')).toBe('REPORT (edited).pdf');
    expect(editedFileName(null)).toBe('edited.pdf');
  });
});

describe('buildEditedPdf', () => {
  it('preserves the original pages and produces a valid PDF (WinAnsi text)', async () => {
    const base = await makeBasePdf(2);
    const out = await buildEditedPdf(base, [textEdit()]);
    expect(out.length).toBeGreaterThan(0);

    // The output must reparse as a valid PDF with the same page count.
    const reparsed = await PDFDocument.load(out);
    expect(reparsed.getPageCount()).toBe(2);
  });

  it('skips edits that reference a non-existent page', async () => {
    const base = await makeBasePdf(1);
    const out = await buildEditedPdf(base, [textEdit({ pageIndex: 9 })]);
    const reparsed = await PDFDocument.load(out);
    expect(reparsed.getPageCount()).toBe(1);
  });
});
