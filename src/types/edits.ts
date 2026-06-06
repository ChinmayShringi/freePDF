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

/**
 * A placed raster image (signature drawing or uploaded picture), stored as a
 * PNG data URL so it round-trips without a server. Position and size are in
 * display space (points, scale 1).
 */
export interface ImageEdit {
  id: string;
  type: 'image';
  pageIndex: number;
  /** Display-space left edge (points, scale 1). */
  x: number;
  /** Display-space top edge (points, scale 1). */
  y: number;
  /** Display-space width (points, scale 1). */
  width: number;
  /** Display-space height (points, scale 1). */
  height: number;
  /** PNG (transparent) data URL. */
  dataUrl: string;
}

/** Union of all editable overlay objects. Grows as later phases add tools. */
export type EditObject = TextEdit | ImageEdit;

export const BLACK: RgbColor = { r: 0, g: 0, b: 0 };
