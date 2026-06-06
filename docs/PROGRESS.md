# freePDF — Build Progress & Resume Guide

Last updated: 2026-06-06. This is the single source of truth for resuming the
build (especially after a context compaction). Read this first.

## What this is

A genuinely free, browser-only PDF editor. Hard constraints (non-negotiable):

1. Zero backend / zero upload. Everything runs client-side; state is in memory
   (Zustand) and gone when the tab closes.
2. No paywall and no watermark on edit or export, ever.

Repo: `git@github.com:ChinmayShringi/freePDF.git`, branch `main`.
Full original plan: `~/.claude/plans/snuggly-wandering-pumpkin.md`.

## Locked decisions

- Name: `freePDF` (target `freepdf.pages.dev`).
- Styling: Tailwind CSS v4 (via `@tailwindcss/vite`).
- Unicode: embed a subset of `src/assets/fonts/NotoSans-Regular.ttf` on demand
  (fontkit) when text has non-WinAnsi chars; standard fonts otherwise.
- License/funding: MIT + `.github/FUNDING.yml` + (planned) non-blocking Ko-fi.
  Do NOT change GitHub repo visibility automatically.
- Host: Cloudflare Pages (build `npm run build`, output `dist`). Dashboard
  linking is a manual user step (documented in README).

## Stack

Vite + React 19 + TypeScript · pdfjs-dist 6 (render) · pdf-lib + @pdf-lib/fontkit
(write/export) · konva + react-konva (overlay) · zustand (state) · vitest (tests).

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| 0 Setup & deploy skeleton | DONE (committed) | scaffold, Tailwind, worker, MIT, README |
| 1 PDF viewer | DONE (committed) | virtualized pages, thumbnails, zoom; verified in browser |
| 2 Add text + export | DONE (committed) | coordinateTransform (tested), font embedding, export; verified upload→add→download, no watermark |
| 3 Page operations | DONE (committed) | rotate/delete/move/merge/split + page-op undo; verified in browser |
| 4 Signature | IN PROGRESS | data model + export DONE & building; **UI remaining** (see Resume) |
| 5 Annotations | TODO | highlight, freehand, rectangle, line, checkmark, X |
| 6 Text replacement (best-effort) | TODO | text-layer cover-and-replace, clearly labeled |
| 7 Polish & launch | TODO | undo/redo button, Ko-fi, privacy copy, Cloudflare analytics, clear-on-close, fit-to-width for landscape/rotated pages, sample-PDF QA |

Tests: 30 passing. `npm run build` green.

## RESUME HERE — Phase 4 (Signature) remaining work

Already done and committed-ready (in working tree, builds + tests pass):
- `src/types/edits.ts`: added `ImageEdit` (PNG dataUrl, display-space x/y/width/height);
  `EditObject = TextEdit | ImageEdit`.
- `src/lib/pdf/exportPdf.ts`: `dataUrlToBytes()` + `drawImageEdit()` (embedPng,
  display→PDF anchor via bottom-left, rotation-aware); wired into `buildEditedPdf`.

Still to build for Phase 4:
1. `src/store/editorStore.ts`: add `addImage(input)` action (mirrors `addText`;
   snapshot via `pushHistory`, selects new edit). Input: pageIndex, x, y, width,
   height, dataUrl.
2. `src/components/ui/Modal.tsx`: simple accessible modal shell.
3. `src/components/tools/SignatureTool.tsx`: modal with two modes —
   - Draw: a `<canvas>` with pointer drawing (transparent background), "Clear",
     then export `toDataURL('image/png')`.
   - Upload: image file → FileReader → dataURL (PNGs already transparent; for
     non-PNG just embed as-is or draw onto canvas to get PNG).
   On confirm, compute a sensible default size and place centered on the current
   page; call `addImage(...)`. Trim transparent margins is optional.
4. `src/components/editor/EditorCanvas.tsx`: render `image` edits as `react-konva`
   `Image` (load HTMLImageElement via `new Image()` + state). Make images
   draggable AND resizable: enable the Transformer (`resizeEnabled`) for image
   nodes only; on `transformend`, read scaleX/scaleY → new width/height, reset
   scale to 1, `updateEdit`. Keep Text non-resizable (size via panel).
5. `src/components/editor/Toolbar.tsx`: add a "Sign" button that opens the
   SignatureTool modal. Wire modal state in `Editor.tsx`.
6. Verify in browser: open `tests/fixtures/digital.pdf`, draw a signature, place
   + resize + drag, Download, reopen the exported PDF (re-upload into freePDF) and
   confirm the signature is placed/scaled correctly with no watermark.
7. Add a unit test for image export (build base PDF, add an ImageEdit with a tiny
   1x1 PNG dataURL, assert `buildEditedPdf` reparses with same page count).
8. Commit: `feat: signature tool - draw/upload, place/resize, bake on export (Phase 4)`.

### Gotchas to remember
- Edits are stored in **display space** (scale 1, top-left origin). Konva
  multiplies by `scale`; export converts via `coordinateTransform.displayToPdf`.
- PDF.js detaches parsed ArrayBuffers — always `.slice()` before handing bytes to
  pdf-lib / PDF.js (see `documentStore.replaceDocument` and `ExportButton`).
- After any page op, `docId` bumps and viewer/thumbnail components remount (keys
  include `docId`) so stale page proxies are dropped.
- Rotation: `displayToPdf` + `textDrawAngle` handle 0/90/180/270; r=0 is exact and
  verified. Rotated-page placement for images is best-effort; verify if needed.

## How to run / verify

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build -> dist/
npm run test     # vitest (30 tests)
node scripts/make-fixtures.mjs   # regenerate tests/fixtures/*.pdf
```

Browser QA fixtures in `tests/fixtures/`: `digital.pdf` (3 pages),
`rotated.pdf` (0/90/180/270), `multipage.pdf` (120 pages). Still want, for full
Phase 7 QA: scanned, form-field, and non-Latin sample PDFs.

## Key files map

- `src/lib/pdf/` — `loadPdf`, `renderPdf`, `coordinateTransform`(+test),
  `fontEmbedding`, `exportPdf`(+test), `pageOperations`(+test), `pdfWorker`.
- `src/store/` — `documentStore` (doc + page ops), `editorStore` (overlay edits +
  undo, tested), `toolStore` (active tool + text defaults).
- `src/components/editor/` — `PdfViewer`, `PdfPage`, `EditorCanvas` (Konva
  overlay), `ThumbnailStrip` (Pages panel), `Toolbar`, `PropertiesPanel`,
  `ExportButton`.
- `src/app/` — `App` (Home/Editor switch), `routes/Home`, `routes/Editor`.
