import { useEffect, useRef, useState } from 'react';
import type { PDFPageProxy } from '@/types/pdf';
import { useDocumentStore } from '@/store/documentStore';
import { renderPageToCanvas } from '@/lib/pdf/renderPdf';
import { useElementVisibility } from '@/lib/hooks/useElementVisibility';
import { EditorCanvas } from '@/components/editor/EditorCanvas';

/** US Letter at 72dpi — placeholder aspect ratio until the real page is measured. */
const DEFAULT_PT_WIDTH = 612;
const DEFAULT_PT_HEIGHT = 792;

interface PdfPageProps {
  pageNumber: number;
  scrollRoot: Element | null;
  scale: number;
}

/**
 * A single virtualized PDF page. The wrapper always occupies the correct size
 * (so the scrollbar is accurate), but the heavy canvas bitmap is only rendered
 * while the page is near the viewport. Far-away pages show a light placeholder,
 * keeping memory bounded for very large documents.
 */
export function PdfPage({ pageNumber, scrollRoot, scale }: PdfPageProps) {
  const pdf = useDocumentStore((s) => s.pdf);
  const setCurrentPage = useDocumentStore((s) => s.setCurrentPage);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageProxyRef = useRef<PDFPageProxy | null>(null);

  // Page size in PDF points, learned once the page is fetched.
  const [ptSize, setPtSize] = useState({
    width: DEFAULT_PT_WIDTH,
    height: DEFAULT_PT_HEIGHT,
  });
  const [rendered, setRendered] = useState(false);

  const nearViewport = useElementVisibility(wrapperRef, {
    root: scrollRoot,
    rootMargin: '600px 0px',
  });
  const centered = useElementVisibility(wrapperRef, {
    root: scrollRoot,
    rootMargin: '-49% 0px -49% 0px',
  });

  useEffect(() => {
    if (centered) setCurrentPage(pageNumber);
  }, [centered, pageNumber, setCurrentPage]);

  // Fetch + render whenever the page is near the viewport or the scale changes.
  useEffect(() => {
    if (!pdf || !nearViewport) {
      setRendered(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        if (!pageProxyRef.current) {
          pageProxyRef.current = await pdf.getPage(pageNumber);
        }
        const page = pageProxyRef.current;
        if (cancelled) return;

        const unscaled = page.getViewport({ scale: 1 });
        if (!cancelled) {
          setPtSize({ width: unscaled.width, height: unscaled.height });
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        await renderPageToCanvas(page, canvas, scale);
        if (!cancelled) setRendered(true);
      } catch {
        // A failed single-page render should not crash the viewer.
        if (!cancelled) setRendered(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdf, nearViewport, pageNumber, scale]);

  const cssWidth = Math.floor(ptSize.width * scale);
  const cssHeight = Math.floor(ptSize.height * scale);

  return (
    <div
      ref={wrapperRef}
      data-page-number={pageNumber}
      className="relative mx-auto bg-white shadow-md"
      style={{ width: cssWidth, height: cssHeight }}
    >
      {nearViewport ? (
        <canvas
          ref={canvasRef}
          className="block"
          style={{ width: cssWidth, height: cssHeight }}
        />
      ) : null}
      {!rendered && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
          Page {pageNumber}
        </div>
      )}
      {nearViewport && rendered && (
        <div className="absolute inset-0">
          <EditorCanvas
            pageIndex={pageNumber - 1}
            width={cssWidth}
            height={cssHeight}
            scale={scale}
          />
        </div>
      )}
    </div>
  );
}
