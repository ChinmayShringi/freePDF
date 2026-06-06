import { useDocumentStore } from '@/store/documentStore';
import { useToolStore, type Tool } from '@/store/toolStore';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/Button';
import { ExportButton } from '@/components/editor/ExportButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { GitHubLink } from '@/components/ui/GitHubLink';

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
  {
    id: 'replace',
    label: 'Replace',
    title: 'Cover & replace text (visual, best-effort): click a text run',
  },
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
  const fitToWidth = useDocumentStore((s) => s.fitToWidth);
  const reset = useDocumentStore((s) => s.reset);

  const activeTool = useToolStore((s) => s.activeTool);
  const setTool = useToolStore((s) => s.setTool);

  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const clearAll = useEditorStore((s) => s.clearAll);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);
  const hasEdits = useEditorStore((s) => s.edits.length > 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white">
          PDF
        </span>
        <span className="hidden max-w-40 truncate text-sm font-medium text-gray-700 dark:text-gray-200 sm:inline">
          {fileName ?? 'Untitled'}
        </span>
        <div className="ml-2 flex items-center gap-1 rounded-md bg-gray-100 p-1 dark:bg-gray-800">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setTool(tool.id)}
              aria-pressed={activeTool === tool.id}
              className={`rounded px-3 py-1 text-sm font-medium transition ${
                activeTool === tool.id
                  ? 'bg-white text-red-600 shadow-sm dark:bg-gray-700 dark:text-red-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setTool('matchstyle')}
          aria-pressed={activeTool === 'matchstyle'}
          title="Match style: click existing text to copy its font, size, and color"
          className={`rounded px-3 py-1 text-sm font-medium transition ${
            activeTool === 'matchstyle'
              ? 'bg-gray-100 text-red-600 dark:bg-gray-800 dark:text-red-400'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
          }`}
        >
          Match style
        </button>
        <button
          type="button"
          onClick={onOpenSignature}
          className="rounded px-3 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          Sign
        </button>
        <div className="flex items-center gap-1 rounded-md bg-gray-100 p-1 dark:bg-gray-800">
          {ANNOTATION_TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setTool(tool.id)}
              aria-pressed={activeTool === tool.id}
              title={tool.title}
              className={`rounded px-2.5 py-1 text-sm font-medium transition ${
                activeTool === tool.id
                  ? 'bg-white text-red-600 shadow-sm dark:bg-gray-700 dark:text-red-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (Ctrl/Cmd+Z)"
          >
            Undo
          </Button>
          <Button
            variant="ghost"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (Ctrl/Cmd+Shift+Z)"
          >
            Redo
          </Button>
          <Button
            variant="ghost"
            onClick={clearAll}
            disabled={!hasEdits}
            aria-label="Clear all edits"
            title="Clear all edits on every page"
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
          Page {currentPage} / {numPages}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={zoomOut} aria-label="Zoom out" title="Zoom out">
            -
          </Button>
          <span className="w-14 text-center text-sm tabular-nums text-gray-600 dark:text-gray-300">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="ghost" onClick={zoomIn} aria-label="Zoom in" title="Zoom in">
            +
          </Button>
          <Button
            variant="ghost"
            onClick={() => void fitToWidth()}
            aria-label="Fit width"
            title="Fit page width"
          >
            Fit
          </Button>
        </div>
        <ExportButton />
        <Button variant="secondary" onClick={reset}>
          Open another
        </Button>
        <GitHubLink />
        <ThemeToggle />
      </div>
    </div>
  );
}
