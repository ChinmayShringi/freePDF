import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Text, Image as KonvaImage, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useEditorStore } from '@/store/editorStore';
import { useToolStore } from '@/store/toolStore';
import { rgbToHex } from '@/lib/color';
import type { ImageEdit, TextEdit } from '@/types/edits';

interface EditorCanvasProps {
  pageIndex: number;
  /** Page size as displayed at the current zoom, in CSS pixels. */
  width: number;
  height: number;
  /** Current zoom scale, mapping display points -> CSS pixels. */
  scale: number;
}

/** Minimum size (display points) an image can be resized down to. */
const MIN_IMAGE_SIZE = 8;

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

interface ImageNodeProps {
  edit: ImageEdit;
  scale: number;
  draggable: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ImageEdit>) => void;
  onDragStart: () => void;
}

/** A single placed signature/image rendered on the Konva layer. */
function ImageNode({
  edit,
  scale,
  draggable,
  onSelect,
  onChange,
  onDragStart,
}: ImageNodeProps) {
  const image = useDataUrlImage(edit.dataUrl);

  // Render the node even before the bitmap loads (with no image) so it has
  // bounds the Transformer can attach to immediately after placement.
  return (
    <KonvaImage
      id={edit.id}
      image={image ?? undefined}
      x={edit.x * scale}
      y={edit.y * scale}
      width={edit.width * scale}
      height={edit.height * scale}
      draggable={draggable}
      onMouseDown={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        onChange({ x: e.target.x() / scale, y: e.target.y() / scale });
      }}
      onTransformStart={onDragStart}
      onTransformEnd={(e) => {
        const node = e.target;
        const nextWidth = Math.max(
          MIN_IMAGE_SIZE,
          (node.width() * node.scaleX()) / scale,
        );
        const nextHeight = Math.max(
          MIN_IMAGE_SIZE,
          (node.height() * node.scaleY()) / scale,
        );
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x() / scale,
          y: node.y() / scale,
          width: nextWidth,
          height: nextHeight,
        });
      }}
    />
  );
}

/**
 * Konva overlay sitting exactly on top of one rendered page. Handles placing,
 * selecting, dragging, and resizing overlay objects. Edits are stored in
 * display space (scale 1), so this component multiplies by `scale` going to the
 * canvas and divides by `scale` coming back.
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

  const textEdits = allEdits.filter(
    (e): e is TextEdit => e.type === 'text' && e.pageIndex === pageIndex,
  );
  const imageEdits = allEdits.filter(
    (e): e is ImageEdit => e.type === 'image' && e.pageIndex === pageIndex,
  );

  const selectedImage = imageEdits.find((e) => e.id === selectedId) ?? null;
  const selectionOnThisPage =
    textEdits.some((e) => e.id === selectedId) || selectedImage !== null;

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
  }, [selectedId, selectionOnThisPage, textEdits, imageEdits]);

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
        {imageEdits.map((edit) => (
          <ImageNode
            key={edit.id}
            edit={edit}
            scale={scale}
            draggable={activeTool === 'select'}
            onSelect={() => select(edit.id)}
            onChange={(patch) => updateEdit(edit.id, patch)}
            onDragStart={beginInteraction}
          />
        ))}
        {textEdits.map((edit) => (
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
          resizeEnabled={selectedImage !== null}
          rotateEnabled={false}
          keepRatio={false}
          borderStroke="#dc2626"
          borderStrokeWidth={1.5}
          anchorStroke="#dc2626"
          anchorSize={8}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < MIN_IMAGE_SIZE || newBox.height < MIN_IMAGE_SIZE
              ? oldBox
              : newBox
          }
        />
      </Layer>
    </Stage>
  );
}
