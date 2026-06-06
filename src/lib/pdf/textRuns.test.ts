import { describe, it, expect } from 'vitest';
import { findRunAt, guessFontFamily, type TextRun } from './textRuns';

describe('guessFontFamily', () => {
  it('maps monospace fonts to Courier', () => {
    expect(guessFontFamily('monospace')).toBe('Courier');
    expect(guessFontFamily('Courier New')).toBe('Courier');
  });

  it('maps serif fonts to TimesRoman', () => {
    expect(guessFontFamily('serif')).toBe('TimesRoman');
    expect(guessFontFamily('Times New Roman')).toBe('TimesRoman');
  });

  it('maps sans-serif and unknown fonts to Helvetica', () => {
    expect(guessFontFamily('sans-serif')).toBe('Helvetica');
    expect(guessFontFamily('Arial')).toBe('Helvetica');
    expect(guessFontFamily(undefined)).toBe('Helvetica');
  });
});

describe('findRunAt', () => {
  const run = (over: Partial<TextRun>): TextRun => ({
    text: 'x',
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    fontSize: 20,
    fontFamily: 'Helvetica',
    ...over,
  });

  it('returns the run whose box contains the point', () => {
    const runs = [run({ text: 'a', x: 0, y: 0 }), run({ text: 'b', x: 200, y: 200 })];
    expect(findRunAt(runs, 50, 10)?.text).toBe('a');
    expect(findRunAt(runs, 250, 210)?.text).toBe('b');
  });

  it('returns null when no run contains the point', () => {
    expect(findRunAt([run({})], 500, 500)).toBeNull();
  });

  it('prefers the smallest containing run when several overlap', () => {
    const runs = [
      run({ text: 'big', x: 0, y: 0, width: 300, height: 100 }),
      run({ text: 'small', x: 10, y: 10, width: 40, height: 20 }),
    ];
    expect(findRunAt(runs, 20, 15)?.text).toBe('small');
  });
});
