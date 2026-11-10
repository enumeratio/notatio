// Readings for maps batch 14: the catalanization of a permutation (Mp00277), the gyration of an alternating sign matrix
// (Mp00006), the edge counts of a graph's blocks (Mp00276) and the 2-conjugate of a partition (Mp00321), each after the
// Sage code FindStat states, as a loop over mutable arrays. Same contract as map-findstat-readings.ts: FindStat's text
// in, FindStat's text out.

import type { Reading } from "./map-findstat-readings.ts";

const ints = (text: string): number[] => JSON.parse(text) as number[];
const list = (items: readonly number[]): string => `[${items.join(",")}]`;
const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);

// --- Mp00277: the product, in lex order, of the transpositions of the inversions' positions ---

const catalanization = (pi: readonly number[]): number[] => {
  const n = pi.length;
  const inversions = range(0, n - 1).flatMap((i) =>
    range(i + 1, n - 1)
      .filter((j) => pi[i]! > pi[j]!)
      .map((j): [number, number] => [i + 1, j + 1]),
  );
  // Sage multiplies permutations left to right: (s * t)(k) = t(s(k)).
  let product = range(1, n);
  for (const [a, b] of inversions) {
    const t = range(1, n);
    t[a - 1] = b;
    t[b - 1] = a;
    product = product.map((value) => t[value - 1]!);
  }
  return product;
};

// --- Mp00006: Wieland's gyration, on the height function h(i, j) = i + j - 2 (the sum of the entries above and left) ---

const gyration = (matrix: readonly (readonly number[])[]): number[][] => {
  const n = matrix.length;
  const corner = (i: number, j: number): number =>
    range(0, i - 1).reduce((sum, a) => sum + range(0, j - 1).reduce((row, b) => row + matrix[a]![b]!, 0), 0);
  const height = range(0, n).map((i) => range(0, n).map((j) => i + j - 2 * corner(i, j)));
  for (const parity of [0, 1])
    for (let i = 1; i < n; i++)
      for (let j = 1; j < n; j++) {
        if ((i + j) % 2 !== parity) continue;
        const around = [height[i - 1]![j]!, height[i + 1]![j]!, height[i]![j - 1]!, height[i]![j + 1]!];
        height[i]![j] = Math.max(...around) + Math.min(...around) - height[i]![j]!;
      }
  return range(0, n - 1).map((i) =>
    range(0, n - 1).map((j) => (height[i]![j + 1]! + height[i + 1]![j]! - height[i]![j]! - height[i + 1]![j + 1]!) / 2),
  );
};

// --- Mp00276: the biconnected components by a depth-first search with a stack of edges ---

const blockEdgeCounts = (edges: readonly (readonly [number, number])[], n: number): number[] => {
  const neighbors = range(0, n - 1).map(() => [] as [number, number][]);
  edges.forEach(([a, b], k) => {
    neighbors[a]!.push([b, k]);
    neighbors[b]!.push([a, k]);
  });
  const discovered = new Map<number, number>();
  const low = new Map<number, number>();
  const stack: number[] = [];
  const counts: number[] = [];
  const visit = (u: number, via: number): void => {
    discovered.set(u, discovered.size);
    low.set(u, discovered.get(u)!);
    for (const [v, k] of neighbors[u]!) {
      if (k === via) continue;
      if (!discovered.has(v)) {
        stack.push(k);
        visit(v, k);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
        if (low.get(v)! >= discovered.get(u)!) {
          let count = 0;
          for (let top = stack.pop()!; ; top = stack.pop()!) {
            count++;
            if (top === k) break;
          }
          counts.push(count);
        }
      } else if (discovered.get(v)! < discovered.get(u)!) {
        stack.push(k);
        low.set(u, Math.min(low.get(u)!, discovered.get(v)!));
      }
    }
  };
  for (let v = 0; v < n; v++) if (!discovered.has(v)) visit(v, -1);
  return counts.toSorted((a, b) => b - a);
};
const graphEdges = (text: string): { edges: [number, number][]; n: number } => {
  const match = /^\(\[(.*)\],(\d+)\)$/.exec(text)!;
  const edges = [...match[1]!.matchAll(/\((\d+),(\d+)\)/g)].map((e): [number, number] => [Number(e[1]), Number(e[2])]);
  return { edges, n: Number(match[2]) };
};

