import '@testing-library/jest-dom/vitest';

// jsdom does not implement the canvas geometry primitives that pdfjs-dist
// references at import time. Stub the minimum so modules transitively importing
// pdfjs (e.g. the document store) can load inside the test environment. Tests
// that need real rendering use a browser, not jsdom.
const g = globalThis as unknown as Record<string, unknown>;
if (typeof g.DOMMatrix === 'undefined') {
  g.DOMMatrix = class {};
}
if (typeof g.Path2D === 'undefined') {
  g.Path2D = class {};
}
if (typeof g.ImageData === 'undefined') {
  g.ImageData = class {};
}
