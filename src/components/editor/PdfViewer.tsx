import { useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { PdfPage } from '@/components/editor/PdfPage';

/**
 * Scrollable column of virtualized pages. Owns the scroll container element and
 * passes it down so each page observes intersection against this viewport.
 */
export function PdfViewer() {
  const numPages = useDocumentStore((s) => s.numPages);
  const scale = useDocumentStore((s) => s.scale);
  // Callback ref kept in state so children re-render once the root is mounted.
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setScrollRoot}
      className="h-full overflow-auto bg-gray-200"
      role="region"
      aria-label="PDF pages"
    >
      <div className="flex flex-col items-center gap-4 px-4 py-6">
        {Array.from({ length: numPages }, (_, i) => (
          <PdfPage
            key={i + 1}
            pageNumber={i + 1}
            scrollRoot={scrollRoot}
            scale={scale}
          />
        ))}
      </div>
    </div>
  );
}
