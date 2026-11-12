// @vitest-environment happy-dom
// Which canvas a portrait draws on. The GPU path keeps the one canvas the element rendered first, and
// the CPU path (the GPU missing, declining the expression, or `gpu="false"`) is its own 2-D canvas.
// The GPU is slow to answer here, as on a real page: the first compile starts before it has.

import { afterEach, beforeAll, expect, test, vi } from "vite-plus/test";

const mocks = vi.hoisted(() => ({
  gpu: true,
  lowers: true,
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
  emitComplexGLSL: () => (mocks.lowers ? { code: "", shape: "s", literals: [] } : null),
}));
vi.mock("../src/plot-kernel.ts", () => ({ canonicalOf: async () => ["Sin", "z"], bindWildcards: (j: unknown) => j }));

beforeAll(async () => {
  await import("../src/notatio-complex-plot.ts");
});

afterEach(() => {
  document.body.replaceChildren();
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

test("an expression the GPU cannot lower falls back to the CPU canvas", async () => {
  mocks.gpu = true;
  mocks.lowers = false;
  const { canvases } = await mount();
  expect(canvases).toHaveLength(1);
  expect(canvases[0]!.getAttribute("data-drawn")).toBe("cpu");
});

test('gpu="false" forces the CPU canvas', async () => {
  mocks.gpu = true;
  mocks.lowers = true;
  const { canvases } = await mount({ gpu: "false" });
  expect(canvases).toHaveLength(1);
  expect(canvases[0]!.getAttribute("data-drawn")).toBe("cpu");
  expect(mocks.render).not.toHaveBeenCalled();
});
