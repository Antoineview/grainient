import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from 'react';
import { Grainient as Core, type GrainientOptions } from './Grainient';

export interface GrainientProps
  extends Omit<HTMLAttributes<HTMLCanvasElement>, 'children'>,
    GrainientOptions {
  style?: CSSProperties;
  className?: string;
  paused?: boolean;
}

export function Grainient({
  colors,
  speed,
  grain,
  scale,
  seed,
  mesh,
  smoothness,
  paused,
  style,
  className,
  ...rest
}: GrainientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coreRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const instance = new Core(canvasRef.current, {
      colors,
      speed,
      grain,
      scale,
      seed,
      mesh,
      smoothness,
      autoStart: !paused,
    });
    coreRef.current = instance;
    return () => {
      instance.destroy();
      coreRef.current = null;
    };
    // Intentionally mount-only; prop changes are handled by the update effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    coreRef.current?.update({ colors, speed, grain, scale, seed, mesh, smoothness });
  }, [colors, speed, grain, scale, seed, mesh, smoothness]);

  useEffect(() => {
    if (!coreRef.current) return;
    if (paused) coreRef.current.pause();
    else coreRef.current.start();
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%', ...style }}
      {...rest}
    />
  );
}
