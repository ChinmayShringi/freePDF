# Changelog

All notable changes to freePDF are documented here. This project follows
[Semantic Versioning](https://semver.org/) and the format of
[Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-06-06

First public release. A genuinely free, browser-only PDF editor: no backend, no
upload, no signup, no watermark, no paywall.

### Added

- **Viewer:** virtualized page rendering, thumbnails, zoom, and fit-to-width.
- **Add text:** place text anywhere with font, size, and color; export bakes it
  into the downloaded PDF with no watermark.
- **Edit existing text:** double-click a line to cover the original and type a
  replacement that matches its font and size (best-effort, clearly labeled).
- **Match style:** sample an existing text's font, size, and color and apply it
  to new text (a format painter).
- **Signatures:** draw on a canvas or upload an image, then place and resize.
- **Annotations:** highlight, freehand draw, rectangle, line, checkmark, and X.
- **Page operations:** rotate, delete, reorder, merge, and split, with undo.
- **Fonts:** built-in Helvetica, Times, Courier, and Noto Sans (Unicode), plus
  custom TTF/OTF upload; non-Latin text embeds a Noto subset automatically.
- **Undo/redo** with keyboard shortcuts, plus clear-all and an unsaved-changes
  guard on tab close.
- **Dark mode** with a toggle, persisted across sessions.
- **Privacy:** files are processed entirely in the browser and never uploaded.
- **SEO:** rich metadata, Open Graph, structured data, robots.txt, and sitemap.
- Optional, non-blocking Ko-fi tip jar (never gates a feature).

### Notes

- Deployed to Cloudflare Pages: https://freepdf-e5m.pages.dev
- True in-place glyph editing of existing PDF text is not feasible client-side;
  text editing uses cover-and-replace, which is honest about its limitations.

[1.0.0]: https://github.com/ChinmayShringi/freePDF/releases/tag/v1.0.0
