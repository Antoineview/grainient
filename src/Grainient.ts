import { Renderer, MAX_COLORS } from './renderer';
import { parseHex } from './utils/color';

export interface GrainientOptions {
  colors?: string[];
  speed?: number;
  grain?: number;
  scale?: number;
  seed?: number;
  mesh?: number;
  smoothness?: number;
  autoStart?: boolean;
}

const DEFAULTS = {
  colors: ['#ff008a', '#7928ca', '#2af598', '#009efd'],
  speed: 1,
  grain: 0.15,
  scale: 3,
  seed: 0,
  mesh: 1,
  smoothness: 1,
  autoStart: true,
};

export class Grainient {
  private readonly renderer: Renderer;

  constructor(canvas: HTMLCanvasElement, options: GrainientOptions = {}) {
    const merged = { ...DEFAULTS, ...options };
    if (merged.colors.length < 2) {
      throw new Error('grainient: at least 2 colors are required');
    }
    if (merged.colors.length > MAX_COLORS) {
      throw new Error(`grainient: at most ${MAX_COLORS} colors are supported`);
    }

    this.renderer = new Renderer(canvas, {
      colors: merged.colors.map(parseHex),
      speed: merged.speed,
      grain: merged.grain,
      scale: merged.scale,
      seed: merged.seed,
      mesh: merged.mesh,
      smoothness: merged.smoothness,
    });

    if (merged.autoStart) this.renderer.start();
  }

  update(options: GrainientOptions): void {
    const patch: Parameters<Renderer['update']>[0] = {};
    if (options.colors) {
      if (options.colors.length < 2 || options.colors.length > MAX_COLORS) {
        throw new Error(`grainient: colors must contain between 2 and ${MAX_COLORS} entries`);
      }
      patch.colors = options.colors.map(parseHex);
    }
    if (options.speed !== undefined) patch.speed = options.speed;
    if (options.grain !== undefined) patch.grain = options.grain;
    if (options.scale !== undefined) patch.scale = options.scale;
    if (options.seed !== undefined) patch.seed = options.seed;
    if (options.mesh !== undefined) patch.mesh = options.mesh;
    if (options.smoothness !== undefined) patch.smoothness = options.smoothness;
    this.renderer.update(patch);
  }

  start(): void {
    this.renderer.start();
  }

  pause(): void {
    this.renderer.pause();
  }

  destroy(): void {
    this.renderer.destroy();
  }
}
