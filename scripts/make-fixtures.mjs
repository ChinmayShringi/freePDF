// Generate sample PDF fixtures for manual QA and the viewer smoke test.
// Run with: node scripts/make-fixtures.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'tests',
  'fixtures',
);

async function makeDigital() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText(`Digital PDF - page ${i}`, {
      x: 72,
      y: 700,
      size: 24,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText('The quick brown fox jumps over the lazy dog.', {
      x: 72,
      y: 660,
      size: 12,
      font,
    });
  }
  return doc.save();
}

async function makeRotated() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const rotations = [0, 90, 180, 270];
  for (const r of rotations) {
    const page = doc.addPage([612, 792]);
    page.setRotation(degrees(r));
    page.drawText(`Rotated ${r} degrees`, { x: 72, y: 700, size: 20, font });
  }
  return doc.save();
}

async function makeMultipage(count = 120) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= count; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText(`Page ${i} of ${count}`, { x: 72, y: 700, size: 28, font });
  }
  return doc.save();
}

async function makeLandscape() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  // Wide page to exercise fit-to-width and horizontal scrolling.
  const page = doc.addPage([1008, 612]); // US Letter landscape, wide
  page.drawText('Landscape / wide page', { x: 72, y: 540, size: 28, font });
  page.drawText('This page is wider than it is tall.', {
    x: 72,
    y: 500,
    size: 14,
    font,
  });
  return doc.save();
}

async function makeNonLatin() {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const notoPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'src',
    'assets',
    'fonts',
    'NotoSans-Regular.ttf',
  );
  const noto = await doc.embedFont(await readFile(notoPath), { subset: true });
  const page = doc.addPage([612, 792]);
  page.drawText('Non-Latin sample', { x: 72, y: 700, size: 24, font: noto });
  const lines = [
    'Cafe resume naive (Latin-1)',
    'Ελληνικά (Greek)',
    'Русский (Cyrillic)',
    'Curly "quotes" and dashes',
  ];
  lines.forEach((line, i) => {
    page.drawText(line, { x: 72, y: 650 - i * 30, size: 16, font: noto });
  });
  return doc.save();
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'digital.pdf'), await makeDigital());
  await writeFile(join(outDir, 'rotated.pdf'), await makeRotated());
  await writeFile(join(outDir, 'multipage.pdf'), await makeMultipage());
  await writeFile(join(outDir, 'landscape.pdf'), await makeLandscape());
  await writeFile(join(outDir, 'nonlatin.pdf'), await makeNonLatin());
  console.log('Fixtures written to', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
