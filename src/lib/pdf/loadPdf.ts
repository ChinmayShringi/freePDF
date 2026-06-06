import { getDocument } from 'pdfjs-dist';
import type { PDFDocumentLoadingTask } from 'pdfjs-dist';
// Side-effect import: guarantees the PDF.js worker is configured before parsing.
import '@/lib/pdf/pdfWorker';

/**
 * Read a File into an ArrayBuffer entirely in the browser. The bytes never
 * leave the device.
 */
export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

/**
 * Begin parsing PDF bytes with PDF.js, returning the loading task.
 *
 * The returned task exposes both `.promise` (resolving to the document proxy)
 * and `.destroy()` (the public way to free the worker + document). Callers
 * should keep the task so they can destroy it when replacing or clearing the
 * document.
 *
 * IMPORTANT: PDF.js detaches (neuters) the ArrayBuffer backing the `data` it
 * receives. The caller must pass a throwaway copy here and keep a separate
 * pristine copy of the original bytes for export with pdf-lib. {@link copyBytes}
 * makes that copy.
 */
export function createLoadingTask(data: Uint8Array): PDFDocumentLoadingTask {
  return getDocument({ data });
}

/** Return an independent copy of a byte array (so one consumer can detach it). */
export function copyBytes(bytes: Uint8Array): Uint8Array {
  return bytes.slice();
}
