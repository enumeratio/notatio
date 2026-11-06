// Package guides under /docs/: the values their cells state, and the figures that respond to the
// pointer. Inline figures inside a Manipulate (ranking-and-unranking) belong to the figures-controls
// spec. Values were checked in Python (itertools, the closed form for torus knots, the Dedekind sum
// definition) or against the page's own text.
//
// Run: STORIES_PORT=<port> node node_modules/@playwright/test/cli.js test -c tests/stories/playwright.config.ts site-docs

import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { settled } from "./support.ts";

/** The output of the cell whose source is `value`. */
const cellOut = (page: Page, value: string) => page.locator(`notatio-cell[value='${value}'] notatio-out`).first();

test("ranking and unranking: counts and ranks match the combinatorics", async ({ page }) => {
  await page.goto("/docs/combinatorics/ranking-and-unranking");
  const out = (value: string) => settled(cellOut(page, value));
  // 12! = 479,001,600; Catalan(4) = 14; Bell(4) = 15; C(5,3) = 10; derangements of 5 = 44;
  // involutions of 5 = 26; p(6) = 11.
  expect(await out("Count(SymmetricGroup(12))")).toBe("479_001_600");
  expect(await out("Count(DyckPaths(4))")).toBe("14");
  expect(await out("CatalanNumber(4)")).toBe("14");
  expect(await out("Count(SetPartitions(4))")).toBe("15");
  expect(await out("BellNumber(4)")).toBe("15");
  expect(await out("Count(KSubsets(5, 3))")).toBe("10");
  expect(await out("Count(Derangements(5))")).toBe("44");
  expect(await out("Count(Involutions(5))")).toBe("26");
  expect(await out("Count(IntegerPartitions(6))")).toBe("11");
  // The 7th permutation of 4 in lexicographic order is [2,1,3,4]: one inversion, one descent.
  expect(await out("SymmetricGroup(4)[7]")).toBe("Permutation([2, 1, 3, 4])");
  expect(await out("Inversions(SymmetricGroup(4)[7])")).toBe("1");
  expect(await out("Descents(SymmetricGroup(4)[7])")).toBe("1");
  // Unranking 10^8 in S_12 (factorial number system, python) and the 700,000th subset of {1..20}
  // (by size, then lexicographically: size 11, 83,334th).
  expect(await out("SymmetricGroup(12)[100000000]")).toBe("Permutation([3, 7, 8, 9, 2, 4, 12, 5, 10, 6, 11, 1])");
  expect(await out("Subsets(20)[700000]")).toBe("Finset((20, [1, 4, 7, 9, 10, 12, 14, 16, 17, 19, 20]))");
  // 3-subsets of {1..5} run 123, 124, 125, 134, 135, ...: the successor of the 4th (134) is 135, of the 10th wraps.
  expect(await out("Successor(KSubsets(5, 3), KSubsets(5, 3)[4])")).toBe("Finset((5, [1, 3, 5]))");
  expect(await out("Successor(SymmetricGroup(12), SymmetricGroup(12)[479001599])")).toBe(
    "Permutation([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1])",
  );
  expect(await out("Successor(PrimeNumbers, 7)")).toBe("11");
});

test("polytopes: each figure's caption gives the f-vector of its polytope", async ({ page }) => {
  await page.goto("/docs/polytope/polytope");
  const caption = (name: string) => page.locator("graphics-box").filter({ hasText: name }).first();
  // Vertices, edges, 2-faces, then the body: the truncated octahedron (24, 36, 14), the 3-associahedron
  // (14, 21, 9), the tetrahedron, the octahedron, the cube; faces include the body.
  const expectations: [string, string, string][] = [
    ["Permutahedron, order 4", "faces 75", "f-vector 24, 36, 14, 1"],
    ["Associahedron, order 4", "faces 45", "f-vector 14, 21, 9, 1"],
    ["Simplex, order 4", "faces 15", "f-vector 4, 6, 4, 1"],
    ["Cross-polytope, order 3", "faces 27", "f-vector 6, 12, 8, 1"],
    ["Hypercube, order 3", "faces 27", "f-vector 8, 12, 6, 1"],
  ];
  for (const [name, faces, fvector] of expectations) {
    await expect(caption(name)).toContainText(faces);
    await expect(caption(name)).toContainText(fvector);
  }
  // The hexagon: Permutahedron(3) has 6 vertices, 6 edges and the body.
  await expect(caption("Permutahedron, order 3")).toContainText("f-vector 6, 6, 1");
});

