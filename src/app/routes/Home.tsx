import { useCallback, useRef, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { GitHubLink } from '@/components/ui/GitHubLink';
import { SUPPORT_URL } from '@/config';

const FEATURES = [
  { title: 'Add & edit text', body: 'Add text anywhere, or double-click existing text to replace it.' },
  { title: 'Sign', body: 'Draw or upload a signature, then place and resize it.' },
  { title: 'Annotate', body: 'Highlight, draw freehand, add boxes, lines, checks, and X marks.' },
  { title: 'Organize pages', body: 'Merge, split, rotate, reorder, and delete pages.' },
  { title: 'Custom fonts', body: 'Pick a font or upload your own TTF/OTF.' },
  { title: 'No watermark', body: 'Download the result free, with no watermark and no signup.' },
];

const FAQS = [
  {
    q: 'Is this PDF editor really free?',
    a: 'Yes. Every edit and export is free, with no watermark and no signup. Editing runs entirely in your browser, so there is no server cost to pass on.',
  },
  {
    q: 'Are my files uploaded anywhere?',
    a: 'No. Your PDF is opened and edited in your browser and never leaves your device. Closing the tab discards everything.',
  },
  {
    q: 'Can I edit existing text in a PDF?',
    a: 'Yes, best-effort: double-click a line of text to cover the original and type a replacement that matches its font and size.',
  },
  {
    q: 'What can I do with it?',
    a: 'Add text, sign, highlight, draw, add shapes, merge, split, rotate, reorder and delete pages, replace text, and use custom fonts, then export with no watermark.',
  },
];

/** Landing page: privacy promise, file picker, and SEO content. */
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
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-red-600 px-2 py-1 text-sm font-bold text-white">
              PDF
            </span>
            <span className="text-lg font-semibold">freePDF</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2 hidden text-sm text-gray-500 dark:text-gray-400 sm:inline">
              No upload. No paywall. No watermark.
            </span>
            <GitHubLink />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Free PDF editor, right in your browser
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-400">
          Edit, sign, and annotate PDFs and download them free, with no
          watermark and no signup. Your files never leave your device.
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
              ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
              : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900'
          }`}
        >
          <p className="mb-4 text-gray-600 dark:text-gray-400">
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
            <p role="alert" className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        <section className="mt-20 w-full" aria-labelledby="features-heading">
          <h2 id="features-heading" className="text-2xl font-bold tracking-tight">
            Everything you need to edit a PDF
          </h2>
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
              >
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 w-full max-w-3xl text-left" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-2xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="mt-6 space-y-4">
            {FAQS.map((item) => (
              <div
                key={item.q}
                className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
              >
                <h3 className="font-semibold">{item.q}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          <span>100% client-side. Open source. MIT licensed.</span>
          <span className="flex items-center gap-3">
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-pink-50 px-3 py-1 font-medium text-pink-600 transition hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-300"
            >
              Tip jar (optional)
            </a>
            <GitHubLink withLabel />
          </span>
        </div>
      </footer>
    </div>
  );
}
