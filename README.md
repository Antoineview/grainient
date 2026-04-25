# grainient

Grainy animated flowing-blob gradients for the web, powered by a WebGL2 fragment shader.

Framework-agnostic core + a thin React wrapper.

## Install

```sh
npm install grainient
```

## Vanilla usage

```ts
import { Grainient } from 'grainient';

const canvas = document.querySelector('canvas')!;
const g = new Grainient(canvas, {
  colors: ['#ff008a', '#7928ca', '#2af598', '#009efd'],
  speed: 1,
  grain: 0.15,
  scale: 1,
  seed: 0,
});

g.update({ colors: ['#000', '#fff'] });
g.pause();
g.start();
g.destroy();
```

## React usage

```tsx
import { Grainient } from 'grainient/react';

export function Hero() {
  return (
    <Grainient
      colors={['#ff008a', '#7928ca', '#2af598']}
      speed={1}
      grain={0.2}
      style={{ width: '100%', height: 480 }}
    />
  );
}
```

`react` and `react-dom` are peer dependencies.

## Options

| Option    | Type       | Default                                                   | Description                              |
| --------- | ---------- | --------------------------------------------------------- | ---------------------------------------- |
| `colors`  | `string[]` | `['#ff008a', '#7928ca', '#2af598', '#009efd']`            | 2–8 hex colors (`#rgb` or `#rrggbb`)     |
| `speed`   | `number`   | `1`                                                       | Animation speed multiplier               |
| `grain`   | `number`   | `0.15`                                                    | Grain intensity, `0`–`1`                 |
| `scale`   | `number`   | `1`                                                       | Blob size — larger = softer, broader regions; smaller = tighter color pockets |
| `mesh`    | `number`   | `1`                                                       | Meshyness — `0` rigid grid, `1` organic mesh, `2+` wild swirls |
| `smoothness` | `number` | `1`                                                       | Shape smoothness — higher = broader, glassier regions; lower = tighter, finer detail |
| `seed`    | `number`   | `0`                                                       | Offset for deterministic drift           |
| `autoStart` (vanilla) / `paused` (React) | `boolean` | `true` / `false` | Whether to animate on mount            |

## How it works

A single fullscreen triangle is drawn via `gl_VertexID` (no vertex buffers). The fragment shader computes weighted soft radial falloffs from up to 8 blob centers — each drifting with 2-octave value noise — mixes the colors accordingly, and overlays procedural grain as a per-pixel luma jitter.

The render loop auto-pauses when the tab is hidden or the canvas scrolls offscreen.

## Browser support

Requires WebGL2 (Chrome 56+, Firefox 51+, Safari 15+, Edge 79+).

## Licence

MIT.
