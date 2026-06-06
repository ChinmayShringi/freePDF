import { describe, it, expect } from 'vitest';
import {
  displayToPdf,
  pdfToDisplay,
  displaySize,
  normalizeRotation,
  textDrawAngle,
  type PageGeometry,
} from './coordinateTransform';

// US Letter, portrait.
const W = 612;
const H = 792;

const geom = (rotation: PageGeometry['rotation']): PageGeometry => ({
  width: W,
  height: H,
  rotation,
});

describe('normalizeRotation', () => {
  it('snaps arbitrary angles to 0/90/180/270', () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(90)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(450)).toBe(90);
  });
});

describe('displaySize', () => {
  it('keeps dimensions for 0/180 and swaps for 90/270', () => {
    expect(displaySize(geom(0))).toEqual({ width: W, height: H });
    expect(displaySize(geom(180))).toEqual({ width: W, height: H });
    expect(displaySize(geom(90))).toEqual({ width: H, height: W });
    expect(displaySize(geom(270))).toEqual({ width: H, height: W });
  });
});

describe('displayToPdf', () => {
  it('applies the y-flip for an unrotated page', () => {
    // Top-left of the display is the top-left of the page: PDF (0, H).
    expect(displayToPdf({ x: 0, y: 0 }, geom(0))).toEqual({ x: 0, y: H });
    // Bottom-left of the display is the PDF origin.
    expect(displayToPdf({ x: 0, y: H }, geom(0))).toEqual({ x: 0, y: 0 });
    // An interior point.
    expect(displayToPdf({ x: 100, y: 200 }, geom(0))).toEqual({
      x: 100,
      y: H - 200,
    });
  });

  it('maps the display top-left corner to the correct PDF corner per rotation', () => {
    // Display top-left (0,0) must land on a real page corner for every rotation.
    expect(displayToPdf({ x: 0, y: 0 }, geom(90))).toEqual({ x: 0, y: 0 });
    expect(displayToPdf({ x: 0, y: 0 }, geom(180))).toEqual({ x: W, y: 0 });
    expect(displayToPdf({ x: 0, y: 0 }, geom(270))).toEqual({ x: W, y: H });
  });
});

describe('round trip displayToPdf <-> pdfToDisplay', () => {
  const samples = [
    { x: 0, y: 0 },
    { x: 100, y: 250 },
    { x: 500, y: 700 },
  ];
  for (const rotation of [0, 90, 180, 270] as const) {
    it(`is identity for rotation ${rotation}`, () => {
      for (const p of samples) {
        const pdf = displayToPdf(p, geom(rotation));
        const back = pdfToDisplay(pdf, geom(rotation));
        expect(back.x).toBeCloseTo(p.x, 6);
        expect(back.y).toBeCloseTo(p.y, 6);
      }
    });
  }
});

describe('textDrawAngle', () => {
  it('equals the rotation value', () => {
    expect(textDrawAngle(0)).toBe(0);
    expect(textDrawAngle(90)).toBe(90);
    expect(textDrawAngle(180)).toBe(180);
    expect(textDrawAngle(270)).toBe(270);
  });
});
