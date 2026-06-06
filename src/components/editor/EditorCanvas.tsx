import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Line, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useEditorStore } from '@/store/editorStore';
import { useToolStore } from '@/store/toolStore';
import { rgbToHex } from '@/lib/color';
import { HIGHLIGHT_OPACITY } from '@/types/edits';
import {
  ImageNode,
  PolylineNode,
  RectNode,
  StampNode,
  TextNode,
  isResizable,
  MIN_SHAPE_SIZE,
} from '@/components/editor/overlayNodes';

interface EditorCanvasProps {
  pageIndex: number;
  /** Page size as displayed at the current zoom, in CSS pixels. */
  width: number;
  height: number;
  /** Current zoom scale, mapping display points -> CSS pixels. */
  scale: number;
}

/** Tools that create a shape by dragging out an area or path. */
const DRAW_TOOLS = new Set(['highlight', 'rect', 'line', 'freehand']);

/** Minimum drag extent (display points) before a shape is kept. */
const MIN_DRAW_EXTENT = 4;

type RectDraft = {
  kind: 'highlight' | 'rect';
  startX: number;
  startY: number;
  curX: number;
  curY: number;
};
type LineDraft = {
  kind: 'line';
  startX: number;
  startY: number;
  curX: number;
  curY: number;
};
type FreehandDraft = { kind: 'freehand'; points: number[] };
type Draft = RectDraft | LineDraft | FreehandDraft;

