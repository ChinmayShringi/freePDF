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

function isStandardFamily(id: string): id is StandardFontFamily {
  return id in STANDARD;
}

export interface FontResolver {
  /**
   * Pick a font for `text` given a chosen font id. Custom-uploaded fonts and an
   * explicit Noto pick are embedded directly; standard fonts are used when the
   * text is WinAnsi-safe and otherwise fall back to the Unicode font.
   */
  fontFor(text: string, fontId: string): Promise<PDFFont>;
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
  customFontBytes: Record<string, Uint8Array> = {},
): Promise<FontResolver> {
  doc.registerFontkit(fontkit);

  const standardCache = new Map<StandardFontFamily, PDFFont>();
  const customCache = new Map<string, PDFFont>();
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

  async function getCustom(id: string): Promise<PDFFont> {
    const cached = customCache.get(id);
    if (cached) return cached;
    // Slice so pdf-lib/fontkit cannot detach the bytes we keep for re-export.
    const font = await doc.embedFont(customFontBytes[id].slice(), {
      subset: true,
    });
    customCache.set(id, font);
    return font;
  }

  return {
    fontFor: (text, fontId) => {
      if (customFontBytes[fontId]) return getCustom(fontId);
      if (fontId === 'NotoSans') return getUnicode();
      if (isStandardFamily(fontId) && isWinAnsiSafe(text)) {
        return getStandard(fontId);
      }
      // Unknown id or non-WinAnsi text under a standard font: use Unicode.
      return getUnicode();
    },
  };
}
