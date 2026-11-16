import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { LOADER_CODE, loaderKey, type SiteInputs } from "../../tools/ci/site-loaders.ts";

const repo = resolve(import.meta.dirname, "../..");

const base = (): SiteInputs => ({
  keys: new Map([
    ["@notatio/reference", "aaaa"],
    ["@notatio/frontend", "bbbb"],
  ]),
  files: new Map([
    ["packages/reference/entries/Sin/index.md", "r1"],
    ["packages/reference/package.json", "p1"],
    ["web/reference/symbol/[name].paths.ts", "c1"],
    ["web/.vitepress/data/prerender.ts", "c2"],
    ["web/.vitepress/data/prerender.test.ts", "t1"],
    ["web/guide/index.md", "g1"],
  ]),
  env: { fromPackages: false, preview: false },
});

const changed = (edit: (i: SiteInputs & { files: Map<string, string>; keys: Map<string, string> }) => void): string => {
  const inputs = base() as SiteInputs & { files: Map<string, string>; keys: Map<string, string> };
  edit(inputs);
  return loaderKey(inputs);
};

describe("the loader cache key", () => {
  const key = loaderKey(base());

  it("is stable", () => expect(loaderKey(base())).toBe(key));

  it("changes with a record", () => {
    expect(changed((i) => i.files.set("packages/reference/entries/Sin/index.md", "r2"))).not.toBe(key);
    expect(changed((i) => i.files.set("packages/reference/entries/Cos/index.md", "r3"))).not.toBe(key);
  });

  it("changes with a loader's source, or a data module it imports", () => {
    expect(changed((i) => i.files.set("web/reference/symbol/[name].paths.ts", "c9"))).not.toBe(key);
    expect(changed((i) => i.files.set("web/.vitepress/data/prerender.ts", "c9"))).not.toBe(key);
  });

  it("changes with a package's build key and with the mode", () => {
    expect(changed((i) => i.keys.set("@notatio/frontend", "cccc"))).not.toBe(key);
    expect(changed((i) => ((i as { env: SiteInputs["env"] }).env = { fromPackages: false, preview: true }))).not.toBe(
      key,
    );
  });

  it("ignores what no loader reads", () => {
    expect(changed((i) => i.files.set("web/guide/index.md", "g2"))).toBe(key);
    expect(changed((i) => i.files.set("web/.vitepress/data/prerender.test.ts", "t2"))).toBe(key);
  });
});

/** The relative files a module imports, resolved. */
function importsOf(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const out: string[] = [];
  for (const m of text.matchAll(/(?:from|import\()\s*["'](\.\.?\/[^"']+)["']/g)) {
    const target = resolve(dirname(file), m[1]!);
    if (existsSync(target)) out.push(target);
  }
  return out;
}

describe("what the cached loaders import", () => {
  const entries = [
    "web/reference/symbol/[name].paths.ts",
    "web/reference/statistic/[carrier]/[name].paths.ts",
    "web/reference/map/[carrier]/[name].paths.ts",
  ];

  it("is all in the key", () => {
    const seen = new Set<string>();
    const walk = (file: string): void => {
      if (seen.has(file)) return;
      seen.add(file);
      for (const next of importsOf(file)) walk(next);
    };
    for (const entry of entries) walk(join(repo, entry));
    const outside = [...seen].map((f) => relative(repo, f)).filter((f) => !LOADER_CODE.test(f));
    expect(outside).toEqual([]);
  });
});
