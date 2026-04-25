import { describe, expect, it } from 'vitest';
import { parseHex } from '../src/utils/color';

describe('parseHex', () => {
  it('parses 6-digit hex with hash', () => {
    expect(parseHex('#ff0080')).toEqual([1, 0, 128 / 255]);
  });

  it('parses 6-digit hex without hash', () => {
    expect(parseHex('00ff80')).toEqual([0, 1, 128 / 255]);
  });

  it('expands 3-digit shorthand', () => {
    const [r, g, b] = parseHex('#f0a');
    expect(r).toBeCloseTo(1);
    expect(g).toBeCloseTo(0);
    expect(b).toBeCloseTo(0xaa / 255);
  });

  it('is case-insensitive', () => {
    expect(parseHex('#AbCdEf')).toEqual(parseHex('#abcdef'));
  });

  it('throws on invalid input', () => {
    expect(() => parseHex('not-a-color')).toThrow();
    expect(() => parseHex('#12345')).toThrow();
    expect(() => parseHex('#12g')).toThrow();
  });
});
