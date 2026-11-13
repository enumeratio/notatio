// The site's redirects: old URLs that lead to where a page lives now. The build writes them as
// Cloudflare Pages' `_redirects` file (https://developers.cloudflare.com/pages/configuration/redirects/),
// so a request is answered with a real 301 and the browser carries a `#fragment` across it.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { docRoute, workspacePackages } from "@enumeratio/site-theme/data/repo-docs";

export interface Redirect {
  from: string;
  to: string;
}

/** Cloudflare Pages' limits per project: static rules, rules with a splat or placeholder, and a rule's length. */
export const LIMITS = { static: 2000, dynamic: 100, lineLength: 1000 } as const;

// Pages that moved into package docs keep their old URLs.
const moved = (): [string, string][] => [
  ["/guide/collections/", "/docs/combinatorics/ranking-and-unranking"],
  ["/guide/numerals/adic", "/docs/numerals/adic"],
  ["/guide/numerals/", "/docs/numerals/numeral-systems"],
  ["/guide/adeles/", "/docs/adeles/adeles-and-ideles"],
  ["/guide/hypercomplex/finite", "/docs/hypercomplex/finite"],
  ["/guide/hypercomplex/", "/docs/hypercomplex/hypercomplex-algebras"],
  ["/guide/diagram-algebras/", "/docs/diagram/diagram-algebras"],
  ["/guide/hecke/", "/docs/hecke/hecke-algebras"],
  ["/guide/incidence/", "/docs/incidence/incidence-algebras"],
  ["/guide/quiver/", "/docs/quiver/path-algebras"],
  ["/guide/hopf/", "/docs/hopf/hopf-algebras"],
  ["/guide/groupalgebra/", "/docs/groupalgebra/group-algebras"],
  ["/guide/modular/", "/docs/modular/modular-group"],
  ["/guide/braid/torus-knots", "/docs/braid/torus-knots"],
  ["/guide/braid/lorenz", "/docs/braid/lorenz"],
  ["/guide/braid/", "/docs/braid/knots-and-braids"],
  ["/cli/", "/docs/cli/"],
  ["/reference/components/", "/reference/component/"],
  ...[
    "cell",
    "in",
    "out",
    "notebook",
    "worksheet",
    "manipulate",
    "controls",
    "environments",
    "terminal",
    "verification",
  ].map((page): [string, string] => [`/playground/${page}`, `/docs/components/${page}`]),
  ["/playground/figure", "/docs/combinatorics/figure"],
  ["/playground/polytope", "/docs/polytope/polytope"],
  ["/playground/", "/docs/components/overview"],
  ["/packages/", "/docs/"],
  ...workspacePackages().map((p): [string, string] => [`/packages/${p.slug}`, docRoute(p.slug)]),
];

// Collection families renamed to their plural keep the old symbol page's URL, and the
// moved-point statistics that became compositions of PermutationSupport lead to its page.
const renamedSymbols: [string, string][] = [
  ...["PrimePartition", "TriangularComposition", "ZigzagComposition"].map((old): [string, string] => [
    `/reference/symbol/${old}`,
    `/reference/symbol/${old}s`,
  ]),
  ...["PermutationLength", "PermutationMax", "PermutationMin"].map((old): [string, string] => [
    `/reference/symbol/${old}`,
    "/reference/symbol/PermutationSupport",
  ]),
];

// Catalogue-only statistic and map names retired by BL-202 lead to the head that took the role.
const retiredStubs: [string, string][] = Object.entries({
  RealPart: "Re",
  ImaginaryPart: "Imaginary",
  MaxElement: "Max",
  MinElement: "Min",
  Cardinality: "Length",
  ToRationalNumber: "FromContinuedFraction",
  NumberOfEdges: "EdgeCount",
  BigOmega: "PrimeOmega",
  DivisorCount: "DivisorSigma",
  LittleOmega: "PrimeNu",
  ToCycleNotation: "CycleDecomposition",
  BinaryWeight: "DigitCount",
  SquareRoot: "SquarePartRoot",
}).map(([old, head]) => [`/reference/symbol/${old}`, `/reference/symbol/${head}`]);

/**
 * Every redirect, one rule per source. A source ending in `/` answers with and without it: a
 * directory page was served either way, and Pages does not match a rule across the slash.
 */
export function redirects(): Redirect[] {
  const rules = new Map<string, string>();
  for (const [from, to] of [...moved(), ...renamedSymbols, ...retiredStubs]) {
    rules.set(from, to);
    if (from.length > 1 && from.endsWith("/")) rules.set(from.slice(0, -1), to);
  }
  return [...rules].map(([from, to]) => ({ from, to }));
}

/** A rule is dynamic when its source has a splat or a placeholder. */
export const isDynamic = (from: string): boolean => /[*:]/.test(from);

/** The `_redirects` file: `source target 301` per line. A target without a fragment keeps the request's. */
export function renderRedirects(rules: readonly Redirect[]): string {
  const lines = rules.map(({ from, to }) => `${from} ${to} 301`);
  const dynamic = rules.filter((r) => isDynamic(r.from)).length;
  if (rules.length - dynamic > LIMITS.static)
    throw new Error(`${rules.length - dynamic} static redirects; Pages allows ${LIMITS.static}`);
  if (dynamic > LIMITS.dynamic) throw new Error(`${dynamic} dynamic redirects; Pages allows ${LIMITS.dynamic}`);
  for (const line of lines) if (line.length > LIMITS.lineLength) throw new Error(`redirect too long: ${line}`);
  return lines.join("\n") + "\n";
}

export function writeRedirects(outDir: string): void {
  const file = resolve(outDir, "_redirects");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, renderRedirects(redirects()));
}
