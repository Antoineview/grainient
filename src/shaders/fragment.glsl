#version 300 es
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec3  u_colors[8];
uniform int   u_colorCount;
uniform float u_speed;
uniform float u_grain;
uniform float u_scale;
uniform float u_seed;
uniform float u_mesh;
uniform float u_smoothness;

out vec4 outColor;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  return valueNoise(p) * 0.6 + valueNoise(p * 2.0) * 0.3 + valueNoise(p * 4.0) * 0.1;
}

float grainHash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Drifting anchor position for color i, in [0, aspect] x [0, 1].
// Each anchor follows its own low-frequency 2D noise walk, seeded by its
// index so anchors move independently — no lockstep, no pinwheels.
vec2 anchorPos(int i, float t, float aspect) {
  float fi = float(i);
  // Each anchor has its own phase/seed so motion is uncorrelated.
  float nx = fbm(vec2(fi * 1.73 + u_seed, t * 0.5 + fi * 4.1));
  float ny = fbm(vec2(fi * 2.91 + u_seed + 37.0, t * 0.5 + fi * 7.3 + 11.0));
  // Keep anchors within the visible canvas, with a small margin so they
  // don't fully leave the frame.
  float x = (0.1 + 0.8 * nx) * aspect;
  float y = 0.1 + 0.8 * ny;
  return vec2(x, y);
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = vec2(uv.x * aspect, uv.y);

  float t = u_time * u_speed * 0.04;
  float freqScale = 1.0 / max(u_smoothness, 0.01);

  // Strong two-level domain warp — bends the field so anchor-centered
  // bumps don't read as clean circles.
  vec2 q = vec2(
    fbm(p * 0.25 * freqScale + vec2(u_seed, t)),
    fbm(p * 0.25 * freqScale + vec2(t, u_seed) + 5.2)
  );
  vec2 r = vec2(
    fbm(p * 0.4 * freqScale + q * 2.0 + vec2(t * 0.6, 1.7)),
    fbm(p * 0.4 * freqScale + q * 2.0 + vec2(8.3, t * 0.6))
  );
  vec2 warp = (r - 0.5) * 1.4 * u_mesh;
  vec2 pw = p + warp;

  int count = u_colorCount;

  // Softmax-weighted palette blend. Each anchor contributes a Gaussian
  // weight, and colors are averaged by those weights. This guarantees
  // every pixel is dominated by its nearest anchor(s) — no neutral
  // background when all anchors are far. The "blob" look is broken by:
  //   1. Strong per-anchor fbm distortion of the distance field so each
  //      region has an irregular flowing contour;
  //   2. Anisotropic stretched kernel with drifting orientation so
  //      regions read as streams, not dots;
  //   3. Heavy overlap (large sigma) so neighboring anchors merge into
  //      one connected color field.
  // Scale semantic: larger = broader/softer regions.
  float sigma = 0.45 * max(u_scale, 0.1);
  float invSigmaSq = 1.0 / (sigma * sigma);

  vec3 colSum = vec3(0.0);
  float wSum = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= count) break;
    float fi = float(i);
    vec2 a = anchorPos(i, t, aspect);

    float angle = 6.2831 * fbm(vec2(fi * 4.3 + u_seed, t * 0.35 + fi * 2.9));
    vec2 dir = vec2(cos(angle), sin(angle));
    vec2 perp = vec2(-dir.y, dir.x);

    // Per-anchor STRONG organic distortion — completely breaks the round
    // contour. Each region is shaped by a noise field unique to that anchor.
    vec2 aw = vec2(
      fbm(pw * 0.8 * freqScale + vec2(fi * 3.1 + u_seed, t * 0.4)),
      fbm(pw * 0.8 * freqScale + vec2(t * 0.4, fi * 5.7 + u_seed + 13.0))
    );
    vec2 d = (pw - a) + (aw - 0.5) * 0.9;

    float along = dot(d, dir);
    float across = dot(d, perp);
    // Stretched ellipse (2.5x along dir, 0.63x across) + per-anchor warp
    // above → long flowing streams instead of round blobs.
    float distSq = along * along * 0.4 + across * across * 1.6;

    float w = exp(-distSq * invSigmaSq);
    colSum += u_colors[i] * w;
    wSum += w;
  }
  // Tiny epsilon: only guards against div-by-zero. A larger epsilon would
  // dominate small wSum at low u_scale and wash distant pixels to black —
  // we want the ratio to reflect the closest anchor regardless of magnitude.
  vec3 col = colSum / max(wSum, 1e-30);

  float g = (grainHash(gl_FragCoord.xy + u_seed * 97.0) - 0.5) * u_grain;
  col += vec3(g);

  outColor = vec4(col, 1.0);
}