/**
 * Konva overlay sitting exactly on top of one rendered page. Handles placing,
 * selecting, dragging, resizing, and drawing overlay objects. Edits are stored
 * in display space (scale 1), so this component multiplies by `scale` going to
 * the canvas and divides by `scale` coming back.
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
  const addEdit = useEditorStore((s) => s.addEdit);
  const updateEdit = useEditorStore((s) => s.updateEdit);
  const beginInteraction = useEditorStore((s) => s.beginInteraction);
  const select = useEditorStore((s) => s.select);

  const activeTool = useToolStore((s) => s.activeTool);
  const setTool = useToolStore((s) => s.setTool);
  const textDefaults = useToolStore((s) => s.textDefaults);
  const annotationDefaults = useToolStore((s) => s.annotationDefaults);

  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Draft is mirrored in a ref so the mouse-up handler always reads the latest.
  const [draft, setDraftState] = useState<Draft | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const setDraft = (next: Draft | null) => {
    draftRef.current = next;
    setDraftState(next);
  };

  const pageEdits = allEdits.filter((e) => e.pageIndex === pageIndex);
  const selectedEdit = pageEdits.find((e) => e.id === selectedId);
  const selectionOnThisPage = selectedEdit !== undefined;
  const selectable = activeTool === 'select';
  const isDrawTool = DRAW_TOOLS.has(activeTool);
  const isStampTool = activeTool === 'check' || activeTool === 'x';

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

  const displayPos = (e: KonvaEventObject<unknown>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x / scale, y: pos.y / scale };
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const clickedEmpty = e.target === e.target.getStage();
    const pos = displayPos(e);

    if (isDrawTool && pos) {
      if (activeTool === 'freehand') {
        setDraft({ kind: 'freehand', points: [pos.x, pos.y] });
      } else if (activeTool === 'line') {
        setDraft({ kind: 'line', startX: pos.x, startY: pos.y, curX: pos.x, curY: pos.y });
      } else {
        setDraft({
          kind: activeTool as 'highlight' | 'rect',
          startX: pos.x,
          startY: pos.y,
          curX: pos.x,
          curY: pos.y,
        });
      }
      return;
    }

    if (isStampTool && pos) {
      const { color, strokeWidth, stampSize } = annotationDefaults;
      addEdit({
        type: 'stamp',
        kind: activeTool === 'check' ? 'check' : 'x',
        pageIndex,
        x: pos.x - stampSize / 2,
        y: pos.y - stampSize / 2,
        size: stampSize,
        color,
        strokeWidth,
      });
      setTool('select');
      return;
    }

    if (!clickedEmpty) return;

    if (activeTool === 'text' && pos) {
      addText({
        pageIndex,
        x: pos.x,
        y: pos.y,
        fontSize: textDefaults.fontSize,
        color: textDefaults.color,
        fontFamily: textDefaults.fontFamily,
      });
      setTool('select');
    } else {
      select(null);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const current = draftRef.current;
    if (!current) return;
    const pos = displayPos(e);
    if (!pos) return;
    if (current.kind === 'freehand') {
      setDraft({ ...current, points: [...current.points, pos.x, pos.y] });
    } else {
      setDraft({ ...current, curX: pos.x, curY: pos.y });
    }
  };

  const commitDraft = () => {
    const current = draftRef.current;
    if (!current) return;
    setDraft(null);
    const { color, highlightColor, strokeWidth } = annotationDefaults;

    if (current.kind === 'freehand') {
      const pts = current.points;
      if (pts.length < 4) return;
      const ox = pts[0];
      const oy = pts[1];
      const rel = pts.map((v, i) => (i % 2 === 0 ? v - ox : v - oy));
      addEdit({
        type: 'freehand',
        pageIndex,
        x: ox,
        y: oy,
        points: rel,
        color,
        strokeWidth,
      });
      return;
    }

    if (current.kind === 'line') {
      const dx = current.curX - current.startX;
      const dy = current.curY - current.startY;
      if (Math.hypot(dx, dy) < MIN_DRAW_EXTENT) return;
      addEdit({
        type: 'line',
        pageIndex,
        x: current.startX,
        y: current.startY,
        points: [0, 0, dx, dy],
        color,
        strokeWidth,
      });
      return;
    }

    // rectangle or highlight
    const x = Math.min(current.startX, current.curX);
    const y = Math.min(current.startY, current.curY);
    const w = Math.abs(current.curX - current.startX);
    const h = Math.abs(current.curY - current.startY);
    if (w < MIN_DRAW_EXTENT || h < MIN_DRAW_EXTENT) return;
    if (current.kind === 'highlight') {
      addEdit({
        type: 'highlight',
        pageIndex,
        x,
        y,
        width: w,
        height: h,
        color: highlightColor,
      });
    } else {
      addEdit({
        type: 'rect',
        pageIndex,
        x,
        y,
        width: w,
        height: h,
        color,
        strokeWidth,
      });
    }
  };

  const cursor =
    activeTool === 'text' || isDrawTool || isStampTool ? 'crosshair' : 'default';

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={commitDraft}
      onMouseLeave={commitDraft}
      style={{ cursor }}
    >
      <Layer ref={layerRef}>
        {pageEdits.map((edit) => {
          const common = {
            scale,
            selectable,
            onSelect: () => select(edit.id),
            onDragStart: beginInteraction,
          };
          switch (edit.type) {
            case 'text':
              return (
                <TextNode
                  key={edit.id}
                  edit={edit}
                  {...common}
                  onChange={(patch) => updateEdit(edit.id, patch)}
                />
              );
            case 'image':
              return (
                <ImageNode
                  key={edit.id}
                  edit={edit}
                  {...common}
                  onChange={(patch) => updateEdit(edit.id, patch)}
                />
              );
            case 'highlight':
            case 'rect':
              return (
                <RectNode
                  key={edit.id}
                  edit={edit}
                  {...common}
                  onChange={(patch) => updateEdit(edit.id, patch)}
                />
              );
            case 'line':
            case 'freehand':
              return (
                <PolylineNode
                  key={edit.id}
                  edit={edit}
                  {...common}
                  onChange={(patch) => updateEdit(edit.id, patch)}
                />
              );
            case 'stamp':
              return (
                <StampNode
                  key={edit.id}
                  edit={edit}
                  {...common}
                  onChange={(patch) => updateEdit(edit.id, patch)}
                />
              );
            default:
              return null;
          }
        })}

        {draft && <DraftPreview draft={draft} scale={scale} defaults={annotationDefaults} />}

        <Transformer
          ref={transformerRef}
          resizeEnabled={isResizable(selectedEdit)}
          rotateEnabled={false}
          keepRatio={false}
          borderStroke="#dc2626"
          borderStrokeWidth={1.5}
          anchorStroke="#dc2626"
          anchorSize={8}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < MIN_SHAPE_SIZE || newBox.height < MIN_SHAPE_SIZE
              ? oldBox
              : newBox
          }
        />
      </Layer>
    </Stage>
  );
}

interface DraftPreviewProps {
  draft: Draft;
  scale: number;
  defaults: {
    color: { r: number; g: number; b: number };
    highlightColor: { r: number; g: number; b: number };
    strokeWidth: number;
  };
}

/** Live preview of the shape currently being drawn. */
function DraftPreview({ draft, scale, defaults }: DraftPreviewProps) {
  if (draft.kind === 'freehand') {
    return (
      <Line
        points={draft.points.map((p) => p * scale)}
        stroke={rgbToHex(defaults.color)}
        strokeWidth={defaults.strokeWidth * scale}
        lineCap="round"
        lineJoin="round"
        listening={false}
      />
    );
  }
  if (draft.kind === 'line') {
    return (
      <Line
        points={[draft.startX, draft.startY, draft.curX, draft.curY].map(
          (p) => p * scale,
        )}
        stroke={rgbToHex(defaults.color)}
        strokeWidth={defaults.strokeWidth * scale}
        lineCap="round"
        listening={false}
      />
    );
  }
  const x = Math.min(draft.startX, draft.curX) * scale;
  const y = Math.min(draft.startY, draft.curY) * scale;
  const w = Math.abs(draft.curX - draft.startX) * scale;
  const h = Math.abs(draft.curY - draft.startY) * scale;
  const isHighlight = draft.kind === 'highlight';
  const hex = rgbToHex(isHighlight ? defaults.highlightColor : defaults.color);
  return (
    <Rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill={isHighlight ? hex : undefined}
      opacity={isHighlight ? HIGHLIGHT_OPACITY : 1}
      stroke={isHighlight ? undefined : hex}
      strokeWidth={isHighlight ? 0 : defaults.strokeWidth * scale}
      listening={false}
    />
  );
}
