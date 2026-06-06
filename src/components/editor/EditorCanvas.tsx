import { useEffect, useRef } from 'react';
import { Stage, Layer, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useEditorStore } from '@/store/editorStore';
import { useToolStore } from '@/store/toolStore';
import { rgbToHex } from '@/lib/color';
import type { TextEdit } from '@/types/edits';

interface EditorCanvasProps {
  pageIndex: number;
  /** Page size as displayed at the current zoom, in CSS pixels. */
  width: number;
  height: number;
  /** Current zoom scale, mapping display points -> CSS pixels. */
  scale: number;
}

/**
 * Konva overlay sitting exactly on top of one rendered page. Handles placing,
 * selecting, and dragging text objects. Edits are stored in display space
 * (scale 1), so this component multiplies by `scale` going to the canvas and
 * divides by `scale` coming back.
 */
export function EditorCanvas({
  pageIndex,
  width,
  height,
  scale,
}: EditorCanvasProps) {
  const allEdits = useEditorStore((s) => s.edits);
  const selectedId = useEditorStore((s) => s.selectedId);
  const addText = useEditorStore((s) => s.addText);
  const updateEdit = useEditorStore((s) => s.updateEdit);
  const beginInteraction = useEditorStore((s) => s.beginInteraction);
  const select = useEditorStore((s) => s.select);

  const activeTool = useToolStore((s) => s.activeTool);
  const setTool = useToolStore((s) => s.setTool);
  const textDefaults = useToolStore((s) => s.textDefaults);

  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const pageEdits = allEdits.filter(
    (e): e is TextEdit => e.type === 'text' && e.pageIndex === pageIndex,
  );
  const selectionOnThisPage = pageEdits.some((e) => e.id === selectedId);

  // Keep the transformer attached to the currently-selected node on this page.
  useEffect(() => {
    const tr = transformerRef.current;
    const layer = layerRef.current;
    if (!tr || !layer) return;
    if (!selectionOnThisPage || !selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = layer.findOne(`#${selectedId}`);
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, selectionOnThisPage, pageEdits]);

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    // Only act on clicks that hit the empty stage, not an existing object.
    const clickedEmpty = e.target === e.target.getStage();
    if (!clickedEmpty) return;

    if (activeTool === 'text') {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos) return;
      addText({
        pageIndex,
        x: pos.x / scale,
        y: pos.y / scale,
        fontSize: textDefaults.fontSize,
        color: textDefaults.color,
        fontFamily: textDefaults.fontFamily,
      });
      // Drop back to select so the new object can be moved/edited immediately.
      setTool('select');
    } else {
      select(null);
    }
  };

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={handleStageMouseDown}
      style={{ cursor: activeTool === 'text' ? 'crosshair' : 'default' }}
    >
      <Layer ref={layerRef}>
        {pageEdits.map((edit) => (
          <Text
            key={edit.id}
            id={edit.id}
            text={edit.text}
            x={edit.x * scale}
            y={edit.y * scale}
            fontSize={edit.fontSize * scale}
            fontFamily={edit.fontFamily === 'TimesRoman' ? 'serif' : edit.fontFamily === 'Courier' ? 'monospace' : 'sans-serif'}
            fill={rgbToHex(edit.color)}
            draggable={activeTool === 'select'}
            onMouseDown={(e) => {
              e.cancelBubble = true;
              select(edit.id);
            }}
            onTap={() => select(edit.id)}
            onDragStart={beginInteraction}
            onDragEnd={(e) => {
              updateEdit(edit.id, {
                x: e.target.x() / scale,
                y: e.target.y() / scale,
              });
            }}
          />
        ))}
        <Transformer
          ref={transformerRef}
          resizeEnabled={false}
          rotateEnabled={false}
          borderStroke="#dc2626"
          borderStrokeWidth={1.5}
        />
      </Layer>
    </Stage>
  );
}
