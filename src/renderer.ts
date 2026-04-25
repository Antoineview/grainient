import fragSrc from './shaders/fragment.glsl?raw';
import vertSrc from './shaders/vertex.glsl?raw';
import type { RGB } from './utils/color';
import { compile, link } from './utils/shader';

export const MAX_COLORS = 8;

export interface RendererState {
  colors: RGB[];
  speed: number;
  grain: number;
  scale: number;
  seed: number;
  mesh: number;
  smoothness: number;
}

interface Uniforms {
  time: WebGLUniformLocation | null;
  resolution: WebGLUniformLocation | null;
  colors: WebGLUniformLocation | null;
  colorCount: WebGLUniformLocation | null;
  speed: WebGLUniformLocation | null;
  grain: WebGLUniformLocation | null;
  scale: WebGLUniformLocation | null;
  seed: WebGLUniformLocation | null;
  mesh: WebGLUniformLocation | null;
  smoothness: WebGLUniformLocation | null;
}

export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly uniforms: Uniforms;
  private readonly resizeObserver: ResizeObserver;
  private readonly intersectionObserver: IntersectionObserver;
  private readonly onVisibility = () => this.reconcileRunning();

  private state: RendererState;
  private colorBuffer = new Float32Array(MAX_COLORS * 3);
  private rafId = 0;
  private startTimeMs = 0;
  private userWantsRunning = false;
  private onScreen = true;

  constructor(canvas: HTMLCanvasElement, state: RendererState) {
    this.canvas = canvas;
    this.state = state;

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      premultipliedAlpha: false,
      // Keep the last drawn frame visible even when RAF is paused (e.g. tab
      // hidden, canvas offscreen). Otherwise the canvas clears to transparent
      // black after each composite and users see nothing when motion stops.
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error('grainient: WebGL2 is not supported in this browser');
    this.gl = gl;

    const vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
    this.program = link(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    const vao = gl.createVertexArray();
    if (!vao) throw new Error('grainient: failed to create VAO');
    this.vao = vao;

    this.uniforms = {
      time: gl.getUniformLocation(this.program, 'u_time'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      colors: gl.getUniformLocation(this.program, 'u_colors'),
      colorCount: gl.getUniformLocation(this.program, 'u_colorCount'),
      speed: gl.getUniformLocation(this.program, 'u_speed'),
      grain: gl.getUniformLocation(this.program, 'u_grain'),
      scale: gl.getUniformLocation(this.program, 'u_scale'),
      seed: gl.getUniformLocation(this.program, 'u_seed'),
      mesh: gl.getUniformLocation(this.program, 'u_mesh'),
      smoothness: gl.getUniformLocation(this.program, 'u_smoothness'),
    };

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);

    this.intersectionObserver = new IntersectionObserver((entries) => {
      this.onScreen = entries[0]?.isIntersecting ?? true;
      this.reconcileRunning();
    });
    this.intersectionObserver.observe(canvas);

    document.addEventListener('visibilitychange', this.onVisibility);

    this.resize();
    this.renderOnce(0);
  }

  update(patch: Partial<RendererState>): void {
    this.state = { ...this.state, ...patch };
    if (!this.userWantsRunning) this.renderOnce(performance.now() - this.startTimeMs);
  }

  start(): void {
    if (this.userWantsRunning) return;
    this.userWantsRunning = true;
    this.startTimeMs = performance.now();
    this.reconcileRunning();
  }

  pause(): void {
    this.userWantsRunning = false;
    this.stopLoop();
  }

  destroy(): void {
    this.stopLoop();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    const { gl } = this;
    gl.deleteProgram(this.program);
    gl.deleteVertexArray(this.vao);
  }

  private reconcileRunning(): void {
    const shouldRun = this.userWantsRunning && this.onScreen && !document.hidden;
    if (shouldRun && !this.rafId) this.startLoop();
    else if (!shouldRun && this.rafId) this.stopLoop();
  }

  private startLoop(): void {
    const loop = (nowMs: number) => {
      if (!this.rafId) return;
      this.renderOnce(nowMs - this.startTimeMs);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { clientWidth, clientHeight } = this.canvas;
    const w = Math.max(1, Math.round(clientWidth * dpr));
    const h = Math.max(1, Math.round(clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
    // Always render after resize. The RAF loop may be paused (tab hidden or
    // canvas offscreen) and without this the canvas would show an empty buffer
    // until motion resumes.
    this.renderOnce(this.userWantsRunning ? performance.now() - this.startTimeMs : 0);
  }

  private renderOnce(elapsedMs: number): void {
    const { gl, uniforms, state } = this;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const count = Math.min(state.colors.length, MAX_COLORS);
    for (let i = 0; i < count; i++) {
      const [r, g, b] = state.colors[i];
      this.colorBuffer[i * 3] = r;
      this.colorBuffer[i * 3 + 1] = g;
      this.colorBuffer[i * 3 + 2] = b;
    }

    gl.uniform1f(uniforms.time, elapsedMs / 1000);
    gl.uniform2f(uniforms.resolution, this.canvas.width, this.canvas.height);
    gl.uniform3fv(uniforms.colors, this.colorBuffer);
    gl.uniform1i(uniforms.colorCount, count);
    gl.uniform1f(uniforms.speed, state.speed);
    gl.uniform1f(uniforms.grain, state.grain);
    gl.uniform1f(uniforms.scale, state.scale);
    gl.uniform1f(uniforms.seed, state.seed);
    gl.uniform1f(uniforms.mesh, state.mesh);
    gl.uniform1f(uniforms.smoothness, state.smoothness);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }
}
