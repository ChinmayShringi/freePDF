import { create } from 'zustand';
import type { PDFDocumentLoadingTask } from 'pdfjs-dist';
import type { DocumentStatus, PDFDocumentProxy } from '@/types/pdf';
import {
  copyBytes,
  createLoadingTask,
  readFileAsArrayBuffer,
} from '@/lib/pdf/loadPdf';
import { buildEditedPdf } from '@/lib/pdf/exportPdf';
import { useEditorStore } from '@/store/editorStore';
import { useFontStore } from '@/store/fontStore';

/** Max number of page-operation snapshots kept for undo. */
const MAX_PAGE_OP_HISTORY = 10;

/** A page-structure transform: takes PDF bytes, returns new PDF bytes. */
export type PageTransform = (bytes: Uint8Array) => Promise<Uint8Array>;

/** Drop all overlay edits and undo history (used when the document changes). */
function clearEdits() {
  useEditorStore.setState({
    edits: [],
    past: [],
    future: [],
    selectedId: null,
  });
}

/** Zoom bounds and step for the viewer. */
export const MIN_SCALE = 0.25;
export const MAX_SCALE = 4;
const SCALE_STEP = 0.25;
const DEFAULT_SCALE = 1.25;

interface DocumentState {
  /** Pristine copy of the original file bytes, reserved for pdf-lib export. */
  originalBytes: Uint8Array | null;
  /** Parsed PDF.js document proxy used for rendering. */
  pdf: PDFDocumentProxy | null;
  /** Loading task retained so the worker + document can be destroyed cleanly. */
  loadingTask: PDFDocumentLoadingTask | null;
  numPages: number;
  fileName: string | null;
  status: DocumentStatus;
  error: string | null;
  /** Bumped whenever the working document is replaced, to force fresh renders. */
  docId: number;
  /** Current zoom scale (1 = 100%). */
  scale: number;
  /** Width of the viewer scroll area in CSS px, reported by the viewer. */
  viewerWidth: number;
  /** 1-based page currently in focus (for the page indicator). */
  currentPage: number;
  /** True while a page operation is baking/transforming/reloading. */
  pageOpBusy: boolean;
  /** Snapshots of document bytes before each page op, for undo. */
  pageOpHistory: Uint8Array[];

