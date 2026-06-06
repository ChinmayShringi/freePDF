import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';
import { useToolStore } from '@/store/toolStore';

interface SignatureToolProps {
  open: boolean;
  onClose: () => void;
}

type Mode = 'draw' | 'upload';

/** Drawing canvas pixel size. Strokes are captured then trimmed on confirm. */
const PAD_WIDTH = 500;
const PAD_HEIGHT = 200;

/** A placed signature occupies at most this fraction of the page. */
const MAX_PAGE_WIDTH_FRACTION = 0.4;
const MAX_PAGE_HEIGHT_FRACTION = 0.25;

/**
 * Crop a canvas to the bounding box of its non-transparent pixels and return a
 * PNG data URL plus the cropped pixel dimensions. Returns null if the canvas is
 * empty (nothing drawn). Keeping the bounding box tight means the placed image
 * has a correct aspect ratio and no oversized invisible margin.
 */
function trimToContent(
  source: HTMLCanvasElement,
): { dataUrl: string; width: number; height: number } | null {
  const ctx = source.getContext('2d');
  if (!ctx) return null;
  const { width, height } = source;
  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) return null;

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const out = document.createElement('canvas');
  out.width = cropW;
  out.height = cropH;
  out.getContext('2d')?.drawImage(
    source,
    minX,
    minY,
    cropW,
    cropH,
    0,
    0,
    cropW,
    cropH,
  );
  return { dataUrl: out.toDataURL('image/png'), width: cropW, height: cropH };
}

/** Load an image file into a transparent canvas and return a PNG data URL. */
function fileToPng(
  file: File,
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load the image.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas is unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Modal for creating a signature by drawing on a canvas or uploading an image.
 * On confirm, the result is trimmed to a transparent PNG, sized to a sensible
 * fraction of the current page, centered, and added as an image edit.
 */
export function SignatureTool({ open, onClose }: SignatureToolProps) {
  const [mode, setMode] = useState<Mode>('draw');
  const [uploaded, setUploaded] = useState<{
    dataUrl: string;
    width: number;
    height: number;
  } | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const addImage = useEditorStore((s) => s.addImage);
  const setTool = useToolStore((s) => s.setTool);

  const resetState = useCallback(() => {
    setMode('draw');
    setUploaded(null);
    setHasInk(false);
    setError(null);
  }, []);

  // Clear the drawing canvas whenever the modal opens fresh.
  useEffect(() => {
    if (!open) return;
    resetState();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [open, resetState]);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = pointerPos(e);
    if (!pos) return;
    drawingRef.current = true;
    lastPointRef.current = pos;
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const pos = pointerPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    const last = lastPointRef.current;
    if (!pos || !ctx || !last) return;
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPointRef.current = pos;
    setHasInk(true);
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      setUploaded(await fileToPng(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the image.');
    }
  };

  const place = async (
    signature: { dataUrl: string; width: number; height: number },
  ) => {
    const { pdf, currentPage } = useDocumentStore.getState();
    if (!pdf) {
      setError('No document is open.');
      return;
    }
    const page = await pdf.getPage(currentPage);
    const viewport = page.getViewport({ scale: 1 });
    const pageW = viewport.width;
    const pageH = viewport.height;

    const ratio = signature.width / signature.height;
    let width = pageW * MAX_PAGE_WIDTH_FRACTION;
    let height = width / ratio;
    const maxHeight = pageH * MAX_PAGE_HEIGHT_FRACTION;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }

    addImage({
      pageIndex: currentPage - 1,
      x: (pageW - width) / 2,
      y: (pageH - height) / 2,
      width,
      height,
      dataUrl: signature.dataUrl,
    });
    setTool('select');
    onClose();
  };

  const handleConfirm = async () => {
    setError(null);
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const trimmed = trimToContent(canvas);
      if (!trimmed) {
        setError('Draw a signature first.');
        return;
      }
      await place(trimmed);
    } else {
      if (!uploaded) {
        setError('Choose an image first.');
        return;
      }
      await place(uploaded);
    }
  };

  const canConfirm = mode === 'draw' ? hasInk : uploaded !== null;

  return (
    <Modal open={open} title="Add signature" onClose={onClose}>
      <div className="mb-4 flex gap-1 rounded-md bg-gray-100 p-1 dark:bg-gray-800">
        {(['draw', 'upload'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            aria-pressed={mode === m}
            className={`flex-1 rounded px-3 py-1.5 text-sm font-medium capitalize transition ${
              mode === m
                ? 'bg-white text-red-600 shadow-sm dark:bg-gray-700 dark:text-red-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'draw' ? (
        <div>
          <canvas
            ref={canvasRef}
            width={PAD_WIDTH}
            height={PAD_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full touch-none rounded-md border border-dashed border-gray-300 bg-white"
            style={{ aspectRatio: `${PAD_WIDTH} / ${PAD_HEIGHT}`, cursor: 'crosshair' }}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">Draw your signature above.</p>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <div>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Choose an image
            </span>
            <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              PNG with transparency works best
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
          {uploaded && (
            <div className="mt-3 flex justify-center rounded-md border border-gray-200 bg-[repeating-conic-gradient(#f3f4f6_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-3">
              <img
                src={uploaded.dataUrl}
                alt="Signature preview"
                className="max-h-32 object-contain"
              />
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
          Add to page
        </Button>
      </div>
    </Modal>
  );
}
