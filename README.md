# freePDF

**The actually free PDF editor.** Edit and download your PDF right in your browser. No signup, no watermark, no paywall at export, and your files never leave your device.

> Every operation runs client-side. There is zero server cost per edit, so there is no reason to paywall. That cost structure is the whole reason this can stay free.

## Why it is free

- **Zero backend, zero upload.** PDFs are read as an `ArrayBuffer` in the browser and edited in memory. Nothing is uploaded or stored on a server.
- **Static hosting.** Deployed to Cloudflare Pages (free, generous bandwidth), so there is no marginal cost per edit.
- **No paywall, ever**, on the core edit or export action. Support is an optional, non-blocking tip jar.

## Project status

v1 complete. Viewer, add-text, page operations (rotate / delete / reorder /
merge / split), signatures (draw or upload), annotations (highlight, freehand,
rectangle, line, checkmark, X), best-effort cover-and-replace text, undo/redo,
fit-to-width, and watermark-free export are all implemented and verified. See
[`docs/PROGRESS.md`](./docs/PROGRESS.md) for the full phase status and notes.

## Features (v1 scope)

- Open and view PDFs (zoom, page navigation, thumbnails)
- Add text anywhere (move, resize, font, size, color)
- Page operations: rotate, delete, reorder, merge, split
- Signatures: draw or upload an image, place and resize
- Annotations: highlight, freehand, rectangle, line, checkmark, X
- Visual text replacement (cover-and-replace, clearly labeled best-effort)
- Export with no watermark and no signup

Out of scope for v1: OCR, format conversion (PDF to Word), server-grade compression, accounts/cloud/collaboration, mobile-first design, and AI features.

## Tech stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) + TypeScript
- [pdf.js](https://mozilla.github.io/pdf.js/) (`pdfjs-dist`) for rendering
- [pdf-lib](https://pdf-lib.js.org/) + [`@pdf-lib/fontkit`](https://github.com/Hopding/fontkit) for writing and Unicode font embedding
- [Konva](https://konvajs.org/) + `react-konva` for the editing overlay
- [Zustand](https://zustand-demo.pmnd.rs/) for state
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vitest](https://vitest.dev/) for unit tests

## Development

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm run build    # type-check and build to dist/
npm run preview  # preview the production build
npm run test     # run unit tests
```

## Deploying to Cloudflare Pages

This is a static site, so any static host works. The intended host is Cloudflare Pages:

1. Push this repository to GitHub.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and select this repo.
3. Set **Build command** to `npm run build` and **Build output directory** to `dist`.
4. Deploy. Cloudflare auto-deploys on every push to the connected branch.
5. (Optional) Enable **Cloudflare Web Analytics** (cookieless) for privacy-consistent metrics.

## Privacy

Your files are processed entirely in your browser. They are not uploaded, logged, or stored anywhere. Closing the tab discards everything.

## License

[MIT](./LICENSE)