// --- Mp00321: remainder diagram mod 2, the green and yellow construction, conjugation, and back ---

type Marked = [row: number, flag: number];
const trimmed = (rows: readonly number[]): number[] => {
  const out = [...rows];
  while (out.length > 0 && out.at(-1) === 0) out.pop();
  return out;
};
const conjugate = (partition: readonly number[]): number[] =>
  range(0, (partition[0] ?? 0) - 1).map((c) => partition.filter((p) => p > c).length);
const construction = (rho: readonly number[], reduced: readonly number[], marked: readonly Marked[]) => {
  const nu = [...reduced, ...Array.from({ length: marked.at(-1)?.[0] ?? 0 }, () => 0)];
  const gy = marked.map((m): Marked => [...m]);
  for (let k = 0; k < rho.length - 1; k++) {
    if (rho[k]! < rho[k + 1]!) continue;
    if (gy[k + 1]![1] === 0) {
      for (let j = k; j >= 0; j--) {
        const i = gy[j]![0];
        nu[i]!++;
        gy[j + 1] = [i + 1, 1];
      }
      gy[0] = [0, 1];
    } else
      for (let j = 0; j <= k; j++) {
        const i = gy[j]![0];
        nu[i]!++;
        gy[j] = [i + 1, 1];
      }
  }
  return { nu: trimmed(nu), gy };
};
const construction3Inverse = (rho: readonly number[], reduced: readonly number[], marked: readonly Marked[]) => {
  const nu = [...reduced];
  const gy = marked.map((m): Marked => [...m]);
  for (let k = rho.length - 2; k >= 0; k--) {
    if (rho[k]! < rho[k + 1]!) continue;
    if (gy[0]![0] === 0) {
      for (let j = 0; j <= k; j++) {
        gy[j] = [gy[j + 1]![0] - 1, 1];
        nu[gy[j]![0]]!--;
      }
      gy[k + 1] = [gy[k + 1]![0], 0];
    } else
      for (let j = 0; j <= k; j++) {
        gy[j] = [gy[j]![0] - 1, 1];
        nu[gy[j]![0]]!--;
      }
  }
  return { nu: trimmed(nu), gy };
};
const twoConjugate = (la: readonly number[]): number[] => {
  const s = 2;
  const rho = la.filter((p) => p % s !== 0).map((p) => p % s);
  const rows = la.flatMap((p, i) => (p % s !== 0 ? [i] : []));
  const marked = rows.map((row, j): Marked =>
    j > 0 && rho[j - 1]! >= rho[j]! && row === rows[j - 1]! + 1 ? [row, 0] : [row, 1],
  );
  const reduced = la.map((p) => Math.floor(p / s)).filter((p) => p > 0);
  const forward = construction(rho, reduced, marked);
  const padded = [...forward.nu, ...Array.from({ length: (forward.gy.at(-1)?.[0] ?? -1) + 1 }, () => 0)];
  const transposed = conjugate(forward.nu);
  const flipped = forward.gy.toReversed().map(([row]): Marked => [padded[row]!, 1]);
  const back = construction3Inverse(rho, transposed, flipped);
  const mu = [...back.nu.map((p) => s * p), ...Array.from({ length: (back.gy.at(-1)?.[0] ?? -1) + 1 }, () => 0)];
  back.gy.forEach(([row], i) => {
    mu[row] = (mu[row] ?? 0) + rho[i]!;
  });
  return trimmed(mu);
};

export const BATCH_FOURTEEN_READINGS: Readonly<Record<string, Reading>> = {
  "Catalanization@Permutation": (p) => list(catalanization(ints(p))),
  "Gyration@AlternatingSignMatrix": (a) =>
    `[${gyration(JSON.parse(a) as number[][])
      .map(list)
      .join(",")}]`,
  "BlockEdgePartition@LabeledGraph": (g) => {
    const { edges, n } = graphEdges(g);
    return list(blockEdgeCounts(edges, n));
  },
  "TwoConjugate@IntegerPartition": (p) => list(twoConjugate(ints(p))),
};
