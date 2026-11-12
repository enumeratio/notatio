// @vitest-environment happy-dom
// Which canvas a portrait draws on. The GPU path keeps the canvas the element rendered first for the element's
// life; the CPU path (the GPU missing, declining the expression, or `gpu="false"`) is its own 2-D canvas, and
// exactly one of the two shows. A decline is per compile, never permanent.
// The GPU is slow to answer here, as on a real page: the first compile starts before it has.

import { afterEach, beforeAll, expect, test, vi } from "vite-plus/test";

const mocks = vi.hoisted(() => ({
  gpu: true,
  lowers: true,
  lowerSequence: undefined as boolean[] | undefined,
  complexFunction: undefined as unknown as ReturnType<typeof vi.fn<(...a: unknown[]) => unknown>>,
  render: undefined as unknown as ReturnType<typeof vi.fn<(...a: unknown[]) => unknown>>,
}));

vi.mock("@enumeratio/frontend/core", async (original) => ({
  ...(await original<object>()),
  getGpu: () => new Promise((resolve) => setTimeout(() => resolve(mocks.gpu ? {} : null), 20)),
  ComplexPlotRenderer: {
    create: () => ({ setGradient() {}, setExpression: () => "rebuilt", render: mocks.render }),
  },
  renderPortrait: async () => ({ step: 0, complete: true }),
}));
vi.mock("@enumeratio/frontend", () => ({ complexFunction: (...a: unknown[]) => mocks.complexFunction(...a) }));
vi.mock("@enumeratio/ce-patches/glsl-complex", async (original) => ({
  ...(await original<object>()),
  emitComplexGLSL: () =>
    (mocks.lowerSequence ? mocks.lowerSequence.shift() : mocks.lowers) ? { code: "", shape: "s", literals: [] } : null,
}));
vi.mock("../src/plot-kernel.ts", () => ({ canonicalOf: async () => ["Sin", "z"], bindWildcards: (j: unknown) => j }));

beforeAll(async () => {
  await import("../src/notatio-complex-plot.ts");
});

afterEach(() => {
  document.body.replaceChildren();
  mocks.lowerSequence = undefined;
});

async function mount(attrs: Record<string, string> = {}) {
  mocks.complexFunction = vi.fn(() => () => [0, 0]);
  mocks.render = vi.fn();
  const el = document.createElement("notatio-complex-plot") as HTMLElement & { updateComplete: Promise<unknown> };
  el.setAttribute("value", "Sin(z)");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.append(el);
  await el.updateComplete;
  const first = el.querySelector("canvas");
  await new Promise((resolve) => setTimeout(resolve, 150));
  await el.updateComplete;
  return { el, first, canvases: [...el.querySelectorAll("canvas")] };
}

test("the GPU path keeps its one canvas and never takes the CPU", async () => {
  mocks.gpu = true;
  mocks.lowers = true;
  const { first, canvases } = await mount();
  expect(canvases).toHaveLength(1);
  expect(canvases[0]).toBe(first);
  expect(canvases[0]!.hasAttribute("data-drawn")).toBe(false);
  expect(mocks.complexFunction).not.toHaveBeenCalled();
  expect(mocks.render).toHaveBeenCalled();
});

test("no WebGL2 draws on a CPU canvas", async () => {
  mocks.gpu = false;
  const { canvases } = await mount();
  expect(canvases).toHaveLength(1);
  expect(canvases[0]!.getAttribute("data-drawn")).toBe("cpu");
  expect(mocks.complexFunction).toHaveBeenCalled();
});

const shown = (c: Element) => (c as HTMLElement).style.display !== "none";

test("an expression the GPU cannot lower shows the CPU canvas and keeps the GPU canvas attached", async () => {
  mocks.gpu = true;
  mocks.lowers = false;
  const { first, canvases } = await mount();
  expect(canvases).toHaveLength(2);
  expect(canvases[0]).toBe(first);
  expect(first!.isConnected).toBe(true);
  expect(shown(canvases[0]!)).toBe(false);
  expect(canvases[1]!.getAttribute("data-drawn")).toBe("cpu");
  expect(shown(canvases[1]!)).toBe(true);
});

test("a first compile that declines and a second that lowers ends on the GPU canvas", async () => {
  mocks.gpu = true;
  mocks.lowerSequence = [false, true];
  const { el, first } = await mount();
  expect(mocks.render).not.toHaveBeenCalled();
  el.setAttribute("value", "Cos(z)");
  await el.updateComplete;
  await new Promise((resolve) => setTimeout(resolve, 150));
  await el.updateComplete;
  expect(el.querySelector("canvas")).toBe(first);
  expect(shown(first!)).toBe(true);
  expect(mocks.render).toHaveBeenCalled();
  const cpu = el.querySelector('canvas[data-drawn="cpu"]');
  expect(cpu === null || !shown(cpu)).toBe(true);
});

test("a transient decline on the GPU, with no CPU lowering either, never shows a CPU canvas", async () => {
  mocks.gpu = true;
  mocks.lowerSequence = [false, true];
  mocks.complexFunction = vi.fn(() => undefined);
  const el = document.createElement("notatio-complex-plot") as HTMLElement & { updateComplete: Promise<unknown> };
  el.setAttribute("value", "Sin(z)");
  mocks.render = vi.fn();
  document.body.append(el);
  await new Promise((resolve) => setTimeout(resolve, 150));
  expect(el.querySelector('canvas[data-drawn="cpu"]')).toBeNull();
  expect(el.textContent).toContain("No complex lowering");
  el.setAttribute("value", "Cos(z)");
  await new Promise((resolve) => setTimeout(resolve, 150));
  expect(el.querySelector('canvas[data-drawn="cpu"]')).toBeNull();
  expect(el.textContent).not.toContain("No complex lowering");
  expect(mocks.render).toHaveBeenCalled();
});

test("the GPU canvas is shown again after the CPU has drawn", async () => {
  mocks.gpu = true;
  mocks.lowerSequence = [true, false, true];
  const { el, first } = await mount();
  for (const [v, gpuShown] of [
    ["Cos(z)", false],
    ["Tan(z)", true],
  ] as const) {
    el.setAttribute("value", v);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await el.updateComplete;
    expect(shown(first!)).toBe(gpuShown);
    expect(first!.isConnected).toBe(true);
  }
});

test('gpu="false" forces the CPU canvas', async () => {
  mocks.gpu = true;
  mocks.lowers = true;
  const { canvases } = await mount({ gpu: "false" });
  expect(canvases).toHaveLength(1);
  expect(canvases[0]!.getAttribute("data-drawn")).toBe("cpu");
  expect(mocks.render).not.toHaveBeenCalled();
});
