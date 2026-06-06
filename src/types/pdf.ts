import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

/** Lifecycle status of the currently loaded document. */
export type DocumentStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Re-exported PDF.js proxy types so the rest of the app imports from one place. */
export type { PDFDocumentProxy, PDFPageProxy };

/** Plain dimensions of a PDF page at scale 1 (in PDF points). */
export interface PageSize {
  width: number;
  height: number;
}
