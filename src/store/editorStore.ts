import { create } from 'zustand';
import type { EditObject, RgbColor, StandardFontFamily } from '@/types/edits';

/** An edit object without its id, used when creating a new one. */
export type DraftEdit = EditObject extends infer T
  ? T extends EditObject
    ? Omit<T, 'id'>
    : never
  : never;

/**
 * Overlay edit state with snapshot-based undo/redo.
 *
 * Undo is designed in from the start (Phase 2) even though the button ships in
 * Phase 7, because retrofitting history later is painful. Every discrete action
 * (add/remove/clear) records a snapshot; continuous interactions (drag, typing
 * in the properties panel) call {@link beginInteraction} once at the start so a
 * whole gesture is a single undo step rather than hundreds.
 */

const MAX_HISTORY = 100;

export interface NewTextInput {
  pageIndex: number;
  x: number;
  y: number;
  fontSize: number;
  color: RgbColor;
  fontFamily: StandardFontFamily;
}

export interface NewImageInput {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** PNG (transparent) data URL. */
  dataUrl: string;
}

interface EditorState {
  edits: EditObject[];
  past: EditObject[][];
  future: EditObject[][];
  selectedId: string | null;

  beginInteraction: () => void;
  addText: (input: NewTextInput) => string;
  addImage: (input: NewImageInput) => string;
  /** Add any fully-formed edit (id is assigned here). Used by annotations. */
  addEdit: (draft: DraftEdit) => string;
  updateEdit: (id: string, patch: Partial<EditObject>) => void;
  removeEdit: (id: string) => void;
  select: (id: string | null) => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
}

function newId(): string {
  return crypto.randomUUID();
}

export const useEditorStore = create<EditorState>((set, get) => {
  /** Push the current edits onto the undo stack and clear the redo stack. */
  function pushHistory() {
    const { edits, past } = get();
    const trimmed =
      past.length >= MAX_HISTORY ? past.slice(past.length - MAX_HISTORY + 1) : past;
    set({ past: [...trimmed, edits], future: [] });
  }

  return {
    edits: [],
    past: [],
    future: [],
    selectedId: null,

    beginInteraction: () => pushHistory(),

    addText: (input) => {
      pushHistory();
      const id = newId();
      const edit: EditObject = {
        id,
        type: 'text',
        pageIndex: input.pageIndex,
        x: input.x,
        y: input.y,
        text: 'Text',
        fontSize: input.fontSize,
        color: input.color,
        fontFamily: input.fontFamily,
      };
      set((s) => ({ edits: [...s.edits, edit], selectedId: id }));
      return id;
    },

    addImage: (input) => {
      pushHistory();
      const id = newId();
      const edit: EditObject = {
        id,
        type: 'image',
        pageIndex: input.pageIndex,
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height,
        dataUrl: input.dataUrl,
      };
      set((s) => ({ edits: [...s.edits, edit], selectedId: id }));
      return id;
    },

    addEdit: (draft) => {
      pushHistory();
      const id = newId();
      const edit = { ...draft, id } as EditObject;
      set((s) => ({ edits: [...s.edits, edit], selectedId: id }));
      return id;
    },

    updateEdit: (id, patch) =>
      set((s) => ({
        edits: s.edits.map((e) =>
          e.id === id ? ({ ...e, ...patch } as EditObject) : e,
        ),
      })),

    removeEdit: (id) => {
      pushHistory();
      set((s) => ({
        edits: s.edits.filter((e) => e.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      }));
    },

    select: (id) => set({ selectedId: id }),

    clearAll: () => {
      if (get().edits.length === 0) return;
      pushHistory();
      set({ edits: [], selectedId: null });
    },

    undo: () => {
      const { past, edits, future } = get();
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      set({
        edits: previous,
        past: past.slice(0, -1),
        future: [edits, ...future],
        selectedId: null,
      });
    },

    redo: () => {
      const { future, edits, past } = get();
      if (future.length === 0) return;
      const next = future[0];
      set({
        edits: next,
        future: future.slice(1),
        past: [...past, edits],
        selectedId: null,
      });
    },
  };
});
