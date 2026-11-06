// Independent readings of the graph statistics adopted from FindStat, written against FindStat's definitions rather than
// against the expressions: the graph as an adjacency matrix, searched by brute force over vertex and edge subsets.

export interface Graph {
  readonly n: number;
  /** The edges as pairs of vertices 1 .. n, the first the lower. */
  readonly edges: readonly (readonly [number, number])[];
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);
const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0);

/** The adjacency matrix, indexed from 0. */
const matrix = ({ n, edges }: Graph): boolean[][] => {
  const rows = Array.from({ length: n }, () => Array.from({ length: n }, () => false));
  for (const [u, v] of edges) rows[u - 1]![v - 1] = rows[v - 1]![u - 1] = true;
  return rows;
};
const degrees = (g: Graph): number[] => matrix(g).map((row) => row.filter(Boolean).length);

/** The vertex subsets, as lists of vertices from 0. */
const subsets = (n: number): number[][] =>
  Array.from({ length: 2 ** n }, (_, mask) => range(0, n - 1).filter((v) => (mask >> v) & 1));
const pairsOf = (set: readonly number[]): [number, number][] =>
  set.flatMap((u, i) => set.slice(i + 1).map((v) => [u, v] as [number, number]));
const isIndependent = (m: boolean[][], set: readonly number[]): boolean => pairsOf(set).every(([u, v]) => !m[u]![v]);
const isClique = (m: boolean[][], set: readonly number[]): boolean => pairsOf(set).every(([u, v]) => m[u]![v]);

/** The shortest path lengths from `source` by breadth-first search over the vertices of `allowed`; unreached vertices are absent. */
function distancesFrom(m: boolean[][], source: number, allowed: readonly number[]): Map<number, number> {
  const seen = new Map<number, number>([[source, 0]]);
  const queue = [source];
  for (const u of queue)
    for (const v of allowed)
      if (m[u]![v] && !seen.has(v)) {
        seen.set(v, seen.get(u)! + 1);
        queue.push(v);
      }
  return seen;
}
/** The connected components of the subgraph induced on `set`. */
function componentsOn(m: boolean[][], set: readonly number[]): number {
  const left = new Set(set);
  let found = 0;
  while (left.size > 0) {
    found++;
    for (const v of distancesFrom(m, [...left][0]!, set).keys()) left.delete(v);
  }
  return found;
}
const allVertices = (g: Graph): number[] => range(0, g.n - 1);
const components = (g: Graph): number => componentsOn(matrix(g), allVertices(g));

/** The distance between each pair of distinct vertices, infinite when there is no path. */
function pairDistances(g: Graph): number[] {
  const m = matrix(g);
  const all = allVertices(g);
  return pairsOf(all).map(([u, v]) => distancesFrom(m, u, all).get(v) ?? Infinity);
}
const eccentricities = (g: Graph): number[] => {
  const m = matrix(g);
  const all = allVertices(g);
  return all.map((u) => {
    const reached = distancesFrom(m, u, all);
    return reached.size < g.n ? Infinity : Math.max(...reached.values());
  });
};

/** The fewest colors of a proper coloring, by trying every assignment of k colors. */
function chromaticNumber(g: Graph): number {
  const m = matrix(g);
  for (let k = 0; k <= g.n; k++) {
    const colors: number[] = [];
    const assign = (v: number): boolean => {
      if (v === g.n) return true;
      for (let c = 0; c < k; c++) {
        if (colors.slice(0, v).some((other, u) => other === c && m[u]![v])) continue;
        colors[v] = c;
        if (assign(v + 1)) return true;
      }
      return false;
    };
    if (assign(0)) return k;
  }
  return g.n;
}

/** The sets of edges, as lists, no two sharing a vertex. */
function matchings(g: Graph): (readonly [number, number][])[] {
  const found: [number, number][][] = [];
  const extend = (from: number, chosen: [number, number][], used: ReadonlySet<number>): void => {
    found.push(chosen);
    for (let k = from; k < g.edges.length; k++) {
      const [u, v] = g.edges[k]!;
      if (!used.has(u) && !used.has(v)) extend(k + 1, [...chosen, [u, v]], new Set([...used, u, v]));
    }
  };
  extend(0, [], new Set());
  return found;
}

