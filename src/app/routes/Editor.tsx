import { Toolbar } from '@/components/editor/Toolbar';
import { ThumbnailStrip } from '@/components/editor/ThumbnailStrip';
import { PdfViewer } from '@/components/editor/PdfViewer';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';

/**
 * Editor layout: toolbar on top, thumbnails on the left, page canvas in the
 * center, and the properties panel on the right.
 */
export function Editor() {
  return (
    <div className="flex h-full flex-col">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <ThumbnailStrip />
        <div className="min-w-0 flex-1">
          <PdfViewer />
        </div>
        <PropertiesPanel />
      </div>
    </div>
  );
}
