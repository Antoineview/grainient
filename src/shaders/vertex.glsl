#version 300 es
// Fullscreen covering triangle via gl_VertexID — no attributes needed.
void main() {
  vec2 pos = vec2(
    (gl_VertexID == 1) ? 3.0 : -1.0,
    (gl_VertexID == 2) ? 3.0 : -1.0
  );
  gl_Position = vec4(pos, 0.0, 1.0);
}
