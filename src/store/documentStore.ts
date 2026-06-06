import { create } from 'zustand';
import type { PDFDocumentLoadingTask } from 'pdfjs-dist';
import type { DocumentStatus, PDFDocumentProxy } from '@/types/pdf';
import {
  copyBytes,
  createLoadingTask,
  readFileAsArrayBuffer,
} from '@/lib/pdf/loadPdf';
import { useEditorStore } from '@/store/editorStore';

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
  /** Current zoom scale (1 = 100%). */
  scale: number;
  /** 1-based page currently in focus (for the page indicator). */
  currentPage: number;

  loadFromFile: (file: File) => Promise<void>;
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setCurrentPage: (page: number) => void;
  reset: () => void;
}

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  originalBytes: null,
  pdf: null,
  loadingTask: null,
  numPages: 0,
  fileName: null,
  status: 'idle',
  error: null,
  scale: DEFAULT_SCALE,
  currentPage: 1,

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
    });

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const bytes = new Uint8Array(buffer);
      // PDF.js detaches the buffer it parses, so keep an independent copy
      // for export and hand a throwaway copy to PDF.js.
      const pristine = copyBytes(bytes);
      const task = createLoadingTask(bytes);
      const pdf = await task.promise;

      set({
        status: 'ready',
        pdf,
        loadingTask: task,
        originalBytes: pristine,
        numPages: pdf.numPages,
        currentPage: 1,
      });
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
  setCurrentPage: (page) => set({ currentPage: page }),

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
    });
  },
}));
