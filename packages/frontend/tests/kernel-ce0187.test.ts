import { afterEach, expect, test, vi } from "vite-plus/test";
import { startSessionWorker, type EvaluateResponse } from "@notatio/evaluation/session-worker-core";
import { NOTEBOOK_KERNEL } from "../src/kernel-host.ts";
import type { CompiledPlot } from "../src/plot-compile.ts";

// The browser's worker kernel (`web/.vitepress/theme/session-worker-entry.ts`) runs `startSessionWorker` with
// `NOTEBOOK_KERNEL`. Here its message loop runs in this process, its global scope the one port: the compile a
// page asks for, and the display of a cell, decline a shape of a wrong compiled answer (`ce0187Decline`).

interface Scope {
  onmessage: ((event: { data: unknown }) => void) | null;
}

afterEach(() => vi.unstubAllGlobals());

async function session(): Promise<(request: object) => Promise<EvaluateResponse>> {
  const waiting = new Map<number, (response: EvaluateResponse) => void>();
  let connected: () => void = () => {};
  const ready = new Promise<void>((resolve) => (connected = resolve));
  vi.stubGlobal("postMessage", (message: EvaluateResponse | { kind: "connected" }) => {
    if (message.kind === "connected") connected();
    else if (message.kind === "result") waiting.get((message as EvaluateResponse).id)?.(message as EvaluateResponse);
  });
  startSessionWorker(undefined, { catalogue: [], ...NOTEBOOK_KERNEL });
  const scope = globalThis as unknown as Scope;
  scope.onmessage?.({ data: {} });
  await ready;
  let next = 0;
  return (request) =>
    new Promise((resolve) => {
      const id = ++next;
      waiting.set(id, resolve);
      scope.onmessage?.({ data: { id, ...request } });
    });
}

const epsil = (text: string): { text: string; format: "epsil" } => ({ text, format: "epsil" });

test("the worker kernel's compile reports the decline of 2/Csch(x) on each target, and compiles a sound expression", async () => {
  const ask = await session();
  for (const compile of [{ target: "javascript" }, { target: "glsl", vars: ["x", "y"] }]) {
    const declined = await ask({ source: epsil("2/Csch(x)"), compile });
    expect(declined.ok).toBe(true);
    const [item] = (declined.compiled as CompiledPlot).items;
    expect(item!.declined).toMatch(/^ce-0187:reciprocal-hyperbolic: /);
    expect(item!.code).toBeUndefined();
  }
  const sound = await ask({ source: epsil("2*Csch(x)"), compile: { target: "javascript" } });
  const [item] = (sound.compiled as CompiledPlot).items;
  expect(item!.declined).toBeUndefined();
  expect(item!.code).toContain("Math.sinh");
});

test("the worker kernel's display has no code form of 2/Csch(x)", async () => {
  const ask = await session();
  const answer = await ask({ source: epsil("2/Csch(x)"), evaluate: false });
  const { text } = answer.boxes as { text: Record<string, string | undefined> };
  expect(text.javascript).toBeUndefined();
  expect(text.glsl).toBeUndefined();
  expect(text.python).toBeUndefined();
});
