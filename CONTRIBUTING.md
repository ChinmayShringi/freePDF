# Contributing to freePDF

Thanks for your interest in improving freePDF. This is a browser-only, free PDF editor and contributions are welcome.

## Non-negotiable constraints

Any change must respect the two rules that define the project:

1. **Zero backend, zero upload.** Everything runs client-side. PDFs are read into memory and never sent to a server. Do not add server calls that transmit user files.
2. **No paywall and no watermark**, ever, on the core edit or export action.

Pull requests that break either rule will not be merged.

## Getting started

```bash
git clone git@github.com:ChinmayShringi/freePDF.git
cd freePDF
npm install
npm run dev      # http://localhost:5173
```

Useful scripts:

```bash
npm run build    # type-check (tsc) and build to dist/
npm run preview  # serve the production build
npm run test     # run the unit tests (vitest)
npm run typecheck
node scripts/make-fixtures.mjs   # regenerate tests/fixtures/*.pdf
```

## Project layout

- `src/lib/pdf/` PDF logic: load, render, coordinate transform, font embedding, export, page operations, annotation drawing, text-run extraction.
- `src/store/` Zustand stores: document, editor (overlay edits + undo), tool, font, theme.
- `src/components/` UI: editor chrome, overlay nodes, tools, shared UI.
- `src/app/` app shell and routes (Home, Editor).

There is more detail in [`docs/PROGRESS.md`](./docs/PROGRESS.md).

## Coding conventions

- TypeScript and React function components.
- Prefer many small, focused files over large ones.
- Immutable updates: never mutate state objects in place; return new copies.
- Edits are stored in display space (top-left origin, points at scale 1) and converted to PDF user space at export via `coordinateTransform`. Keep coordinate math in that module.
- Handle errors explicitly; never silently swallow them.
- Add or update unit tests for logic changes (the coordinate transform, export builders, page operations, and undo/redo are all tested).

## Tests

Run `npm run test` and make sure the suite is green before opening a PR. New logic should come with tests. UI behavior can be verified manually against the fixtures in `tests/fixtures/`.

## Commit and PR process

- Use conventional commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`.
- Keep changes focused; one logical change per PR.
- Before opening a PR: `npm run build` and `npm run test` both pass.
- In the PR description, explain what changed and how you verified it. If it touches editing or export, describe the round-trip you tested (upload, edit, download, reopen).

## Reporting bugs and ideas

Open a GitHub issue with steps to reproduce, the browser and OS, and a sample PDF if relevant (only share files you are comfortable making public). Feature ideas are welcome too.
