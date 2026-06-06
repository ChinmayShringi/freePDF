/**
 * Centralized PDF.js worker configuration.
 *
 * PDF.js requires `GlobalWorkerOptions.workerSrc` to point at its worker bundle.
 * Under Vite, importing the worker with the `?url` suffix yields a hashed,
 * production-safe URL. Importing this module (for its side effect) anywhere
 * before the first PDF is parsed guarantees the worker is wired exactly once.
 *
 * Getting this wrong is the classic "blank viewer" bug, so all PDF.js usage
 * must go through here rather than configuring the worker ad hoc.
 */
import { GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export { workerUrl };