export const GRAPH_READINGS: Record<string, (g: Graph) => number> = {
  GraphEdgeCount: (g) => g.edges.length,
  MaximumDegree: (g) => Math.max(0, ...degrees(g)),
  MinimumDegree: (g) => (g.n === 0 ? 0 : Math.min(...degrees(g))),
  EvenDegreeVertexCount: (g) => degrees(g).filter((d) => d % 2 === 0).length,
  OddDegreeVertexCount: (g) => degrees(g).filter((d) => d % 2 === 1).length,
  GraphLeafCount: (g) => degrees(g).filter((d) => d === 1).length,
  DegreeTwoVertexCount: (g) => degrees(g).filter((d) => d === 2).length,
  IsolatedVertexCount: (g) => degrees(g).filter((d) => d === 0).length,
  FirstZagrebIndex: (g) => sum(degrees(g).map((d) => d ** 2)),
  SecondZagrebIndex: (g) => sum(g.edges.map(([u, v]) => degrees(g)[u - 1]! * degrees(g)[v - 1]!)),
  ForgottenIndex: (g) => sum(degrees(g).map((d) => d ** 3)),
  OreDegree: (g) => Math.max(0, ...g.edges.map(([u, v]) => degrees(g)[u - 1]! + degrees(g)[v - 1]!)),
  TotalIrregularity: (g) =>
    sum(pairsOf(degrees(g).map((_, v) => v)).map(([u, v]) => Math.abs(degrees(g)[u]! - degrees(g)[v]!))),
  AlbertsonIndex: (g) => sum(g.edges.map(([u, v]) => Math.abs(degrees(g)[u - 1]! - degrees(g)[v - 1]!))),
  MaximumDegreeVertexCount: (g) => degrees(g).filter((d) => d === Math.max(...degrees(g))).length,
  TriangleCount: (g) => subsets(g.n).filter((s) => s.length === 3 && isClique(matrix(g), s)).length,
  TriangleVertexCount: (g) => {
    const m = matrix(g);
    const triangles = subsets(g.n).filter((s) => s.length === 3 && isClique(m, s));
    return allVertices(g).filter((v) => triangles.some((t) => t.includes(v))).length;
  },
  InducedPathOnThreeVerticesCount: (g) => {
    const m = matrix(g);
    return subsets(g.n).filter((s) => s.length === 3 && pairsOf(s).filter(([u, v]) => m[u]![v]).length === 2).length;
  },
  FourCliqueCount: (g) => subsets(g.n).filter((s) => s.length === 4 && isClique(matrix(g), s)).length,
  MaximumDistance: (g) => (g.n === 0 ? 0 : Math.max(0, ...pairDistances(g))),
  MinimumEccentricity: (g) => (g.n === 0 ? 0 : Math.min(...eccentricities(g))),
  WienerIndex: (g) => sum(pairDistances(g).filter(Number.isFinite)),
  DistanceTwoPairCount: (g) => pairDistances(g).filter((d) => d === 2).length,
  DistanceThreePairCount: (g) => pairDistances(g).filter((d) => d === 3).length,
  DistanceFourPairCount: (g) => pairDistances(g).filter((d) => d === 4).length,
  GraphComponentCount: components,
  ComplementComponentCount: (g) => {
    const complement = matrix(g).map((row, u) => row.map((edge, v) => u !== v && !edge));
    return componentsOn(complement, allVertices(g));
  },
  CutVertexCount: (g) => {
    const m = matrix(g);
    return allVertices(g).filter(
      (v) =>
        componentsOn(
          m,
          allVertices(g).filter((u) => u !== v),
        ) > components(g),
    ).length;
  },
  BridgeCount: (g) =>
    g.edges.filter((edge) => components({ n: g.n, edges: g.edges.filter((other) => other !== edge) }) > components(g))
      .length,
  CyclomaticNumber: (g) => g.edges.length - g.n + components(g),
  IndependenceNumber: (g) =>
    Math.max(
      0,
      ...subsets(g.n)
        .filter((s) => isIndependent(matrix(g), s))
        .map((s) => s.length),
    ),
  CliqueNumber: (g) =>
    Math.max(
      0,
      ...subsets(g.n)
        .filter((s) => isClique(matrix(g), s))
        .map((s) => s.length),
    ),
  ChromaticNumber: chromaticNumber,
  IndependentSetCount: (g) => subsets(g.n).filter((s) => isIndependent(matrix(g), s)).length,
  MaximalIndependentSetCount: (g) => {
    const m = matrix(g);
    const independent = subsets(g.n).filter((s) => isIndependent(m, s));
    return independent.filter((s) => independent.every((t) => t.length <= s.length || !s.every((v) => t.includes(v))))
      .length;
  },
  VertexCoverNumber: (g) =>
    Math.min(
      ...subsets(g.n)
        .filter((s) => g.edges.every(([u, v]) => s.includes(u - 1) || s.includes(v - 1)))
        .map((s) => s.length),
    ),
  ConnectedInducedSubgraphCount: (g) =>
    subsets(g.n).filter((s) => s.length > 0 && componentsOn(matrix(g), s) === 1).length,
  MatchingNumber: (g) => Math.max(...matchings(g).map((chosen) => chosen.length)),
  HosoyaIndex: (g) => matchings(g).length,
};
