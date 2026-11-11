// WebGL2 plumbing for the GPU paths: a context, a program from fragment source, a pass over the whole
// target. A field is evaluated by a fragment shader over a full-screen triangle into an RGBA32F target
// (`EXT_color_buffer_float`) and read back; a portrait draws straight to its canvas. Where WebGL2 or the
// float extension is missing, every entry point answers null or undefined and the caller takes its CPU path.

/** What every fragment shader starts with: GLSL ES 3.00 and full-precision floats. */
export const GLSL_HEADER = "#version 300 es\nprecision highp float;\nprecision highp int;\n";

// One triangle that covers the viewport: vertices (0,0), (2,0), (0,2) in clip space (-1,-1), (3,-1), (-1,3).
const FULLSCREEN_VERTEX = `#version 300 es
void main() {
  vec2 q = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(q * 2.0 - 1.0, 0.0, 1.0);
}`;

/** Binding point of the one uniform block (`Prm`) each shader reads its parameters from. */
const BLOCK_BINDING = 0;

const programs = new WeakMap<WebGL2RenderingContext, Map<string, WebGLProgram | null>>();

/**
 * `fragment` linked with the full-screen vertex shader, or undefined when either stage does not
 * compile or the link fails (the info log goes to the debug console). The program is cached on the
 * source text, so a source that failed is not tried twice.
 */
export function compileProgram(gl: WebGL2RenderingContext, fragment: string): WebGLProgram | undefined {
  let cache = programs.get(gl);
  if (!cache) programs.set(gl, (cache = new Map()));
  const cached = cache.get(fragment);
  if (cached !== undefined) return cached ?? undefined;
  const program = link(gl, fragment);
  cache.set(fragment, program ?? null);
  return program;
}

function link(gl: WebGL2RenderingContext, fragment: string): WebGLProgram | undefined {
  const stages = [
    [gl.VERTEX_SHADER, FULLSCREEN_VERTEX],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  let ok = true;
  for (const [type, source] of stages) {
    const shader = gl.createShader(type);
    if (!shader || !program) return undefined;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.debug(`GLSL did not compile: ${gl.getShaderInfoLog(shader)}`);
      ok = false;
    }
    gl.attachShader(program, shader);
    shaders.push(shader);
  }
  if (ok) {
    gl.linkProgram(program);
    ok = gl.getProgramParameter(program, gl.LINK_STATUS) === true;
    if (!ok) console.debug(`GLSL did not link: ${gl.getProgramInfoLog(program)}`);
  }
  for (const shader of shaders) {
    gl.detachShader(program, shader);
    gl.deleteShader(shader);
  }
  if (ok) return program;
  gl.deleteProgram(program);
  return undefined;
}

/** Point `program`'s `Prm` block at the uniform buffer `buffer` holding `data`, and use the program. */
export function useParams(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  buffer: WebGLBuffer,
  data: ArrayBufferView,
) {
  gl.useProgram(program);
  const block = gl.getUniformBlockIndex(program, "Prm");
  if (block === gl.INVALID_INDEX) return;
  gl.uniformBlockBinding(program, block, BLOCK_BINDING);
  gl.bindBuffer(gl.UNIFORM_BUFFER, buffer);
  gl.bufferData(gl.UNIFORM_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.bindBufferBase(gl.UNIFORM_BUFFER, BLOCK_BINDING, buffer);
}

/** Draw the full-screen triangle with the current program into the current framebuffer. */
export const drawFullScreen = (gl: WebGL2RenderingContext): void => gl.drawArrays(gl.TRIANGLES, 0, 3);

/**
 * Run `fragment` once per texel of a `width` × `height` RGBA32F target and read the target back: four
 * floats per texel, row `j` (the fragment's `gl_FragCoord.y - 0.5`) first. `params` fills the `Prm` block.
 * Undefined when the target is past the device's limits, is not renderable, or the program is missing.
 */
export function renderToFloats(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  params: ArrayBufferView,
  width: number,
  height: number,
): Float32Array | undefined {
  const limits = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
  if (width > gl.getParameter(gl.MAX_TEXTURE_SIZE) || height > gl.getParameter(gl.MAX_TEXTURE_SIZE)) return undefined;
  if (width > limits[0]! || height > limits[1]!) return undefined;
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  const buffer = gl.createBuffer();
  try {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return undefined;
    gl.viewport(0, 0, width, height);
    gl.disable(gl.BLEND);
    useParams(gl, program, buffer, params);
    drawFullScreen(gl);
    const out = new Float32Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, out);
    return gl.getError() === gl.NO_ERROR ? out : undefined;
  } finally {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
  }
}

/** A WebGL2 context on `canvas` whose float targets are renderable, or null. */
export function createContext(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  attributes: WebGLContextAttributes = {},
): WebGL2RenderingContext | null {
  try {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      depth: false,
      stencil: false,
      ...attributes,
    }) as WebGL2RenderingContext | null;
    return gl?.getExtension("EXT_color_buffer_float") ? gl : null;
  } catch {
    return null;
  }
}
