import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import { emitComplexGLSL, type Json } from "@notatio/ce-patches";
import { reachableGLSL, withGLSL } from "../src/shader-prune.ts";
import { zetaGLSL } from "../src/shader.ts";

const IDENT = /[A-Za-z_]\w*/g;
const strip = (s: string) => s.replace(/\/\/.*$/gm, "");
const declared = (s: string) =>
  new Set(
    [...strip(s).matchAll(/^(?:const\s+)?(?:float|int|uint|bool|void|[ib]?vec[234]|mat[234])\s+(\w+)\s*[(=;[]/gm)].map(
      (m) => m[1],
    ),
  );

const libraryNames = declared(zetaGLSL);

// The heads the GPU spec holds to mpmath: the emitter's lowered set.
const golden = JSON.parse(readFileSync(new URL("complex-heads.golden.json", import.meta.url), "utf8")) as {
  cases: Record<string, { json: Json }>;
};

test("code that calls no kernel gets no library", () => {
  expect(reachableGLSL("float plotFn(float x, float y) { return x * x + y * y; }")).toBe("");
  expect(withGLSL("void f() {}")).toBe("void f() {}");
});

test("a kernel comes with what it calls, each declared before its first use, and nothing else", () => {
  const out = reachableGLSL("vec2 v = cmul(z, z);");
  expect(declared(out)).toEqual(new Set(["cmul"]));
  const sin = declared(reachableGLSL("vec2 v = csin(z);"));
  expect(sin.has("csin")).toBe(true);
  expect(sin.has("cgamma")).toBe(false);
  // GLSL has no forward use: a name's first appearance in the stripped text is its declaration.
  const gamma = strip(reachableGLSL("vec2 v = cgamma(z);"));
  for (const name of declared(gamma)) {
    const first = new RegExp(`\\b${name}\\b`).exec(gamma)!.index;
    const decl = new RegExp(`^(?:const\\s+)?\\w+\\s+${name}\\b`, "m").exec(gamma)!.index;
    expect(decl, `${name} is declared before it is used`).toBeLessThanOrEqual(first);
  }
});

test("a host that reads module state keeps it, and so does a kernel that writes it", () => {
  expect(declared(reachableGLSL("void f() { if (uncertain > 0.5) { return; } }")).has("uncertain")).toBe(true);
  // csinc sets `uncertain` where it declines, though the host never names it.
  expect(declared(reachableGLSL("vec2 v = csinc(z);")).has("uncertain")).toBe(true);
});

test("a name in a comment does not pull a kernel in", () => {
  expect(reachableGLSL("// cgamma(z)\nfloat v = 1.0;")).toBe("");
});

test("every lowered head's shader declares everything it reaches", () => {
  for (const [name, c] of Object.entries(golden.cases)) {
    const emitted = emitComplexGLSL(c.json, "z");
    expect(emitted, `${name} has a lowering`).toBeDefined();
    const host = `void f(vec2 z) { vec2 v = ${emitted!.code}; uncertain = 0.0; }`;
    const shader = withGLSL(host);
    const have = declared(shader);
    // No library name appears in the shader without its declaration.
    const missing = new Set((strip(shader).match(IDENT) ?? []).filter((id) => libraryNames.has(id) && !have.has(id)));
    expect([...missing], `${name} lacks declarations`).toEqual([]);
    expect(shader.length, `${name} is pruned`).toBeLessThan(zetaGLSL.length);
  }
});