test("torus knots: Jones polynomials match the closed form up to mirror", async ({ page }) => {
  await page.goto("/docs/braid/torus-knots");
  /** Terms of a printed polynomial: [coefficient, exponent]. */
  const terms = (text: string): [number, number][] => {
    const found: [number, number][] = [];
    for (const m of text.replace(/1\s*\/\s*t/g, "t ^ -1").matchAll(/([+-])?\s*t(?:\s*\^\s*(-?\d+))?/g)) {
      found.push([m[1] === "-" ? -1 : 1, m[2] === undefined ? 1 : Number(m[2])]);
    }
    return found;
  };
  /** Exponents in a mirror-neutral form: the polynomial as printed or t -> 1/t, whichever has positive exponents. */
  const normalized = (text: string) => {
    const t = terms(text);
    const flip = t.every(([, e]) => e < 0) ? -1 : 1;
    return t.map(([c, e]) => [c, e * flip]).toSorted((a, b) => a[1] - b[1]);
  };
  // sympy: V(T(p, q)) = t^((p-1)(q-1)/2) (1 - t^(p+1) - t^(q+1) + t^(p+q)) / (1 - t^2).
  expect(normalized(await settled(cellOut(page, "JonesPolynomial(TorusKnot(7, 3))")))).toEqual([
    [1, 6],
    [1, 8],
    [-1, 14],
  ]);
  expect(normalized(await settled(cellOut(page, "JonesPolynomial(TorusKnot(5, 4))")))).toEqual([
    [1, 6],
    [1, 8],
    [1, 10],
    [-1, 11],
    [-1, 13],
  ]);
  // The trefoil: t + t^3 - t^4.
  expect(normalized(await settled(cellOut(page, "JonesPolynomial(TorusKnot(2, 3))")))).toEqual([
    [1, 1],
    [1, 3],
    [-1, 4],
  ]);
  // The Alexander polynomial of the trefoil is t^2 - t + 1, and its braid is sigma_1^3.
  expect(await settled(cellOut(page, "AlexanderPolynomial(TorusKnot(2, 3))"))).toBe("t ^ 2 - t + 1");
  expect(await settled(cellOut(page, "TorusBraid(2, 3)"))).toBe("Braid(2, [1, 1, 1])");
});

test("lorenz: the attractor draws, drag rotates it and double-click resets", async ({ page }) => {
  await page.goto("/docs/braid/lorenz");
  const figure = page.locator("graphics-3d-box").first();
  const svg = figure.locator("svg[aria-label='curve in space']");
  const shape = (n: Locator) => n.evaluate((s) => s.innerHTML);
  await expect(svg).toBeVisible();
  await svg.scrollIntoViewIfNeeded();
  const opening = await shape(svg);
  // The curve is thousands of segments, not a stub.
  expect(opening.length).toBeGreaterThan(5000);
  const box = (await svg.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2 + 30, { steps: 8 });
  await page.mouse.up();
  await expect(async () => expect(await shape(svg)).not.toBe(opening)).toPass();
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await expect(async () => expect(await shape(svg)).toBe(opening)).toPass();
});

test("lorenz: the shortest knotted orbit is the trefoil, and the Dedekind sums", async ({ page }) => {
  await page.goto("/docs/braid/lorenz");
  // LLRLR closes to a trefoil: Alexander t^2 - t + 1, Seifert genus 1.
  expect(await settled(cellOut(page, 'AlexanderPolynomial("LLRLR")'))).toBe("t ^ 2 - t + 1");
  expect(await settled(cellOut(page, 'SeifertGenus("LLRLR")'))).toBe("1");
  // The Dedekind sums s(1, 5) = 1/5 and s(2, 7) = 1/14 (the sawtooth definition, python).
  expect(await settled(cellOut(page, "DedekindSum(1, 5)"))).toBe("1 / 5");
  expect(await settled(cellOut(page, "DedekindSum(2, 7)"))).toBe("1 / 14");
});
