import { useDocumentStore } from '@/store/documentStore';
import { Home } from '@/app/routes/Home';
import { Editor } from '@/app/routes/Editor';

/**
 * Top-level view switch. With no document loaded we show the landing page; once
 * a PDF is parsed we show the editor. Routing stays this simple until the
 * post-launch SEO tool pages land.
 */
export function App() {
  const status = useDocumentStore((s) => s.status);
  return status === 'ready' ? <Editor /> : <Home />;
}
