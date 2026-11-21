import { afterEach, expect, test, vi } from "vite-plus/test";

// compute-engine's `compile` stands in, so each failure is the one under test.
const compile = vi.hoisted(() => vi.fn());
vi.mock("@cortex-js/compute-engine", async (original) => ({ ...(await original<object>()), compile }));

const { javascriptSource } = await import("../src/code-forms.ts");

afterEach(() => vi.restoreAllMocks());

test("a decline is silent and a failure is warned about", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  compile.mockImplementation(() => {
    throw new Error("Unknown operator `Factorization`");
  });
  expect(javascriptSource({} as never, ["Factorization", 360])).toBeUndefined();
  expect(warn).not.toHaveBeenCalled();

  compile.mockImplementation(() => {
    throw new Error("boom");
  });
  expect(javascriptSource({} as never, ["Add", 1, 2])).toBeUndefined();
  expect(warn).toHaveBeenCalledOnce();
});

test("compiling never asks compute-engine to log a fallback", () => {
  compile.mockReturnValue({ code: "return 3" });
  expect(javascriptSource({} as never, ["Add", 1, 2])).toBe("return 3");
  expect(compile).toHaveBeenLastCalledWith(["Add", 1, 2], expect.objectContaining({ fallback: false }));
});
