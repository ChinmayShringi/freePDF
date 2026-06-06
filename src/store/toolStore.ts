import { create } from 'zustand';
import type { RgbColor, StandardFontFamily } from '@/types/edits';
import { BLACK } from '@/types/edits';

/** Active editing tool. Grows as later phases add signature/annotation tools. */
export type Tool = 'select' | 'text';

interface ToolState {
  activeTool: Tool;
  /** Defaults applied to newly created text objects. */
  textDefaults: {
    fontSize: number;
    color: RgbColor;
    fontFamily: StandardFontFamily;
  };
  setTool: (tool: Tool) => void;
  setTextDefaults: (
    patch: Partial<ToolState['textDefaults']>,
  ) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: 'select',
  textDefaults: {
    fontSize: 16,
    color: BLACK,
    fontFamily: 'Helvetica',
  },
  setTool: (tool) => set({ activeTool: tool }),
  setTextDefaults: (patch) =>
    set((s) => ({ textDefaults: { ...s.textDefaults, ...patch } })),
}));
