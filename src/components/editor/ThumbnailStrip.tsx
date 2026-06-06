import { useEffect, useRef, useState } from 'react';
import type { PDFPageProxy } from '@/types/pdf';
import { useDocumentStore } from '@/store/documentStore';
import { renderPageToCanvas } from '@/lib/pdf/renderPdf';
import { useElementVisibility } from '@/lib/hooks/useElementVisibility';

const THUMB_SCALE = 0.2;

/** Scroll the main viewer to a given 1-based page. */
function scrollToPage(pageNumber: number) {
  const el = document.querySelector(`[data-page-number="${pageNumber}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

interface ThumbProps {
  pageNumber: number;
  scrollRoot: Element | null;
  isCurrent: boolean;
}

function Thumb({ pageNumber, scrollRoot, isCurrent }: ThumbProps) {
  const pdf = useDocumentStore((s) => s.pdf);
  const wrapperRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageProxyRef = useRef<PDFPageProxy | null>(null);
  const visible = useElementVisibility(wrapperRef, {
    root: scrollRoot,
    rootMargin: '400px 0px',
  });

  useEffect(() => {
    if (!pdf || !visible) return;
    let cancelled = false;
    (async () => {
      try {
        if (!pageProxyRef.current) {
          pageProxyRef.current = await pdf.getPage(pageNumber);
        }
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        await renderPageToCanvas(pageProxyRef.current, canvas, THUMB_SCALE);
      } catch {
        // Ignore individual thumbnail render failures.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf, visible, pageNumber]);

  return (
    <button
      ref={wrapperRef}
      type="button"
      onClick={() => scrollToPage(pageNumber)}
      className={`flex w-full flex-col items-center gap-1 rounded-md p-2 transition hover:bg-gray-100 ${
        isCurrent ? 'bg-red-50 ring-2 ring-red-500' : ''
      }`}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={isCurrent ? 'true' : undefined}
    >
      <div className="overflow-hidden border border-gray-300 bg-white shadow-sm">
        <canvas ref={canvasRef} className="block" />
      </div>
      <span className="text-xs text-gray-500">{pageNumber}</span>
    </button>
  );
}

/** Sidebar list of clickable page thumbnails. */
export function ThumbnailStrip() {
  const numPages = useDocumentStore((s) => s.numPages);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);

  return (
    <div
      ref={setScrollRoot}
      className="h-full w-40 shrink-0 overflow-auto border-r border-gray-200 bg-white"
      role="navigation"
      aria-label="Page thumbnails"
    >
      <div className="flex flex-col gap-1 p-2">
        {Array.from({ length: numPages }, (_, i) => (
          <Thumb
            key={i + 1}
            pageNumber={i + 1}
            scrollRoot={scrollRoot}
            isCurrent={currentPage === i + 1}
          />
        ))}
      </div>
    </div>
  );
}