  loadFromFile: (file: File) => Promise<void>;
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setViewerWidth: (width: number) => void;
  /** Set zoom so the current page's width fits the viewer. */
  fitToWidth: () => Promise<void>;
  setCurrentPage: (page: number) => void;
  /** Bake pending text edits, apply a page transform, and reload the document. */
  applyPageTransform: (transform: PageTransform) => Promise<void>;
  /** Revert the most recent page operation. */
  undoPageOp: () => Promise<void>;
  /** Bytes with pending edits baked in, for split/extract downloads. */
  getBakedBytes: () => Promise<Uint8Array | null>;
  reset: () => void;
}

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export const useDocumentStore = create<DocumentState>((set, get) => {
  /**
   * Swap in a new working document from PDF bytes: tear down the old PDF.js
   * worker, parse the new bytes (handing PDF.js a throwaway copy and keeping a
   * pristine copy for export), and update render state. Clamps currentPage.
   */
  async function replaceDocument(bytes: Uint8Array): Promise<void> {
    const previousTask = get().loadingTask;
    if (previousTask) void previousTask.destroy();

    const pristine = copyBytes(bytes);
    const task = createLoadingTask(bytes.slice());
    const pdf = await task.promise;
    set((s) => ({
      pdf,
      loadingTask: task,
      originalBytes: pristine,
      numPages: pdf.numPages,
      currentPage: Math.min(s.currentPage, pdf.numPages),
      docId: s.docId + 1,
    }));
  }

  return {
  originalBytes: null,
  pdf: null,
  loadingTask: null,
  numPages: 0,
  fileName: null,
  status: 'idle',
  error: null,
  docId: 0,
  scale: DEFAULT_SCALE,
  viewerWidth: 0,
  currentPage: 1,
  pageOpBusy: false,
  pageOpHistory: [],

  loadFromFile: async (file) => {
    // Destroy any previously loaded document before replacing it.
    const previousTask = get().loadingTask;
    if (previousTask) {
      void previousTask.destroy();
    }
    clearEdits();

    set({
      status: 'loading',
      error: null,
      fileName: file.name,
      pdf: null,
      loadingTask: null,
      originalBytes: null,
      numPages: 0,
      currentPage: 1,
      pageOpHistory: [],
    });

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const bytes = new Uint8Array(buffer);
      // PDF.js detaches the buffer it parses, so keep an independent copy
      // for export and hand a throwaway copy to PDF.js.
      const pristine = copyBytes(bytes);
      const task = createLoadingTask(bytes);
      const pdf = await task.promise;

      set((s) => ({
        status: 'ready',
        pdf,
        loadingTask: task,
        originalBytes: pristine,
        numPages: pdf.numPages,
        currentPage: 1,
        docId: s.docId + 1,
      }));
    } catch (err) {
      set({
        status: 'error',
        error:
          err instanceof Error
            ? err.message
            : 'Could not open this file. Is it a valid PDF?',
        pdf: null,
        loadingTask: null,
        originalBytes: null,
        numPages: 0,
      });
    }
  },

  setScale: (scale) => set({ scale: clampScale(scale) }),
  zoomIn: () => set((s) => ({ scale: clampScale(s.scale + SCALE_STEP) })),
  zoomOut: () => set((s) => ({ scale: clampScale(s.scale - SCALE_STEP) })),
  setViewerWidth: (width) => set({ viewerWidth: width }),

  fitToWidth: async () => {
    const { pdf, currentPage, viewerWidth } = get();
    if (!pdf || viewerWidth <= 0) return;
    try {
      const page = await pdf.getPage(currentPage);
      const pageWidth = page.getViewport({ scale: 1 }).width;
      if (pageWidth <= 0) return;
      // Leave room for page padding so the page is not flush to the edges.
      const target = (viewerWidth - 48) / pageWidth;
      set({ scale: clampScale(target) });
    } catch {
      // A fit failure should not break the viewer; keep the current zoom.
    }
  },

  setCurrentPage: (page) => set({ currentPage: page }),

  getBakedBytes: async () => {
    const { originalBytes } = get();
    if (!originalBytes) return null;
    const edits = useEditorStore.getState().edits;
    if (edits.length === 0) return originalBytes.slice();
    const customBytes = useFontStore.getState().customBytes;
    return buildEditedPdf(originalBytes.slice(), edits, customBytes);
  },

  applyPageTransform: async (transform) => {
    const { originalBytes } = get();
    if (!originalBytes) return;
    set({ pageOpBusy: true, error: null });
    try {
      // Bake any pending overlay edits so they become part of the document
      // before the structure changes; then page indices stay consistent.
      const baked = await get().getBakedBytes();
      if (!baked) return;
      const snapshot = originalBytes.slice();
      const result = await transform(baked);
      await replaceDocument(result);
      clearEdits();
      set((s) => {
        const history = [...s.pageOpHistory, snapshot];
        return {
          pageOpHistory:
            history.length > MAX_PAGE_OP_HISTORY
              ? history.slice(history.length - MAX_PAGE_OP_HISTORY)
              : history,
        };
      });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : 'Page operation failed.',
      });
    } finally {
      set({ pageOpBusy: false });
    }
  },

  undoPageOp: async () => {
    const { pageOpHistory } = get();
    if (pageOpHistory.length === 0) return;
    const previous = pageOpHistory[pageOpHistory.length - 1];
    set({ pageOpBusy: true, error: null });
    try {
      await replaceDocument(previous.slice());
      clearEdits();
      set({ pageOpHistory: pageOpHistory.slice(0, -1) });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : 'Could not undo page operation.',
      });
    } finally {
      set({ pageOpBusy: false });
    }
  },

  reset: () => {
    const previousTask = get().loadingTask;
    if (previousTask) {
      void previousTask.destroy();
    }
    clearEdits();
    set({
      originalBytes: null,
      pdf: null,
      loadingTask: null,
      numPages: 0,
      fileName: null,
      status: 'idle',
      error: null,
      scale: DEFAULT_SCALE,
      currentPage: 1,
      pageOpBusy: false,
      pageOpHistory: [],
    });
  },
  };
});
