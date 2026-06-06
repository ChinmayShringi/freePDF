import { degrees, rgb, type PDFPage } from 'pdf-lib';
import type {
  HighlightEdit,
  PolylineEdit,
  RectEdit,
  StampEdit,
} from '@/types/edits';
import { HIGHLIGHT_OPACITY, stampStrokes } from '@/types/edits';
import {
  displayToPdf,
  normalizeRotation,
  textDrawAngle,
  type PageGeometry,
} from '@/lib/pdf/coordinateTransform';

/** Read a pdf-lib page's geometry as the coordinate transform expects it. */
function geometryOf(page: PDFPage): PageGeometry {
  const { width, height } = page.getSize();
  return { width, height, rotation: normalizeRotation(page.getRotation().angle) };
}

/** Draw a translucent highlight rectangle. */
export function drawHighlight(page: PDFPage, edit: HighlightEdit): void {
  const geom = geometryOf(page);
  // drawRectangle's anchor is the bottom-left corner: display (x, y + height).
  const anchor = displayToPdf({ x: edit.x, y: edit.y + edit.height }, geom);
  page.drawRectangle({
    x: anchor.x,
    y: anchor.y,
    width: edit.width,
    height: edit.height,
    color: rgb(edit.color.r, edit.color.g, edit.color.b),
    opacity: HIGHLIGHT_OPACITY,
    rotate: degrees(textDrawAngle(geom.rotation)),
  });
}

/** Draw an outlined (unfilled) rectangle. */
export function drawRect(page: PDFPage, edit: RectEdit): void {
  const geom = geometryOf(page);
  const anchor = displayToPdf({ x: edit.x, y: edit.y + edit.height }, geom);
  page.drawRectangle({
    x: anchor.x,
    y: anchor.y,
    width: edit.width,
    height: edit.height,
    borderColor: rgb(edit.color.r, edit.color.g, edit.color.b),
    borderWidth: edit.strokeWidth,
    rotate: degrees(textDrawAngle(geom.rotation)),
  });
}

/**
 * Draw a sequence of connected segments from display-space relative points.
 * Each point is transformed to PDF space individually, so rotation is handled
 * with no extra math.
 */
function drawStroke(
  page: PDFPage,
  geom: PageGeometry,
  originX: number,
  originY: number,
  relPoints: number[],
  color: { r: number; g: number; b: number },
  thickness: number,
): void {
  const pdfPoints = [];
  for (let i = 0; i + 1 < relPoints.length; i += 2) {
    pdfPoints.push(
      displayToPdf(
        { x: originX + relPoints[i], y: originY + relPoints[i + 1] },
        geom,
      ),
    );
  }
  for (let i = 0; i + 1 < pdfPoints.length; i++) {
    page.drawLine({
      start: pdfPoints[i],
      end: pdfPoints[i + 1],
      thickness,
      color: rgb(color.r, color.g, color.b),
    });
  }
}

/** Draw a straight line or freehand polyline. */
export function drawPolyline(page: PDFPage, edit: PolylineEdit): void {
  const geom = geometryOf(page);
  drawStroke(
    page,
    geom,
    edit.x,
    edit.y,
    edit.points,
    edit.color,
    edit.strokeWidth,
  );
}

/** Draw a checkmark or X stamp from its preset strokes. */
export function drawStamp(page: PDFPage, edit: StampEdit): void {
  const geom = geometryOf(page);
  for (const stroke of stampStrokes(edit.kind, edit.size)) {
    drawStroke(page, geom, edit.x, edit.y, stroke, edit.color, edit.strokeWidth);
  }
}
