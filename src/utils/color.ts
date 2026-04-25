export type RGB = [number, number, number];

const HEX_RE = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function parseHex(hex: string): RGB {
  const match = HEX_RE.exec(hex.trim());
  if (!match) throw new Error(`grainient: invalid hex color "${hex}"`);
  let body = match[1];
  if (body.length === 3) body = body.split('').map((c) => c + c).join('');
  const n = parseInt(body, 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}
