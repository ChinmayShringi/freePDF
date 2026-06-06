/**
 * Edit objects are stored in **display space** (top-left origin, points at
 * scale 1) so the overlay needs no rotation math and the model is
 * scale-independent. Export converts them to PDF user space via
 * `coordinateTransform` and `exportPdf`.
 */

/** RGB color with channels in the 0..1 range (pdf-lib's convention). */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** The three pdf-lib standard font families (WinAnsi). */
export type StandardFontFamily = 'Helvetica' | 'TimesRoman' | 'Courier';

export interface TextEdit {
  id: string;
  type: 'text';
  /** 0-based page index this edit belongs to. */
  pageIndex: number;
  /** Display-space left edge (points, scale 1). */
  x: number;
  /** Display-space top edge (points, scale 1). */
  y: number;
  text: string;
  /** Font size in points. */
  fontSize: number;
  color: RgbColor;
  fontFamily: StandardFontFamily;
}

/** Union of all editable overlay objects. Grows as later phases add tools. */
export type EditObject = TextEdit;

export const BLACK: RgbColor = { r: 0, g: 0, b: 0 };
