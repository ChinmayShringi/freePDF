import { create } from 'zustand';
import notoUrl from '@/assets/fonts/NotoSans-Regular.ttf?url';

/**
 * Font system. Built-in fonts (the three PDF standards plus the bundled Noto
 * Sans for Unicode) are always available; users can upload custom TTF/OTF fonts
 * which are registered for on-canvas rendering (FontFace API) and embedded as a
 * subset on export (pdf-lib + fontkit). Custom fonts live in memory only and are
 * gone when the tab closes, consistent with the no-upload privacy model.
 */

export interface FontOption {
  id: string;
  label: string;
  /** CSS font-family used to render this font on the Konva overlay. */
  cssFamily: string;
}

/** CSS family name used to render the bundled Noto Sans on canvas. */
const NOTO_CSS_FAMILY = '"FreePDF Noto Sans", sans-serif';

const BUILTIN_OPTIONS: FontOption[] = [
  { id: 'Helvetica', label: 'Helvetica (sans)', cssFamily: 'Helvetica, Arial, sans-serif' },
  { id: 'TimesRoman', label: 'Times (serif)', cssFamily: '"Times New Roman", Times, serif' },
  { id: 'Courier', label: 'Courier (mono)', cssFamily: '"Courier New", Courier, monospace' },
  { id: 'NotoSans', label: 'Noto Sans (Unicode)', cssFamily: NOTO_CSS_FAMILY },
];

const hasFontApi =
  typeof document !== 'undefined' &&
  'fonts' in document &&
  typeof FontFace !== 'undefined';

/** Register a font with the document so Konva/canvas can render it. */
async function registerFontFace(
  family: string,
  source: ArrayBuffer,
): Promise<void> {
  if (!hasFontApi) return;
  const face = new FontFace(family, source);
  await face.load();
  document.fonts.add(face);
}

interface FontState {
  /** All pickable fonts (built-ins first, then uploaded). */
  options: FontOption[];
  /** Custom font bytes by id, for embedding on export. */
  customBytes: Record<string, Uint8Array>;
  /** Add an uploaded font. Returns its id, or an error message. */
  addCustomFont: (file: File) => Promise<{ id: string } | { error: string }>;
}

export const useFontStore = create<FontState>((set) => {
  // Register the bundled Noto Sans for on-canvas rendering, lazily and without
  // blocking startup. Export embeds Noto via its own path, so this is render-only.
  if (hasFontApi) {
    void fetch(notoUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => registerFontFace('FreePDF Noto Sans', buf))
      .catch(() => {});
  }

  return {
    options: BUILTIN_OPTIONS,
    customBytes: {},

    addCustomFont: async (file) => {
      try {
        const buf = await file.arrayBuffer();
        const id = `custom-${crypto.randomUUID()}`;
        const family = `freepdf-${id}`;
        // FontFace copies the buffer, so the bytes we keep for export are safe.
        await registerFontFace(family, buf.slice(0));
        const label =
          file.name.replace(/\.(ttf|otf|woff2?)$/i, '') || 'Custom font';
        set((s) => ({
          options: [
            ...s.options,
            { id, label, cssFamily: `"${family}", sans-serif` },
          ],
          customBytes: { ...s.customBytes, [id]: new Uint8Array(buf) },
        }));
        return { id };
      } catch (err) {
        return {
          error:
            err instanceof Error
              ? err.message
              : 'Could not load this font file. Use a .ttf or .otf font.',
        };
      }
    },
  };
});

/** Look up the CSS family for a font id, falling back to a sane default. */
export function cssFamilyFor(options: FontOption[], id: string): string {
  return options.find((o) => o.id === id)?.cssFamily ?? 'sans-serif';
}
