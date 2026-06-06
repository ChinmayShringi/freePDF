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

/**
 * A translucent highlight rectangle. Position/size in display space; the
 * translucency is applied at render and export time.
 */
export interface HighlightEdit {
  id: string;
  type: 'highlight';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: RgbColor;
}

/** An outlined (unfilled) rectangle. */
export interface RectEdit {
  id: string;
  type: 'rect';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: RgbColor;
  strokeWidth: number;
}

/**
 * A polyline (straight line or freehand path). `points` are display-space
 * offsets [x0, y0, x1, y1, ...] relative to the (x, y) origin, so dragging the
 * shape only moves the origin and never rewrites the points.
 */
export interface PolylineEdit {
  id: string;
  /** 'line' is exactly two points; 'freehand' is many. */
  type: 'line' | 'freehand';
  pageIndex: number;
  x: number;
  y: number;
  points: number[];
  color: RgbColor;
  strokeWidth: number;
}

/** A placed stamp shape (checkmark or X) drawn from preset strokes. */
export interface StampEdit {
  id: string;
  type: 'stamp';
  kind: 'check' | 'x';
  pageIndex: number;
  x: number;
  y: number;
  /** Bounding box size in display points. */
  size: number;
  color: RgbColor;
  strokeWidth: number;
}

/** Union of all editable overlay objects. */
export type EditObject =
  | TextEdit
  | ImageEdit
  | HighlightEdit
  | RectEdit
  | PolylineEdit
  | StampEdit;

export const BLACK: RgbColor = { r: 0, g: 0, b: 0 };
export const HIGHLIGHT_YELLOW: RgbColor = { r: 1, g: 0.92, b: 0.23 };
export const ANNOTATION_RED: RgbColor = { r: 0.86, g: 0.15, b: 0.15 };

/** Opacity applied to highlight fills, in display and export. */
export const HIGHLIGHT_OPACITY = 0.4;

/**
 * Relative stroke geometry for a stamp of a given size, as display-space
 * polylines [x0,y0,x1,y1,...] offset from the stamp origin. A checkmark is one
 * stroke; an X is two. Coordinates use a y-down (display) convention.
 */
export function stampStrokes(kind: StampEdit['kind'], size: number): number[][] {
  if (kind === 'check') {
    return [[0.1 * size, 0.55 * size, 0.4 * size, 0.85 * size, 0.9 * size, 0.15 * size]];
  }
  return [
    [0.12 * size, 0.12 * size, 0.88 * size, 0.88 * size],
    [0.88 * size, 0.12 * size, 0.12 * size, 0.88 * size],
  ];
}
