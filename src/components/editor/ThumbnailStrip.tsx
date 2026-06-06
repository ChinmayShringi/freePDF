import { useEffect, useRef, useState } from 'react';
import type { PDFPageProxy } from '@/types/pdf';
import { useDocumentStore } from '@/store/documentStore';
import { renderPageToCanvas } from '@/lib/pdf/renderPdf';
import { readFileAsArrayBuffer } from '@/lib/pdf/loadPdf';
import {
  deletePages,
  mergePdfs,
  movePage,
  rotatePage,
  splitPages,
} from '@/lib/pdf/pageOperations';
import { downloadPdf } from '@/lib/pdf/exportPdf';
import { useElementVisibility } from '@/lib/hooks/useElementVisibility';

const THUMB_SCALE = 0.2;

/** Scroll the main viewer to a given 1-based page. */
function scrollToPage(pageNumber: number) {
  const el = document.querySelector(`[data-page-number="${pageNumber}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

interface ThumbProps {
  pageIndex: number;
  scrollRoot: Element | null;
  isCurrent: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

function Thumb({
  pageIndex,
  scrollRoot,
  isCurrent,
  isSelected,
  onToggleSelect,
}: ThumbProps) {
  const pdf = useDocumentStore((s) => s.pdf);
  const numPages = useDocumentStore((s) => s.numPages);
  const busy = useDocumentStore((s) => s.pageOpBusy);
  const apply = useDocumentStore((s) => s.applyPageTransform);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageProxyRef = useRef<PDFPageProxy | null>(null);
  const visible = useElementVisibility(wrapperRef, {
    root: scrollRoot,
    rootMargin: '400px 0px',
  });

  const pageNumber = pageIndex + 1;

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

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div
      ref={wrapperRef}
      className={`group relative flex flex-col items-center gap-1 rounded-md p-2 ${
        isCurrent ? 'bg-red-50 ring-2 ring-red-500' : 'hover:bg-gray-100'
      }`}
    >
      <button
        type="button"
        onClick={() => scrollToPage(pageNumber)}
        className="overflow-hidden border border-gray-300 bg-white shadow-sm"
        aria-label={`Go to page ${pageNumber}`}
        aria-current={isCurrent ? 'true' : undefined}
      >
        <canvas ref={canvasRef} className="block" />
      </button>

      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        onClick={stop}
        className="absolute left-3 top-3 h-4 w-4 cursor-pointer accent-red-600"
        aria-label={`Select page ${pageNumber} for split`}
      />

      <span className="text-xs text-gray-500">{pageNumber}</span>

      <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          title="Rotate 90°"
          disabled={busy}
          onClick={(e) => {
            stop(e);
            void apply((b) => rotatePage(b, pageIndex, 90));
          }}
          className="rounded bg-white px-1.5 py-0.5 text-xs shadow hover:bg-gray-50 disabled:opacity-40"
        >
          ⟳
        </button>
        <button
          type="button"
          title="Move up"
          disabled={busy || pageIndex === 0}
          onClick={(e) => {
            stop(e);
            void apply((b) => movePage(b, pageIndex, pageIndex - 1));
          }}
          className="rounded bg-white px-1.5 py-0.5 text-xs shadow hover:bg-gray-50 disabled:opacity-40"
        >
          ↑
        </button>
        <button
          type="button"
          title="Move down"
          disabled={busy || pageIndex === numPages - 1}
          onClick={(e) => {
            stop(e);
            void apply((b) => movePage(b, pageIndex, pageIndex + 1));
          }}
          className="rounded bg-white px-1.5 py-0.5 text-xs shadow hover:bg-gray-50 disabled:opacity-40"
        >
          ↓
        </button>
        <button
          type="button"
          title="Delete page"
          disabled={busy || numPages <= 1}
          onClick={(e) => {
            stop(e);
            void apply((b) => deletePages(b, [pageIndex]));
          }}
          className="rounded bg-white px-1.5 py-0.5 text-xs text-red-600 shadow hover:bg-red-50 disabled:opacity-40"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

/** Sidebar: page thumbnails plus page operations (rotate, move, delete, merge, split). */
export function ThumbnailStrip() {
  const numPages = useDocumentStore((s) => s.numPages);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const docId = useDocumentStore((s) => s.docId);
  const fileName = useDocumentStore((s) => s.fileName);
  const busy = useDocumentStore((s) => s.pageOpBusy);
  const apply = useDocumentStore((s) => s.applyPageTransform);
  const undoPageOp = useDocumentStore((s) => s.undoPageOp);
  const getBakedBytes = useDocumentStore((s) => s.getBakedBytes);
  const canUndo = useDocumentStore((s) => s.pageOpHistory.length > 0);

  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // Clear split selection whenever the document changes.
  useEffect(() => {
    setSelected(new Set());
  }, [docId]);

  const toggleSelect = (index: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const onMergeFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const parts: Uint8Array[] = [];
    for (const file of Array.from(files)) {
      const buf = await readFileAsArrayBuffer(file);
      parts.push(new Uint8Array(buf));
    }
    await apply((base) => mergePdfs([base, ...parts]));
  };

  const onSplitDownload = async () => {
    const baked = await getBakedBytes();
    if (!baked) return;
    const indices = [...selected].sort((a, b) => a - b);
    const out = await splitPages(baked, indices);
    const base = (fileName ?? 'document').replace(/\.pdf$/i, '');
    downloadPdf(out, `${base} (pages).pdf`);
  };

  return (
    <div
      ref={setScrollRoot}
      className="flex h-full w-44 shrink-0 flex-col border-r border-gray-200 bg-white"
      role="navigation"
      aria-label="Pages"
    >
      <div className="flex flex-col gap-2 border-b border-gray-200 p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600">Pages</span>
          <button
            type="button"
            disabled={!canUndo || busy}
            onClick={() => void undoPageOp()}
            className="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
            title="Undo last page operation"
          >
            Undo
          </button>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => mergeInputRef.current?.click()}
          className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          + Merge PDF
        </button>
        <input
          ref={mergeInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => void onMergeFiles(e.target.files)}
        />
        {selected.size > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSplitDownload()}
            className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-40"
          >
            Split: download {selected.size} page{selected.size > 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="relative flex-1 overflow-auto">
        {busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-xs text-gray-600">
            Working…
          </div>
        )}
        <div className="flex flex-col gap-1 p-2">
          {Array.from({ length: numPages }, (_, i) => (
            <Thumb
              key={`${docId}-${i}`}
              pageIndex={i}
              scrollRoot={scrollRoot}
              isCurrent={currentPage === i + 1}
              isSelected={selected.has(i)}
              onToggleSelect={() => toggleSelect(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
