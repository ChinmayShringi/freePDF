import { useEffect, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { PdfPage } from '@/components/editor/PdfPage';

/**
 * Scrollable column of virtualized pages. Owns the scroll container element and
 * passes it down so each page observes intersection against this viewport.
 *
 * The inner track uses `w-max min-w-full` so it grows to the widest page
 * (landscape/rotated) while still centering narrower ones; without this, a page
 * wider than the column would have its left edge clipped and unreachable by
 * horizontal scroll (the classic centered-flex-overflow bug).
 */
export function PdfViewer() {
  const numPages = useDocumentStore((s) => s.numPages);
  const scale = useDocumentStore((s) => s.scale);
  const docId = useDocumentStore((s) => s.docId);
  const setViewerWidth = useDocumentStore((s) => s.setViewerWidth);
  // Callback ref kept in state so children re-render once the root is mounted.
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  // Track the viewer width so "Fit width" can compute the right zoom.
  useEffect(() => {
    if (!scrollRoot) return;
    setViewerWidth(scrollRoot.clientWidth);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewerWidth(entry.contentRect.width);
      }
    });
    observer.observe(scrollRoot);
    return () => observer.disconnect();
  }, [scrollRoot, setViewerWidth]);

  return (
    <div
      ref={setScrollRoot}
      className="h-full overflow-auto bg-gray-200 dark:bg-gray-800"
      role="region"
      aria-label="PDF pages"
    >
      <div className="mx-auto flex w-max min-w-full flex-col items-center gap-4 px-4 py-6">
        {Array.from({ length: numPages }, (_, i) => (
          <PdfPage
            key={`${docId}-${i + 1}`}
            pageNumber={i + 1}
            scrollRoot={scrollRoot}
            scale={scale}
          />
        ))}
      </div>
    </div>
  );
}
