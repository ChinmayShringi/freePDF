/**
 * Coordinate transforms between the on-screen overlay and PDF user space.
 *
 * This is the single source of truth for the trickiest math in the app, so it
 * lives in one dedicated, unit-tested module rather than scattered across
 * components (the #1 source of placement bugs).
 *
 * Three coordinate spaces are involved:
 *
 *  - **Display space** — what the user sees and manipulates on the Konva
 *    overlay, in CSS points at scale 1 (origin top-left, y grows downward).
 *    Edit objects are stored here because it is scale-independent and the
 *    overlay needs no rotation math at all (just multiply by the zoom scale).
 *
 *  - **Canvas space** — display space multiplied by the current zoom `scale`.
 *
 *  - **PDF user space** — what pdf-lib draws into (origin bottom-left, y grows
 *    upward), always the *unrotated* page coordinates. A page's `/Rotate` is
 *    applied by the viewer at display time, so converting display -> PDF must
 *    undo that rotation, and export must re-apply it via the text's draw angle.
 *
 * Page rotation is one of 0, 90, 180, 270 (clockwise, per the PDF `/Rotate`
 * entry). `width`/`height` are the raw (unrotated) MediaBox dimensions in points.
 */

export type Rotation = 0 | 90 | 180 | 270;

export interface PageGeometry {
  /** Raw (unrotated) page width in points. */
  width: number;
  /** Raw (unrotated) page height in points. */
  height: number;
  /** Page `/Rotate` value, clockwise. */
  rotation: Rotation;
}

export interface Point {
  x: number;
  y: number;
}

/** Normalize any integer rotation to one of 0/90/180/270. */
export function normalizeRotation(rotation: number): Rotation {
  const r = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360;
  return r as Rotation;
}

/**
 * The size of a page *as displayed* (at scale 1), accounting for rotation.
 * For 90/270 the width and height are swapped.
 */
export function displaySize(page: PageGeometry): { width: number; height: number } {
  if (page.rotation === 90 || page.rotation === 270) {
    return { width: page.height, height: page.width };
  }
  return { width: page.width, height: page.height };
}

/**
 * Convert a display-space point (top-left origin, scale 1) to unrotated PDF
 * user-space coordinates (bottom-left origin).
 *
 * Derived as the inverse of the standard clockwise image-rotation mapping, so
 * it matches exactly how PDF.js renders the page for each `/Rotate` value.
 */
export function displayToPdf(point: Point, page: PageGeometry): Point {
  const { x: dx, y: dy } = point;
  const { width: W, height: H } = page;
  switch (page.rotation) {
    case 0:
      return { x: dx, y: H - dy };
    case 90:
      return { x: dy, y: dx };
    case 180:
      return { x: W - dx, y: dy };
    case 270:
      return { x: W - dy, y: H - dx };
  }
}

/**
 * Convert an unrotated PDF-space point (bottom-left origin) back to display
 * space (top-left origin, scale 1). Inverse of {@link displayToPdf}.
 */
export function pdfToDisplay(point: Point, page: PageGeometry): Point {
  const { x: px, y: py } = point;
  const { width: W, height: H } = page;
  switch (page.rotation) {
    case 0:
      return { x: px, y: H - py };
    case 90:
      return { x: py, y: px };
    case 180:
      return { x: W - px, y: py };
    case 270:
      return { x: H - py, y: W - px };
  }
}

/**
 * The counter-clockwise angle (in degrees) at which text must be drawn in PDF
 * content space so that, after the page `/Rotate` is applied on display, it
 * reads horizontally left-to-right. Equal to the rotation value itself.
 */
export function textDrawAngle(rotation: Rotation): number {
  return rotation;
}
