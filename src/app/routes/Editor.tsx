import { useEffect, useState } from 'react';
import { Toolbar } from '@/components/editor/Toolbar';
import { ThumbnailStrip } from '@/components/editor/ThumbnailStrip';
import { PdfViewer } from '@/components/editor/PdfViewer';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { SignatureTool } from '@/components/tools/SignatureTool';
import { EditorFooter } from '@/components/editor/EditorFooter';
import { useEditorStore } from '@/store/editorStore';

/**
 * Editor layout: toolbar on top, thumbnails on the left, page canvas in the
 * center, and the properties panel on the right.
 */
export function Editor() {
  const [signatureOpen, setSignatureOpen] = useState(false);

  // Undo/redo keyboard shortcuts. Skip when typing in a field so editing text
  // content keeps the browser's native undo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const store = useEditorStore.getState();
        if (e.shiftKey) store.redo();
        else store.undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Warn before leaving with unsaved edits. Everything lives in memory, so the
  // tab closing already discards it; this just prevents accidental data loss.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useEditorStore.getState().edits.length === 0) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <Toolbar onOpenSignature={() => setSignatureOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <ThumbnailStrip />
        <div className="min-w-0 flex-1">
          <PdfViewer />
        </div>
        <PropertiesPanel />
      </div>
      <EditorFooter />
      <SignatureTool
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
      />
    </div>
  );
}
