import { useRef, useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useFontStore } from '@/store/fontStore';
import { Button } from '@/components/ui/Button';
import { hexToRgb, rgbToHex } from '@/lib/color';

/** Right-hand panel for editing the currently selected object. */
export function PropertiesPanel() {
  const edits = useEditorStore((s) => s.edits);
  const selectedId = useEditorStore((s) => s.selectedId);
  const updateEdit = useEditorStore((s) => s.updateEdit);
  const removeEdit = useEditorStore((s) => s.removeEdit);
  const beginInteraction = useEditorStore((s) => s.beginInteraction);

  const fontOptions = useFontStore((s) => s.options);
  const addCustomFont = useFontStore((s) => s.addCustomFont);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const [fontError, setFontError] = useState<string | null>(null);

  const selected = edits.find((e) => e.id === selectedId);

  if (!selected) {
    return (
      <div className="w-64 shrink-0 border-l border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">
          Double-click existing text in the PDF to edit it in place. Or pick a
          tool to add text, sign, or annotate, and click an object to adjust it.
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
      cover: 'Cover',
      highlight: 'Highlight',
      rect: 'Rectangle',
      line: 'Line',
      freehand: 'Drawing',
      stamp: 'Stamp',
    } as const;
    const hasStroke = selected.type !== 'highlight' && selected.type !== 'cover';
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
            onFocus={beginInteraction}
            onChange={(e) =>
              updateEdit(selected.id, { color: hexToRgb(e.target.value) })
            }
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
            updateEdit(selected.id, { fontFamily: e.target.value });
          }}
        >
          {fontOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => fontInputRef.current?.click()}
          className="mt-1 self-start text-xs font-medium text-red-600 hover:text-red-700"
        >
          + Upload font
        </button>
        <input
          ref={fontInputRef}
          type="file"
          accept=".ttf,.otf,font/ttf,font/otf"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setFontError(null);
            const result = await addCustomFont(file);
            if ('error' in result) {
              setFontError(result.error);
              return;
            }
            beginInteraction();
            updateEdit(selected.id, { fontFamily: result.id });
          }}
        />
        {fontError && <span className="text-xs text-red-600">{fontError}</span>}
      </label>

      <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
        Color
        <input
          type="color"
          className="h-8 w-12 cursor-pointer rounded border border-gray-300"
          value={rgbToHex(selected.color)}
          onFocus={beginInteraction}
          onChange={(e) =>
            updateEdit(selected.id, { color: hexToRgb(e.target.value) })
          }
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
