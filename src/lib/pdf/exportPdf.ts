import { PDFDocument, degrees, rgb, type PDFPage } from 'pdf-lib';
import type { EditObject, ImageEdit, TextEdit } from '@/types/edits';
import {
  displayToPdf,
  normalizeRotation,
  textDrawAngle,
} from '@/lib/pdf/coordinateTransform';
import { createFontResolver, type FontResolver } from '@/lib/pdf/fontEmbedding';
import {
  drawCover,
  drawHighlight,
  drawPolyline,
  drawRect,
  drawStamp,
} from '@/lib/pdf/annotationDraw';

/** Decode a base64 data URL into raw bytes. `atob` exists in browsers, jsdom, and Node. */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function drawTextEdit(
  page: PDFPage,
  resolver: FontResolver,
  edit: TextEdit,
): Promise<void> {
  const { width, height } = page.getSize();
  const rotation = normalizeRotation(page.getRotation().angle);
  const font = await resolver.fontFor(edit.text, edit.fontFamily);

  // The text's baseline sits `ascent` below its top edge in display space.
  const ascent = font.heightAtSize(edit.fontSize, { descender: false });
  const baselineDisplay = { x: edit.x, y: edit.y + ascent };
  const anchor = displayToPdf(baselineDisplay, { width, height, rotation });

  page.drawText(edit.text, {
    x: anchor.x,
    y: anchor.y,
    size: edit.fontSize,
    font,
    color: rgb(edit.color.r, edit.color.g, edit.color.b),
    rotate: degrees(textDrawAngle(rotation)),
  });
}

async function drawImageEdit(
  doc: PDFDocument,
  page: PDFPage,
  edit: ImageEdit,
): Promise<void> {
  const { width, height } = page.getSize();
  const rotation = normalizeRotation(page.getRotation().angle);
  const png = await doc.embedPng(dataUrlToBytes(edit.dataUrl));

  // drawImage's anchor is the image's bottom-left corner. In display space that
  // is the rect's bottom-left (x, y + height); convert it to PDF space.
  const anchor = displayToPdf(
    { x: edit.x, y: edit.y + edit.height },
    { width, height, rotation },
  );

  page.drawImage(png, {
    x: anchor.x,
    y: anchor.y,
    width: edit.width,
    height: edit.height,
    rotate: degrees(textDrawAngle(rotation)),
  });
}

/**
 * Apply overlay edits to the original PDF bytes and return the new PDF bytes.
 *
 * The original document is loaded with pdf-lib (preserving its existing
 * content), each edit is baked onto its page, and the result is serialized.
 * No watermark, no signup, no server round-trip.
 */
export async function buildEditedPdf(
  originalBytes: Uint8Array,
  edits: EditObject[],
  customFontBytes: Record<string, Uint8Array> = {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(originalBytes);
  const resolver = await createFontResolver(doc, customFontBytes);
  const pages = doc.getPages();

  for (const edit of edits) {
    const page = pages[edit.pageIndex];
    if (!page) continue;
    switch (edit.type) {
      case 'text':
        await drawTextEdit(page, resolver, edit);
        break;
      case 'image':
        await drawImageEdit(doc, page, edit);
        break;
      case 'cover':
        drawCover(page, edit);
        break;
      case 'highlight':
        drawHighlight(page, edit);
        break;
      case 'rect':
        drawRect(page, edit);
        break;
      case 'line':
      case 'freehand':
        drawPolyline(page, edit);
        break;
      case 'stamp':
        drawStamp(page, edit);
        break;
    }
  }

  return doc.save();
}

/** Trigger a browser download of PDF bytes. Nothing is uploaded. */
export function downloadPdf(bytes: Uint8Array, fileName: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke after a tick: revoking synchronously can race the browser's
  // download initiation (notably in Firefox) and produce an empty file.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Derive a sensible download name from the original file name. */
export function editedFileName(original: string | null): string {
  if (!original) return 'edited.pdf';
  const base = original.replace(/\.pdf$/i, '');
  return `${base} (edited).pdf`;
}
