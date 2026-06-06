import { useDocumentStore } from '@/store/documentStore';
import { useToolStore, type Tool } from '@/store/toolStore';
import { Button } from '@/components/ui/Button';
import { ExportButton } from '@/components/editor/ExportButton';

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'text', label: 'Text' },
];

const ANNOTATION_TOOLS: { id: Tool; label: string; title: string }[] = [
  { id: 'highlight', label: 'Highlight', title: 'Highlight (drag a box)' },
  { id: 'freehand', label: 'Draw', title: 'Freehand draw' },
  { id: 'rect', label: 'Box', title: 'Rectangle (drag a box)' },
  { id: 'line', label: 'Line', title: 'Line (drag)' },
  { id: 'check', label: 'Check', title: 'Checkmark (click to place)' },
  { id: 'x', label: 'X', title: 'X mark (click to place)' },
];

interface ToolbarProps {
  onOpenSignature: () => void;
}

/** Top toolbar: tools, file info, page indicator, zoom, and export. */
export function Toolbar({ onOpenSignature }: ToolbarProps) {
  const fileName = useDocumentStore((s) => s.fileName);
  const numPages = useDocumentStore((s) => s.numPages);
  const currentPage = useDocumentStore((s) => s.currentPage);
  const scale = useDocumentStore((s) => s.scale);
  const zoomIn = useDocumentStore((s) => s.zoomIn);
  const zoomOut = useDocumentStore((s) => s.zoomOut);
  const reset = useDocumentStore((s) => s.reset);

  const activeTool = useToolStore((s) => s.activeTool);
  const setTool = useToolStore((s) => s.setTool);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
          PDF
        </span>
        <span className="hidden max-w-40 truncate text-sm font-medium text-gray-700 sm:inline">
          {fileName ?? 'Untitled'}
        </span>
        <div className="ml-2 flex items-center gap-1 rounded-md bg-gray-100 p-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setTool(tool.id)}
              aria-pressed={activeTool === tool.id}
              className={`rounded px-3 py-1 text-sm font-medium transition ${
                activeTool === tool.id
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpenSignature}
          className="rounded px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        >
          Sign
        </button>
        <div className="flex items-center gap-1 rounded-md bg-gray-100 p-1">
          {ANNOTATION_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setTool(tool.id)}
              aria-pressed={activeTool === tool.id}
              title={tool.title}
              className={`rounded px-2.5 py-1 text-sm font-medium transition ${
                activeTool === tool.id
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm tabular-nums text-gray-500">
          Page {currentPage} / {numPages}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={zoomOut} aria-label="Zoom out" title="Zoom out">
            -
          </Button>
          <span className="w-14 text-center text-sm tabular-nums text-gray-600">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" onClick={zoomIn} aria-label="Zoom in" title="Zoom in">
            +
          </Button>
        </div>
        <ExportButton />
        <Button variant="secondary" onClick={reset}>
          Open another
        </Button>
      </div>
    </div>
  );
}
