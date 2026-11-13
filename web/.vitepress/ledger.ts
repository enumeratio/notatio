// The permalink ledger (web/ledger.tsv): every URL the site has published, append-only.
// https://github.com/enumeratio/notatio/wiki/Sites §2: a published URL answers for good, with its
// page or a redirect. Reading the ledger against a built site is `ledger.test.ts`.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const LEDGER_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../ledger.tsv");

/** A ledger line: the family a URL belongs to, and the URL (a path, or a splat pattern for a redirect rule). */
export interface LedgerEntry {
  family: string;
  path: string;
}

/** The family of a path: what it is a page of. A head or statistic name is the last segment of its family's path. */
export function familyOf(path: string): string {
  const [, top, kind] = path.split("/");
  if (top === "reference" && ["symbol", "statistic", "map", "component"].includes(kind ?? "")) return kind!;
  if (top === "schema") return "schema";
  if (top === "reference" || top === "docs" || top === "guide" || top === "explore") return top;
  return "page";
}

export function readLedger(file = LEDGER_FILE): LedgerEntry[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => {
      const [family, path] = line.split("\t");
      return { family: family!, path: path! };
    });
}

/** Append entries to the ledger, after the lines it has. Nothing is ever removed or reordered. */
export function appendToLedger(entries: readonly LedgerEntry[], file = LEDGER_FILE): void {
  const text = readFileSync(file, "utf8");
  const added = entries.map((e) => `${e.family}\t${e.path}\n`).join("");
  writeFileSync(file, (text.endsWith("\n") ? text : text + "\n") + added);
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

/** What a build serves as a page: its pages and schemas, as URL paths (`/guide/`, `/reference/symbol/Zeta`). */
export function builtPaths(dist: string): string[] {
  const paths: string[] = [];
  for (const file of walk(dist)) {
    const rel = "/" + relative(dist, file).split("\\").join("/");
    if (/^\/(assets|vendor|hashmap|icons)\b/.test(rel)) continue;
    if (rel.endsWith(".schema.json")) paths.push(rel);
    else if (rel === "/404.html") continue;
    else if (rel.endsWith("/index.html")) paths.push(rel.slice(0, -"index.html".length));
    else if (rel.endsWith(".html")) paths.push(rel.slice(0, -".html".length));
  }
  return paths.toSorted();
}

export interface Rule {
  from: string;
  to: string;
  status: number;
}

/** The rules of a `_redirects` file. */
export function readRules(dist: string): Rule[] {
  const file = join(dist, "_redirects");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => {
      const [from, to, status] = line.split(/\s+/);
      return { from: from!, to: to!, status: status === undefined ? 302 : Number(status) };
    });
}

const escape = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

/** The rule that answers a path: an exact source first, then a splat or placeholder pattern. */
export function ruleFor(path: string, rules: readonly Rule[]): Rule | undefined {
  const exact = rules.find((r) => r.from === path);
  if (exact) return exact;
  return rules.find((r) => {
    if (!/[*:]/.test(r.from)) return false;
    const pattern = escape(r.from).replace(/\*/g, "(.*)").replace(/:\w+/g, "([^/]+)");
    return new RegExp(`^${pattern}$`).test(path);
  });
}

/** The target a rule sends a path to: `:splat` and placeholders filled in. */
export function targetOf(path: string, rule: Rule): string {
  if (!/[*:]/.test(rule.from)) return rule.to;
  const names = [...rule.from.matchAll(/\*|:(\w+)/g)].map((m) => m[1] ?? "splat");
  const pattern = escape(rule.from).replace(/\*/g, "(.*)").replace(/:\w+/g, "([^/]+)");
  const values = new RegExp(`^${pattern}$`).exec(path)!.slice(1);
  return names.reduce((to, name, i) => to.replaceAll(`:${name}`, values[i]!), rule.to);
}

/**
 * Whether a path answers: a built page, or a redirect whose target (an absolute URL on another
 * host counts) answers in turn. A redirect loop, or one longer than `depth`, does not.
 */
export function resolves(path: string, pages: ReadonlySet<string>, rules: readonly Rule[], depth = 5): boolean {
  if (pages.has(path)) return true;
  // A directory page answers without its slash too (Pages redirects it).
  if (pages.has(path + "/")) return true;
  const rule = depth > 0 ? ruleFor(path, rules) : undefined;
  if (!rule) return false;
  const target = targetOf(path, rule);
  if (/^https?:\/\//.test(target)) return true;
  return resolves(target.replace(/[#?].*$/, ""), pages, rules, depth - 1);
}
