# freePDF

**The actually free PDF editor.** Edit and download your PDF right in your browser. No signup, no watermark, no paywall at export, and your files never leave your device.

Live: **https://freepdf-e5m.pages.dev**

<p align="center">
  <img src="source.gif" alt="Dobby is free" width="480" />
</p>

<p align="center"><strong>Master gave Dobby a sock. PDF IS FREE.</strong></p>

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

This is a static site (no backend, no server runtime), so any static host works.
The intended host is Cloudflare Pages. It is live at
**https://freepdf-e5m.pages.dev**.

### Build settings

| Setting | Value |
|---------|-------|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | repo root (the app is not in a subfolder) |

The app deploys and runs with **no environment variables**. Both env vars below
are optional, and missing them never breaks the build or runtime:

| Env var | Effect when unset |
|---------|-------------------|
| `VITE_KOFI_HANDLE` | Tip jar falls back to a placeholder handle |
| `VITE_CF_ANALYTICS_TOKEN` | Analytics beacon simply does not load |

### Option A: Git-connected (auto-deploy on push)

1. Push this repository to GitHub.
2. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and select this repo.
3. Apply the build settings from the table above (framework preset Vite).
4. Deploy. Cloudflare then auto-deploys on every push to the connected branch.

### Option B: Direct upload with Wrangler (one-off deploys)

```bash
wrangler login                                  # one-time browser OAuth
npm run build                                   # produce dist/
wrangler pages project create freepdf \
  --production-branch=main                       # one-time, first deploy only
wrangler pages deploy dist --project-name=freepdf --branch=main
```

(Optional) Enable **Cloudflare Web Analytics** (cookieless) for
privacy-consistent metrics, and set the env vars above under
**Settings → Environment variables** if you want the tip jar / analytics.

### Troubleshooting

- **Blank viewer / "worker" errors:** the PDF.js worker is bundled as a hashed
  asset via `pdfjs-dist/build/pdf.worker.min.mjs?url` and wired in
  `src/lib/pdf/pdfWorker.ts`. Do not set a custom `base` in `vite.config.ts`
  unless you serve the app from a subpath; a wrong `base` breaks the worker and
  font URLs.
- **Non-Latin text not embedding:** the Noto Sans subset is imported as
  `@/assets/fonts/NotoSans-Regular.ttf?url` and fetched at export time. Confirm
  `dist/assets/` contains the hashed `NotoSans-Regular-*.ttf` after a build.
- **404 on assets:** ensure the build output directory is `dist` (not the repo
  root) and the framework preset is Vite.

## Privacy

Your files are processed entirely in your browser. They are not uploaded, logged, or stored anywhere. Closing the tab discards everything.

## About

freePDF exists because most "free" PDF editors are not actually free: they add a watermark, gate export behind a signup, or charge to download. freePDF runs every operation client-side, so there is no server cost per edit and therefore no reason to paywall. It is open source under the MIT license, and it stays free.

See [`docs/PROGRESS.md`](./docs/PROGRESS.md) for the full feature list and build notes, and [`CHANGELOG.md`](./CHANGELOG.md) for release history.

## Support the project (optional tip jar)

freePDF is free forever, with no paywall and no watermark. If it saved you money or time, you can leave an optional tip. It never unlocks anything; every feature is already free.

**Tip jar:** https://ko-fi.com/chinmay_shringi

### How the tip jar works and how you get paid

The tip jar is a [Ko-fi](https://ko-fi.com/) link. Ko-fi pays creators directly through their own payment processor, so to actually receive money you set up your own Ko-fi account and point the site at it:

1. Create a free account at [ko-fi.com](https://ko-fi.com/).
2. In Ko-fi, go to **Settings → Payments** and connect a payout method (PayPal or Stripe). Tips then land in that account. Ko-fi takes 0% on standard donations; only the PayPal/Stripe processing fee applies.
3. Note your Ko-fi username, which is the last part of your page URL: `https://ko-fi.com/<your-username>`.
4. Point freePDF at your page by setting the build-time env var `VITE_KOFI_HANDLE=<your-username>` (locally in `.env.local`, or on Cloudflare Pages under **Settings → Environment variables**), then redeploy.

The tip jar points at `ko-fi.com/chinmay_shringi` by default. To run your own instance under a different account, set `VITE_KOFI_HANDLE` to your handle (locally in `.env.local`, or on Cloudflare Pages under Settings, Environment variables) and redeploy.

To withdraw, you do not "claim" from freePDF at all; the money goes straight to your connected PayPal/Stripe via Ko-fi, and you withdraw from there per Ko-fi's payout schedule.

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for how to set up the project, the coding conventions, and how to open a pull request.

## License

[MIT](./LICENSE)
