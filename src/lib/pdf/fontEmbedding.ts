import { StandardFonts, type PDFDocument, type PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import notoUrl from '@/assets/fonts/NotoSans-Regular.ttf?url';
import type { StandardFontFamily } from '@/types/edits';

const STANDARD: Record<StandardFontFamily, StandardFonts> = {
  Helvetica: StandardFonts.Helvetica,
  TimesRoman: StandardFonts.TimesRoman,
  Courier: StandardFonts.Courier,
};

/**
 * Whether every character in `text` is encodable by the WinAnsi standard fonts.
 *
 * pdf-lib's standard fonts (Helvetica/Times/Courier) throw when asked to draw a
 * character outside WinAnsi. We conservatively allow only ASCII printable
 * (0x20-0x7E) and Latin-1 (0xA0-0xFF); anything else (smart quotes, em dash,
 * accented Latin-Extended, Greek, Cyrillic, ...) is routed to the embedded
 * Unicode font instead. Being conservative avoids hard export failures.
 */
export function isWinAnsiSafe(text: string): boolean {
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const ascii = code >= 0x20 && code <= 0x7e;
    const latin1 = code >= 0xa0 && code <= 0xff;
    if (!ascii && !latin1) return false;
  }
  return true;
}

export interface FontResolver {
  /** Pick a font that can render `text`: standard when WinAnsi-safe, else Unicode. */
  fontFor(text: string, family: StandardFontFamily): Promise<PDFFont>;
}

let cachedUnicodeBytes: ArrayBuffer | null = null;

async function loadUnicodeBytes(): Promise<ArrayBuffer> {
  if (cachedUnicodeBytes) return cachedUnicodeBytes;
  const response = await fetch(notoUrl);
  cachedUnicodeBytes = await response.arrayBuffer();
  return cachedUnicodeBytes;
}

/**
 * Build a per-document font resolver. Registers fontkit (required for embedding
 * the Unicode TTF) and caches embedded fonts so each family/Unicode font is
 * embedded at most once per export. The Unicode font is embedded with
 * `subset: true`, so only the glyphs actually used are written to the output.
 */
export async function createFontResolver(
  doc: PDFDocument,
): Promise<FontResolver> {
  doc.registerFontkit(fontkit);

  const standardCache = new Map<StandardFontFamily, PDFFont>();
  let unicodeFont: PDFFont | null = null;

  async function getStandard(family: StandardFontFamily): Promise<PDFFont> {
    const cached = standardCache.get(family);
    if (cached) return cached;
    const font = await doc.embedFont(STANDARD[family]);
    standardCache.set(family, font);
    return font;
  }

  async function getUnicode(): Promise<PDFFont> {
    if (unicodeFont) return unicodeFont;
    const bytes = await loadUnicodeBytes();
    unicodeFont = await doc.embedFont(bytes, { subset: true });
    return unicodeFont;
  }

  return {
    fontFor: (text, family) =>
      isWinAnsiSafe(text) ? getStandard(family) : getUnicode(),
  };
}
