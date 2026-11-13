import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  appendToLedger,
  builtPaths,
  familyOf,
  type LedgerEntry,
  readLedger,
  readRules,
  resolves,
  ruleFor,
  targetOf,
} from "./ledger.ts";
import { isDynamic, LIMITS, redirects, renderRedirects } from "./redirects.ts";

const dist = resolve(import.meta.dirname, "dist");
const built = existsSync(resolve(dist, "_redirects"));
// The `site` job builds the site and then runs this with LEDGER_REQUIRE_BUILD=1; the `check` job has no build.
if (!built && process.env.LEDGER_REQUIRE_BUILD === "1") throw new Error(`no built site at ${dist}`);

describe("redirect rules", () => {
  const rules = redirects();
  it("fit Cloudflare Pages' limits", () => {
    const dynamic = rules.filter((r) => isDynamic(r.from)).length;
    expect(rules.length - dynamic).toBeLessThanOrEqual(LIMITS.static);
    expect(dynamic).toBeLessThanOrEqual(LIMITS.dynamic);
    expect(() => renderRedirects(rules)).not.toThrow();
  });
  it("have one rule per source and none that redirect to themselves", () => {
    expect(new Set(rules.map((r) => r.from)).size).toBe(rules.length);
    expect(rules.filter((r) => r.from === r.to)).toEqual([]);
  });
  it("write each as `source target 301`", () => {
    expect(renderRedirects([{ from: "/a", to: "/b" }])).toBe("/a /b 301\n");
  });
});

describe("rule matching", () => {
  const splat = [{ from: "/reference/component/*", to: "https://x.dev/reference/component/:splat", status: 301 }];
  it("fills a splat into the target", () => {
    const rule = ruleFor("/reference/component/Plot", splat)!;
    expect(targetOf("/reference/component/Plot", rule)).toBe("https://x.dev/reference/component/Plot");
  });
  it("follows a redirect to a page, and fails on a dangling or looping one", () => {
    const pages = new Set(["/b"]);
    const rule = (from: string, to: string) => ({ from, to, status: 301 });
    expect(resolves("/a", pages, [rule("/a", "/b#example/x")])).toBe(true);
    expect(resolves("/a", pages, [rule("/a", "/gone")])).toBe(false);
    expect(resolves("/a", pages, [rule("/a", "/c"), rule("/c", "/a")])).toBe(false);
  });
});

describe.skipIf(!built)("the permalink ledger against the built site", () => {
  const rules = built ? readRules(dist) : [];
  const pages = new Set(built ? builtPaths(dist) : []);
  const ledger = readLedger();

  it("keeps a line once, in a known family", () => {
    const paths = ledger.map((e) => e.path);
    expect(paths.filter((p, i) => paths.indexOf(p) !== i)).toEqual([]);
    for (const e of ledger) expect(e.family, e.path).toBe(familyOf(e.path));
  });

  it("holds every route the build publishes", () => {
    const known = new Set(ledger.map((e) => e.path));
    const published = [...new Set([...pages, ...rules.map((r) => r.from)])]
      .filter((path) => !known.has(path))
      .map((path): LedgerEntry => ({ family: familyOf(path), path }));
    if (process.env.UPDATE_LEDGER === "1" && published.length > 0) appendToLedger(published);
    else
      expect(
        published.map((e) => e.path),
        "run with UPDATE_LEDGER=1 to append these to web/ledger.tsv",
      ).toEqual([]);
  });

  it("answers every ledger entry, with its page or a redirect", () => {
    // A rule with a splat answers when the same rule is in the file: the entry is the rule's source.
    const unanswered = readLedger()
      .filter((e) => (isDynamic(e.path) ? !rules.some((r) => r.from === e.path) : !resolves(e.path, pages, rules)))
      .map((e) => e.path);
    expect(unanswered).toEqual([]);
  });

  it("sends every redirect to a page that answers", () => {
    const dead = rules.filter(
      (r) => !/^https?:\/\//.test(r.to) && !resolves(r.to.replace(/[#?].*$/, ""), pages, rules),
    );
    expect(dead).toEqual([]);
    expect(rules.filter((r) => r.status !== 301)).toEqual([]);
  });
});
