import { useCallback, useRef, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { Button } from '@/components/ui/Button';

/** Landing page: privacy promise plus a file picker with drag-and-drop. */
export function Home() {
  const loadFromFile = useDocumentStore((s) => s.loadFromFile);
  const status = useDocumentStore((s) => s.status);
  const error = useDocumentStore((s) => s.error);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const isLoading = status === 'loading';

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      void loadFromFile(file);
    },
    [loadFromFile],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      handleFile(event.dataTransfer.files?.[0]);
    },
    [handleFile],
  );

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-red-600 px-2 py-1 text-sm font-bold text-white">
              PDF
            </span>
            <span className="text-lg font-semibold">freePDF</span>
          </div>
          <span className="hidden text-sm text-gray-500 sm:inline">
            No upload. No paywall. No watermark.
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          The actually free PDF editor
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-600">
          Edit and download your PDF right in your browser. Your files never
          leave your device.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mt-10 flex w-full max-w-xl flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 transition ${
            dragging
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 bg-white'
          }`}
        >
          <p className="mb-4 text-gray-600">
            Drag and drop a PDF here, or
          </p>
          <Button
            variant="primary"
            className="px-8 py-4 text-lg"
            disabled={isLoading}
            onClick={() => inputRef.current?.click()}
          >
            {isLoading ? 'Opening…' : 'Choose a PDF'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {error && (
            <p
              role="alert"
              className="mt-4 text-sm font-medium text-red-600"
            >
              {error}
            </p>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 text-center text-sm text-gray-500">
          100% client-side. Open source. MIT licensed.
        </div>
      </footer>
    </div>
  );
}
