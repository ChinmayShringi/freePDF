import { useEffect, useState } from 'react';
import { Text, Image as KonvaImage, Rect, Line, Group } from 'react-konva';
import { rgbToHex } from '@/lib/color';
import {
  HIGHLIGHT_OPACITY,
  stampStrokes,
  type EditObject,
  type ImageEdit,
  type PolylineEdit,
  type RectEdit,
  type HighlightEdit,
  type StampEdit,
  type TextEdit,
} from '@/types/edits';

/** Minimum size (display points) a resizable shape can shrink to. */
export const MIN_SHAPE_SIZE = 8;

/** Edit types that support resize handles (the rest are drag-only). */
export function isResizable(edit: EditObject | undefined): boolean {
  return (
    edit?.type === 'image' ||
    edit?.type === 'rect' ||
    edit?.type === 'highlight'
  );
}

interface NodeProps<T extends EditObject> {
  edit: T;
  scale: number;
  selectable: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<T>) => void;
  onDragStart: () => void;
}

/** Shared drag handler producing a display-space {x, y} patch. */
function dragPatch(scale: number) {
  return (e: { target: { x: () => number; y: () => number } }) => ({
    x: e.target.x() / scale,
    y: e.target.y() / scale,
  });
}

/** Load a data URL into an HTMLImageElement for react-konva. */
function useDataUrlImage(dataUrl: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImage(img);
    img.src = dataUrl;
    return () => {
      img.onload = null;
    };
  }, [dataUrl]);
  return image;
}

export function TextNode({
  edit,
  scale,
  selectable,
  onSelect,
  onChange,
  onDragStart,
}: NodeProps<TextEdit>) {
  return (
    <Text
      id={edit.id}
      text={edit.text}
      x={edit.x * scale}
      y={edit.y * scale}
      fontSize={edit.fontSize * scale}
      fontFamily={
        edit.fontFamily === 'TimesRoman'
          ? 'serif'
          : edit.fontFamily === 'Courier'
            ? 'monospace'
            : 'sans-serif'
      }
      fill={rgbToHex(edit.color)}
      draggable={selectable}
      onMouseDown={(e) => {
        if (!selectable) return;
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragEnd={(e) => onChange(dragPatch(scale)(e))}
    />
  );
}

/** Resize a rect-like node: bake the transform scale into width/height. */
function rectTransformEnd(scale: number) {
  return (e: { target: import('konva/lib/Node').Node }) => {
    const node = e.target;
    const width = Math.max(MIN_SHAPE_SIZE, (node.width() * node.scaleX()) / scale);
    const height = Math.max(
      MIN_SHAPE_SIZE,
      (node.height() * node.scaleY()) / scale,
    );
    node.scaleX(1);
    node.scaleY(1);
    return {
      x: node.x() / scale,
      y: node.y() / scale,
      width,
      height,
    };
  };
}

export function ImageNode({
  edit,
  scale,
  selectable,
  onSelect,
  onChange,
  onDragStart,
}: NodeProps<ImageEdit>) {
  const image = useDataUrlImage(edit.dataUrl);
  // Render even before the bitmap loads so the Transformer has bounds to attach.
  return (
    <KonvaImage
      id={edit.id}
      image={image ?? undefined}
      x={edit.x * scale}
      y={edit.y * scale}
      width={edit.width * scale}
      height={edit.height * scale}
      draggable={selectable}
      onMouseDown={(e) => {
        if (!selectable) return;
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragEnd={(e) => onChange(dragPatch(scale)(e))}
      onTransformStart={onDragStart}
      onTransformEnd={(e) => onChange(rectTransformEnd(scale)(e))}
    />
  );
}

export function RectNode({
  edit,
  scale,
  selectable,
  onSelect,
  onChange,
  onDragStart,
}: NodeProps<RectEdit | HighlightEdit>) {
  const isHighlight = edit.type === 'highlight';
  const hex = rgbToHex(edit.color);
  return (
    <Rect
      id={edit.id}
      x={edit.x * scale}
      y={edit.y * scale}
      width={edit.width * scale}
      height={edit.height * scale}
      fill={isHighlight ? hex : undefined}
      opacity={isHighlight ? HIGHLIGHT_OPACITY : 1}
      stroke={isHighlight ? undefined : hex}
      strokeWidth={isHighlight ? 0 : (edit as RectEdit).strokeWidth * scale}
      draggable={selectable}
      onMouseDown={(e) => {
        if (!selectable) return;
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragEnd={(e) => onChange(dragPatch(scale)(e))}
      onTransformStart={onDragStart}
      onTransformEnd={(e) => onChange(rectTransformEnd(scale)(e))}
    />
  );
}

export function PolylineNode({
  edit,
  scale,
  selectable,
  onSelect,
  onChange,
  onDragStart,
}: NodeProps<PolylineEdit>) {
  return (
    <Line
      id={edit.id}
      x={edit.x * scale}
      y={edit.y * scale}
      points={edit.points.map((p) => p * scale)}
      stroke={rgbToHex(edit.color)}
      strokeWidth={edit.strokeWidth * scale}
      lineCap="round"
      lineJoin="round"
      hitStrokeWidth={Math.max(12, edit.strokeWidth * scale)}
      draggable={selectable}
      onMouseDown={(e) => {
        if (!selectable) return;
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragEnd={(e) => onChange(dragPatch(scale)(e))}
    />
  );
}

export function StampNode({
  edit,
  scale,
  selectable,
  onSelect,
  onChange,
  onDragStart,
}: NodeProps<StampEdit>) {
  const hex = rgbToHex(edit.color);
  return (
    <Group
      id={edit.id}
      x={edit.x * scale}
      y={edit.y * scale}
      draggable={selectable}
      onMouseDown={(e) => {
        if (!selectable) return;
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragEnd={(e) => onChange(dragPatch(scale)(e))}
    >
      {stampStrokes(edit.kind, edit.size).map((stroke, i) => (
        <Line
          key={i}
          points={stroke.map((p) => p * scale)}
          stroke={hex}
          strokeWidth={edit.strokeWidth * scale}
          lineCap="round"
          lineJoin="round"
        />
      ))}
    </Group>
  );
}
