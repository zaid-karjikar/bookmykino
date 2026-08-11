import { describe, expect, it } from 'vitest';
import { langLabel } from './lang';

describe('langLabel', () => {
  it('maps known language versions to their short label', () => {
    expect(langLabel('german')).toBe('DE');
    expect(langLabel('english')).toBe('OV');
    expect(langLabel('englische-untertitel')).toBe('English Subtitles');
    expect(langLabel('deutsche-untertitel')).toBe('German Subtitles');
  });

  it('falls back to an uppercased version of unknown values', () => {
    expect(langLabel('klingon')).toBe('KLINGON');
  });
});
