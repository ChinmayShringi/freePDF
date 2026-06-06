import { REPO_URL, SUPPORT_URL } from '@/config';

/**
 * Slim footer with the privacy promise and an optional, non-blocking tip jar.
 * The tip jar never gates any feature; export is always free and watermark-free.
 */
export function EditorFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-500">
      <span>
        Your file never leaves your device. Everything runs in your browser; no
        upload, no account, no watermark.
      </span>
      <span className="flex items-center gap-3">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-800"
        >
          Source
        </a>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-pink-50 px-3 py-1 font-medium text-pink-600 transition hover:bg-pink-100"
        >
          Tip jar (optional)
        </a>
      </span>
    </footer>
  );
}
