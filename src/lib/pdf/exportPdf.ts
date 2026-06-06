import { PDFDocument, degrees, rgb, type PDFPage } from 'pdf-lib';
import type { EditObject, TextEdit } from '@/types/edits';
import {
  displayToPdf,
  normalizeRotation,
  textDrawAngle,
} from '@/lib/pdf/coordinateTransform';
import { createFontResolver, type FontResolver } from '@/lib/pdf/fontEmbedding';

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
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(originalBytes);
  const resolver = await createFontResolver(doc);
  const pages = doc.getPages();

  for (const edit of edits) {
    const page = pages[edit.pageIndex];
    if (!page) continue;
    if (edit.type === 'text') {
      await drawTextEdit(page, resolver, edit);
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
  URL.revokeObjectURL(url);
}

/** Derive a sensible download name from the original file name. */
export function editedFileName(original: string | null): string {
  if (!original) return 'edited.pdf';
  const base = original.replace(/\.pdf$/i, '');
  return `${base} (edited).pdf`;
}
