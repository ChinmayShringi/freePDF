# freePDF: Build Progress

Last updated: 2026-06-06. v1 build complete (Phases 0 through 7).

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
- License/funding: MIT + `.github/FUNDING.yml` + non-blocking Ko-fi tip jar.
  Do NOT change GitHub repo visibility automatically.
- Host: Cloudflare Pages (build `npm run build`, output `dist`). Dashboard
  linking is a manual user step (documented in README).
- Analytics: Cloudflare Web Analytics (cookieless), env-gated; never Google.

## Stack

Vite + React 19 + TypeScript - pdfjs-dist 6 (render) - pdf-lib + @pdf-lib/fontkit
(write/export) - konva + react-konva (overlay) - zustand (state) - vitest (tests).

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| 0 Setup & deploy skeleton | DONE | scaffold, Tailwind, worker, MIT, README |
| 1 PDF viewer | DONE | virtualized pages, thumbnails, zoom; verified in browser |
| 2 Add text + export | DONE | coordinateTransform (tested), font embedding, export |
| 3 Page operations | DONE | rotate/delete/move/merge/split + page-op undo |
| 4 Signature | DONE | draw/upload, place/resize, bake on export; verified round-trip |
| 5 Annotations | DONE | highlight, freehand, rectangle, line, check, X; verified round-trip |
| 6 Text replacement (best-effort) | DONE | cover-and-replace via PDF.js text runs; clearly labeled |
| 7 Polish & launch | DONE | undo/redo + clear + shortcuts, Fit width, footer (privacy + tip jar), Cloudflare analytics (env), beforeunload guard, fit/clipping fix, non-Latin + landscape QA |

Tests: 34 passing. `npm run build` green.

## Coordinate model (the core idea)

Edits are stored in **display space** (top-left origin, points at scale 1).
Konva multiplies by the zoom `scale`; export converts display -> PDF user space
via `coordinateTransform.displayToPdf` (rotation-aware). Rectangles/images use a
bottom-left anchor + `textDrawAngle` rotation; polylines (line/freehand/stamp)
transform each point individually, so rotation needs no extra math.

## Gotchas to remember

- PDF.js detaches parsed ArrayBuffers: always `.slice()` before handing bytes to
  pdf-lib / PDF.js (see `documentStore.replaceDocument` and `getBakedBytes`).
- After any page op, `docId` bumps and viewer/thumbnail components remount (keys
  include `docId`) so stale page proxies are dropped.
- pdf-lib `save()` uses object streams by default, so grepping raw output for
  dict keys like `/FontFile2` or `/Type0` yields false negatives even when the
  font IS embedded. Verify embedding by rendering the output instead.
- No em dashes anywhere in source/docs/output (user global rule).

## How to run / verify

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build -> dist/
npm run test     # vitest (34 tests)
node scripts/make-fixtures.mjs   # regenerate tests/fixtures/*.pdf
```

QA fixtures in `tests/fixtures/`: `digital.pdf` (3 pages), `rotated.pdf`
(0/90/180/270), `multipage.pdf` (120 pages), `landscape.pdf` (wide page for
fit/clipping), `nonlatin.pdf` (Greek/Cyrillic/Latin-1 for Unicode embedding).

## Possible follow-ups (post-v1)

- SEO tool pages (`/sign-pdf`, `/merge-pdf`, ...) with a tool preselected.
- Scanned (image-only) and AcroForm fixtures for deeper QA.
- Mobile/touch refinements (desktop-first for v1).

## Key files map

- `src/lib/pdf/` - `loadPdf`, `renderPdf`, `coordinateTransform`(+test),
  `fontEmbedding`, `exportPdf`(+test), `annotationDraw`, `pageOperations`(+test),
  `textRuns`, `pdfWorker`.
- `src/store/` - `documentStore` (doc + page ops + zoom/fit), `editorStore`
  (overlay edits + undo, tested), `toolStore` (active tool + defaults).
- `src/components/editor/` - `PdfViewer`, `PdfPage`, `EditorCanvas` (Konva
  overlay + drawing), `overlayNodes` (node renderers), `ThumbnailStrip`,
  `Toolbar`, `PropertiesPanel`, `ExportButton`, `EditorFooter`.
- `src/components/tools/` - `SignatureTool`. `src/components/ui/` - `Button`, `Modal`.
- `src/app/` - `App` (Home/Editor switch), `routes/Home`, `routes/Editor`.
