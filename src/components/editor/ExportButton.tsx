import { useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useEditorStore } from '@/store/editorStore';
import { Button } from '@/components/ui/Button';
import {
  buildEditedPdf,
  downloadPdf,
  editedFileName,
} from '@/lib/pdf/exportPdf';

/** Builds the edited PDF in-browser and triggers a download. No watermark. */
export function ExportButton() {
  const originalBytes = useDocumentStore((s) => s.originalBytes);
  const fileName = useDocumentStore((s) => s.fileName);
  const edits = useEditorStore((s) => s.edits);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDownload = async () => {
    if (!originalBytes) return;
    setBusy(true);
    setError(null);
    try {
      // Clone the pristine bytes: pdf-lib's load can detach the buffer, and we
      // must keep the original intact for further edits and re-exports.
      const bytes = await buildEditedPdf(originalBytes.slice(), edits);
      downloadPdf(bytes, editedFileName(fileName));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Export failed. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <Button
        variant="primary"
        onClick={onDownload}
        disabled={busy || !originalBytes}
      >
        {busy ? 'Preparing…' : 'Download'}
      </Button>
    </div>
  );
}
