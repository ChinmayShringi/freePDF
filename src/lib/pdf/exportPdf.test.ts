import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { buildEditedPdf, dataUrlToBytes, editedFileName } from './exportPdf';
import { isWinAnsiSafe } from './fontEmbedding';
import {
  ANNOTATION_RED,
  HIGHLIGHT_YELLOW,
  WHITE,
  type EditObject,
  type ImageEdit,
  type TextEdit,
} from '@/types/edits';

/** A valid 1x1 opaque-red PNG (generated with zlib), as a data URL. */
const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==';

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

  it('bakes an image edit and produces a valid PDF', async () => {
    const base = await makeBasePdf(1);
    const imageEdit: ImageEdit = {
      id: 'i1',
      type: 'image',
      pageIndex: 0,
      x: 100,
      y: 100,
      width: 120,
      height: 60,
      dataUrl: PNG_1X1,
    };
    const out = await buildEditedPdf(base, [imageEdit]);
    expect(out.length).toBeGreaterThan(0);
    const reparsed = await PDFDocument.load(out);
    expect(reparsed.getPageCount()).toBe(1);
  });
});

describe('buildEditedPdf annotations', () => {
  const annotations: EditObject[] = [
    {
      id: 'h1',
      type: 'highlight',
      pageIndex: 0,
      x: 50,
      y: 50,
      width: 120,
      height: 18,
      color: HIGHLIGHT_YELLOW,
    },
    {
      id: 'r1',
      type: 'rect',
      pageIndex: 0,
      x: 60,
      y: 120,
      width: 100,
      height: 80,
      color: ANNOTATION_RED,
      strokeWidth: 2,
    },
    {
      id: 'l1',
      type: 'line',
      pageIndex: 0,
      x: 40,
      y: 40,
      points: [0, 0, 150, 60],
      color: ANNOTATION_RED,
      strokeWidth: 2,
    },
    {
      id: 'f1',
      type: 'freehand',
      pageIndex: 0,
      x: 200,
      y: 200,
      points: [0, 0, 10, 15, 25, 5, 40, 30],
      color: ANNOTATION_RED,
      strokeWidth: 3,
    },
    {
      id: 's1',
      type: 'stamp',
      kind: 'check',
      pageIndex: 0,
      x: 300,
      y: 300,
      size: 28,
      color: ANNOTATION_RED,
      strokeWidth: 2,
    },
    {
      id: 's2',
      type: 'stamp',
      kind: 'x',
      pageIndex: 0,
      x: 350,
      y: 300,
      size: 28,
      color: ANNOTATION_RED,
      strokeWidth: 2,
    },
  ];

  it('bakes every annotation type into a valid PDF', async () => {
    const base = await makeBasePdf(1);
    const out = await buildEditedPdf(base, annotations);
    const reparsed = await PDFDocument.load(out);
    expect(reparsed.getPageCount()).toBe(1);
    // Drawing content should make the output larger than the empty base.
    expect(out.length).toBeGreaterThan(base.length);
  });

  it('bakes a cover-and-replace (cover rect + text) into a valid PDF', async () => {
    const base = await makeBasePdf(1);
    const edits: EditObject[] = [
      {
        id: 'c1',
        type: 'cover',
        pageIndex: 0,
        x: 70,
        y: 95,
        width: 160,
        height: 24,
        color: WHITE,
      },
      textEdit({ id: 'rt', x: 72, y: 100, text: 'Replacement' }),
    ];
    const out = await buildEditedPdf(base, edits);
    const reparsed = await PDFDocument.load(out);
    expect(reparsed.getPageCount()).toBe(1);
    expect(out.length).toBeGreaterThan(base.length);
  });
});

describe('dataUrlToBytes', () => {
  it('decodes a base64 data URL into the original PNG bytes', () => {
    const bytes = dataUrlToBytes(PNG_1X1);
    // PNG magic number: 137 80 78 71 ...
    expect(Array.from(bytes.slice(0, 4))).toEqual([137, 80, 78, 71]);
  });
});
