import { useCallback, useRef, useState } from 'react';

/**
 * Phase 0 skeleton: a privacy-first landing surface with a working file picker.
 *
 * The selected file is held only in component state for now; later phases route
 * it into the document store and the PDF.js viewer. Nothing is ever uploaded.
 */
export function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const onPick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      setFileSize(file.size);
    },
    [],
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
          <span className="text-sm text-gray-500">
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

        <button
          type="button"
          onClick={onPick}
          className="mt-10 rounded-lg bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          Upload a PDF
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={onFileChange}
        />

        {fileName && (
          <p className="mt-6 text-sm text-gray-600">
            Selected: <span className="font-medium">{fileName}</span>
            {fileSize != null && (
              <span className="text-gray-400">
                {' '}
                ({(fileSize / 1024 / 1024).toFixed(2)} MB, stays in your browser)
              </span>
            )}
          </p>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 text-center text-sm text-gray-500">
          100% client-side. Open source. MIT licensed.
        </div>
      </footer>
    </div>
  );
}
