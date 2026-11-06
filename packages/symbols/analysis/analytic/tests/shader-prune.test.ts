import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import { emitComplexWGSL, type Json } from "@enumeratio/ce-patches";
import { reachableWGSL, withWGSL } from "../src/shader-prune.ts";
import { zetaWGSL } from "../src/shader.ts";

const IDENT = /[A-Za-z_]\w*/g;
const strip = (s: string) => s.replace(/\/\/.*$/gm, "");
const declared = (s: string) =>
  new Set([...strip(s).matchAll(/^(?:fn|const|var<private>|struct)\s+(\w+)/gm)].map((m) => m[1]));

const libraryNames = declared(zetaWGSL);

// The heads the GPU spec holds to mpmath: the emitter's lowered set.
const golden = JSON.parse(
  readFileSync(new URL("../../../../../web/tests/stories/complex-heads.golden.json", import.meta.url), "utf8"),
) as { cases: Record<string, { json: Json }> };

test("code that calls no kernel gets no library", () => {
  expect(reachableWGSL("fn plotFn(x: f32, y: f32) -> f32 { return x * x + y * y; }")).toBe("");
  expect(withWGSL("fn f() {}")).toBe("fn f() {}");
});

test("a kernel comes with what it calls, in library order, and nothing else", () => {
  const out = reachableWGSL("let v = cmul(z, z);");
  expect(declared(out)).toEqual(new Set(["cmul"]));
  const sin = declared(reachableWGSL("let v = csin(z);"));
  expect(sin.has("csin")).toBe(true);
  expect(sin.has("cgamma")).toBe(false);
  const names = [...declared(reachableWGSL("let v = cgamma(z);"))];
  const order = [...libraryNames];
  expect(names).toEqual(order.filter((n) => names.includes(n)));
});

test("a host that reads module state keeps it, and so does a kernel that writes it", () => {
  expect(declared(reachableWGSL("if (uncertain > 0.5) { return; }")).has("uncertain")).toBe(true);
  // csinc sets `uncertain` where it declines, though the host never names it.
  expect(declared(reachableWGSL("let v = csinc(z);")).has("uncertain")).toBe(true);
});

test("a name in a comment does not pull a kernel in", () => {
  expect(reachableWGSL("// cgamma(z)\nlet v = 1.0;")).toBe("");
});

test("every lowered head's shader declares everything it reaches", () => {
  for (const [name, c] of Object.entries(golden.cases)) {
    const emitted = emitComplexWGSL(c.json, "z");
    expect(emitted, `${name} has a lowering`).toBeDefined();
    const host = `let v = ${emitted!.code}; uncertain = 0.0;`;
    const shader = withWGSL(host);
    const have = declared(shader);
    // No library name appears in the shader without its declaration.
    const missing = new Set((strip(shader).match(IDENT) ?? []).filter((id) => libraryNames.has(id) && !have.has(id)));
    expect([...missing], `${name} lacks declarations`).toEqual([]);
    expect(shader.length, `${name} is pruned`).toBeLessThan(zetaWGSL.length);
  }
});
