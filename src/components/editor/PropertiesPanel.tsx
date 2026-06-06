import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/Button';
import { hexToRgb, rgbToHex } from '@/lib/color';
import type { StandardFontFamily } from '@/types/edits';

const FONT_OPTIONS: { value: StandardFontFamily; label: string }[] = [
  { value: 'Helvetica', label: 'Helvetica (sans)' },
  { value: 'TimesRoman', label: 'Times (serif)' },
  { value: 'Courier', label: 'Courier (mono)' },
];

/** Right-hand panel for editing the currently selected object. */
export function PropertiesPanel() {
  const edits = useEditorStore((s) => s.edits);
  const selectedId = useEditorStore((s) => s.selectedId);
  const updateEdit = useEditorStore((s) => s.updateEdit);
  const removeEdit = useEditorStore((s) => s.removeEdit);
  const beginInteraction = useEditorStore((s) => s.beginInteraction);

  const selected = edits.find((e) => e.id === selectedId);

  if (!selected) {
    return (
      <div className="w-64 shrink-0 border-l border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">
          Select the Text tool and click on the page to add text, or click an
          existing object to edit it.
        </p>
      </div>
    );
  }

  if (selected.type === 'image') {
    return (
      <div className="flex w-64 shrink-0 flex-col gap-4 border-l border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">Signature / image</h2>
        <div className="flex justify-center rounded-md border border-gray-200 bg-[repeating-conic-gradient(#f3f4f6_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-3">
          <img
            src={selected.dataUrl}
            alt="Selected signature"
            className="max-h-32 object-contain"
          />
        </div>
        <p className="text-xs text-gray-500">
          Drag to move, or use the handles to resize on the page.
        </p>
        <Button
          variant="secondary"
          className="mt-2 border-red-300 text-red-600 hover:bg-red-50"
          onClick={() => removeEdit(selected.id)}
        >
          Delete object
        </Button>
      </div>
    );
  }

  if (selected.type !== 'text') {
    const ANNOTATION_LABELS = {
      highlight: 'Highlight',
      rect: 'Rectangle',
      line: 'Line',
      freehand: 'Drawing',
      stamp: 'Stamp',
    } as const;
    const hasStroke = selected.type !== 'highlight';
    return (
      <div className="flex w-64 shrink-0 flex-col gap-4 border-l border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700">
          {ANNOTATION_LABELS[selected.type]}
        </h2>

        <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
          Color
          <input
            type="color"
            className="h-8 w-12 cursor-pointer rounded border border-gray-300"
            value={rgbToHex(selected.color)}
            onChange={(e) => {
              beginInteraction();
              updateEdit(selected.id, { color: hexToRgb(e.target.value) });
            }}
          />
        </label>

        {hasStroke && 'strokeWidth' in selected && (
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Stroke width
            <input
              type="number"
              min={1}
              max={24}
              className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-red-500 focus:outline-none"
              value={selected.strokeWidth}
              onFocus={beginInteraction}
              onChange={(e) =>
                updateEdit(selected.id, {
                  strokeWidth: Math.max(
                    1,
                    Math.min(24, Number(e.target.value) || 1),
                  ),
                })
              }
            />
          </label>
        )}

        <Button
          variant="secondary"
          className="mt-2 border-red-300 text-red-600 hover:bg-red-50"
          onClick={() => removeEdit(selected.id)}
        >
          Delete object
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-64 shrink-0 flex-col gap-4 border-l border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-700">Text</h2>

      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
        Content
        <textarea
          className="min-h-20 resize-y rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-red-500 focus:outline-none"
          value={selected.text}
          onFocus={beginInteraction}
          onChange={(e) => updateEdit(selected.id, { text: e.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
        Font size
        <input
          type="number"
          min={6}
          max={144}
          className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-red-500 focus:outline-none"
          value={selected.fontSize}
          onFocus={beginInteraction}
          onChange={(e) =>
            updateEdit(selected.id, {
              fontSize: Math.max(6, Math.min(144, Number(e.target.value) || 6)),
            })
          }
        />
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
        Font
        <select
          className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-red-500 focus:outline-none"
          value={selected.fontFamily}
          onChange={(e) => {
            beginInteraction();
            updateEdit(selected.id, {
              fontFamily: e.target.value as StandardFontFamily,
            });
          }}
        >
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
        Color
        <input
          type="color"
          className="h-8 w-12 cursor-pointer rounded border border-gray-300"
          value={rgbToHex(selected.color)}
          onChange={(e) => {
            beginInteraction();
            updateEdit(selected.id, { color: hexToRgb(e.target.value) });
          }}
        />
      </label>

      <Button
        variant="secondary"
        className="mt-2 border-red-300 text-red-600 hover:bg-red-50"
        onClick={() => removeEdit(selected.id)}
      >
        Delete object
      </Button>
    </div>
  );
}
