import { useDocumentStore } from '@/store/documentStore';
import { Button } from '@/components/ui/Button';

/** Top toolbar: file info, page indicator, and zoom controls. */
export function Toolbar() {
  const fileName = useDocumentStore((s) => s.fileName);
  const numPages = useDocumentStore((s) => s.numPages);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const scale = useDocumentStore((s) => s.scale);
  const zoomIn = useDocumentStore((s) => s.zoomIn);
  const zoomOut = useDocumentStore((s) => s.zoomOut);
  const reset = useDocumentStore((s) => s.reset);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
          PDF
        </span>
        <span className="truncate text-sm font-medium text-gray-700">
          {fileName ?? 'Untitled'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm tabular-nums text-gray-500">
          Page {currentPage} / {numPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={zoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            -
          </Button>
          <span className="w-14 text-center text-sm tabular-nums text-gray-600">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            onClick={zoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </Button>
        </div>
        <Button variant="secondary" onClick={reset}>
          Open another
        </Button>
      </div>
    </div>
  );
}
