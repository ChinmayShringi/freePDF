import { create } from 'zustand';
import type { RgbColor, StandardFontFamily } from '@/types/edits';
import { ANNOTATION_RED, BLACK, HIGHLIGHT_YELLOW, WHITE } from '@/types/edits';

/** Active editing tool. */
export type Tool =
  | 'select'
  | 'text'
  | 'highlight'
  | 'rect'
  | 'line'
  | 'freehand'
  | 'check'
  | 'x'
  | 'replace';

interface ToolState {
  activeTool: Tool;
  /** Defaults applied to newly created text objects. */
  textDefaults: {
    fontSize: number;
    color: RgbColor;
    fontFamily: StandardFontFamily;
  };
  /** Defaults applied to newly created annotation shapes. */
  annotationDefaults: {
    color: RgbColor;
    highlightColor: RgbColor;
    /** Fill color for cover-and-replace rectangles (default white). */
    coverColor: RgbColor;
    strokeWidth: number;
    stampSize: number;
  };
  setTool: (tool: Tool) => void;
  setTextDefaults: (patch: Partial<ToolState['textDefaults']>) => void;
  setAnnotationDefaults: (
    patch: Partial<ToolState['annotationDefaults']>,
  ) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'select',
  textDefaults: {
    fontSize: 16,
    color: BLACK,
    fontFamily: 'Helvetica',
  },
  annotationDefaults: {
    color: ANNOTATION_RED,
    highlightColor: HIGHLIGHT_YELLOW,
    coverColor: WHITE,
    strokeWidth: 2,
    stampSize: 28,
  },
  setTool: (tool) => set({ activeTool: tool }),
  setTextDefaults: (patch) =>
    set((s) => ({ textDefaults: { ...s.textDefaults, ...patch } })),
  setAnnotationDefaults: (patch) =>
    set((s) => ({ annotationDefaults: { ...s.annotationDefaults, ...patch } })),
}));
