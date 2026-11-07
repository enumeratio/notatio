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

/** The vertices of `set` adjacent to `v`. */
const neighborsIn = (m: boolean[][], v: number, set: readonly number[]): number[] => set.filter((w) => m[v]![w]);
const isDominating = (m: boolean[][], n: number, set: readonly number[]): boolean =>
  range(0, n - 1).every((v) => set.includes(v) || neighborsIn(m, v, set).length > 0);
const dominatingSets = (g: Graph): number[][] => subsets(g.n).filter((s) => isDominating(matrix(g), g.n, s));
const isSubset = (small: readonly number[], big: readonly number[]): boolean => small.every((v) => big.includes(v));
const minimalDominatingSets = (g: Graph): number[][] => {
  const all = dominatingSets(g);
  return all.filter((s) => !all.some((t) => t.length < s.length && isSubset(t, s)));
};

/** The length of each cycle of the graph, once: found by depth-first search from its lowest vertex, in one direction. */
function cycleLengths(g: Graph): number[] {
  const m = matrix(g);
  const found: number[] = [];
  const extend = (start: number, path: number[]): void => {
    const last = path[path.length - 1]!;
    for (let w = start; w < g.n; w++) {
      if (!m[last]![w]) continue;
      if (w === start && path.length >= 3 && path[1]! < last) found.push(path.length);
      else if (w > start && !path.includes(w)) extend(start, [...path, w]);
    }
  };
  for (let s = 0; s < g.n; s++) extend(s, [s]);
  return found;
}
/** The edges of the longest path, by depth-first search from every vertex. */
function longestPath(g: Graph): number {
  const m = matrix(g);
  let best = 0;
  const extend = (path: number[]): void => {
    best = Math.max(best, path.length - 1);
    for (let w = 0; w < g.n; w++) if (m[path[path.length - 1]!]![w] && !path.includes(w)) extend([...path, w]);
  };
  for (let s = 0; s < g.n; s++) extend([s]);
  return best;
}
/** The determinant by the Leibniz sum over permutations. */
function determinant(rows: readonly (readonly number[])[]): number {
  const n = rows.length;
  const permute = (left: number[], chosen: number[]): number => {
    if (left.length === 0) {
      let inversions = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (chosen[i]! > chosen[j]!) inversions++;
      return (
        (inversions % 2 === 0 ? 1 : -1) * chosen.reduce((product, column, row) => product * rows[row]![column]!, 1)
      );
    }
    return sum(
      left.map((c) =>
        permute(
          left.filter((d) => d !== c),
          [...chosen, c],
        ),
      ),
    );
  };
  return permute(range(0, n - 1), []);
}
/** The edge subsets of size `k`. */
function edgeSubsets(g: Graph, k: number): (readonly (readonly [number, number])[])[] {
  const found: (readonly [number, number])[][] = [];
  const extend = (from: number, chosen: (readonly [number, number])[]): void => {
    if (chosen.length === k) found.push(chosen);
    else for (let i = from; i < g.edges.length; i++) extend(i + 1, [...chosen, g.edges[i]!]);
  };
  extend(0, []);
  return found;
}
/** The peeling order's smallest degrees: remove a vertex of least degree until none is left. */
function degeneracy(g: Graph): number {
  const m = matrix(g);
  let left = allVertices(g);
  let worst = 0;
  while (left.length > 0) {
    const [v] = left.toSorted((a, b) => neighborsIn(m, a, left).length - neighborsIn(m, b, left).length);
    worst = Math.max(worst, neighborsIn(m, v!, left).length);
    left = left.filter((w) => w !== v);
  }
  return worst;
}
/** Over the pairs of vertices joined by a path, the sum of `term(degree u, degree w, distance)`. */
const overJoinedPairs = (g: Graph, term: (a: number, b: number, d: number) => number): number =>
  sum(
    pairsOf(allVertices(g)).map(([u, w]) => {
      const d = distancesFrom(matrix(g), u, allVertices(g)).get(w);
      return d === undefined ? 0 : term(degrees(g)[u]!, degrees(g)[w]!, d);
    }),
  );
const cutSizes = (g: Graph): number[] =>
  subsets(g.n).map((s) => g.edges.filter(([u, v]) => s.includes(u - 1) !== s.includes(v - 1)).length);

/** The graph induced on `set` (vertices from 0), renamed 1 .. |set| in order. */
const inducedOn = (g: Graph, set: readonly number[]): Graph => ({
  n: set.length,
  edges: g.edges
    .filter(([u, v]) => set.includes(u - 1) && set.includes(v - 1))
    .map(([u, v]) => [set.indexOf(u - 1) + 1, set.indexOf(v - 1) + 1] as [number, number]),
});
const inducedForests = (g: Graph): number[][] => subsets(g.n).filter((s) => cycleLengths(inducedOn(g, s)).length === 0);
const closedNeighborhood = (m: boolean[][], v: number, n: number): number[] =>
  range(0, n - 1).filter((w) => w === v || m[v]![w]);
/** The sets of four vertices that induce a tree, with the greatest degree inside. */
const inducedFourVertexTrees = (g: Graph): number[] =>
  subsets(g.n)
    .filter((s) => s.length === 4 && componentsOn(matrix(g), s) === 1 && inducedOn(g, s).edges.length === 3)
    .map((s) => Math.max(...s.map((v) => neighborsIn(matrix(g), v, s).length)));
const independentSets = (g: Graph): number[][] => subsets(g.n).filter((s) => isIndependent(matrix(g), s));
/** The maximal sets of vertices that induce a connected graph with no cut vertex. */
function blockSets(g: Graph): number[][] {
  const m = matrix(g);
  const plain = subsets(g.n).filter(
    (s) =>
      s.length === 1 ||
      (s.length > 1 &&
        componentsOn(m, s) === 1 &&
        s.every(
          (v) =>
            componentsOn(
              m,
              s.filter((w) => w !== v),
            ) === 1,
        )),
  );
  return plain.filter((s) => !plain.some((t) => t.length > s.length && isSubset(s, t)));
}
const cliqueNumberOf = (g: Graph): number =>
  Math.max(
    0,
    ...subsets(g.n)
      .filter((s) => isClique(matrix(g), s))
      .map((s) => s.length),
  );
const independenceNumberOf = (g: Graph): number => Math.max(0, ...independentSets(g).map((s) => s.length));
const centerOf = (g: Graph): number[] => {
  const e = eccentricities(g);
  return allVertices(g).filter((v) => e[v] === Math.min(...e));
};
/** The vertices on a triangle. */
const triangleVertexSet = (g: Graph): Set<number> =>
  new Set(
    subsets(g.n)
      .filter((s) => s.length === 3 && isClique(matrix(g), s))
      .flat(),
  );
/** Whether vertices `u` and `v` have the same neighbors. */
const sameRow = (m: boolean[][], u: number, v: number): boolean => m[u]!.every((edge, w) => edge === m[v]![w]);

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
  MinimumVertexCoverCount: (g) => {
    const covers = subsets(g.n).filter((s) => g.edges.every(([u, v]) => s.includes(u - 1) || s.includes(v - 1)));
    const fewest = Math.min(...covers.map((s) => s.length));
    return covers.filter((s) => s.length === fewest).length;
  },
  SpanningTreeCount: (g) =>
    g.n === 0
      ? 0
      : edgeSubsets(g, g.n - 1).filter(
          (chosen) => componentsOn(matrix({ n: g.n, edges: chosen }), allVertices(g)) === 1,
        ).length,
  AdjacencyDeterminant: (g) => determinant(matrix(g).map((row) => row.map(Number))),
  DegreeRange: (g) => (g.n === 0 ? 0 : Math.max(...degrees(g)) - Math.min(...degrees(g))),
  MaximumDegreeMultiplicity: (g) => Math.max(0, ...degrees(g).map((d) => degrees(g).filter((e) => e === d).length)),
  SmallestMissingDegree: (g) => range(0, g.n).find((k) => !degrees(g).includes(k))!,
  DistinctNeighborhoodCount: (g) => new Set(matrix(g).map((row) => row.map((edge, v) => (edge ? v : -1)).join())).size,
  SzegedIndex: (g) => {
    const m = matrix(g);
    const all = allVertices(g);
    return sum(
      g.edges.map(([a, b]) => {
        const fromA = distancesFrom(m, a - 1, all);
        const fromB = distancesFrom(m, b - 1, all);
        const nearer = (x: Map<number, number>, y: Map<number, number>): number =>
          all.filter((w) => (x.get(w) ?? Infinity) < (y.get(w) ?? Infinity)).length;
        return nearer(fromA, fromB) * nearer(fromB, fromA);
      }),
    );
  },
  SchultzIndex: (g) => overJoinedPairs(g, (a, b, d) => (a + b) * d),
  GutmanIndex: (g) => overJoinedPairs(g, (a, b, d) => a * b * d),
  HyperWienerIndex: (g) => overJoinedPairs(g, (_a, _b, d) => d + d * d),
  CenterVertexCount: (g) => eccentricities(g).filter((e) => e === Math.min(...eccentricities(g))).length,
  Girth: (g) => (g.n === 0 ? 0 : Math.min(Infinity, ...cycleLengths(g))),
  GraphLongestCycleLength: (g) => Math.max(0, ...cycleLengths(g)),
  GraphCycleCount: (g) => cycleLengths(g).length,
  LongestPathLength: longestPath,
  MaximumCutSize: (g) => Math.max(0, ...cutSizes(g)),
  BipartiteEdgeDeletionNumber: (g) => g.edges.length - Math.max(0, ...cutSizes(g)),
  PerfectMatchingCount: (g) => matchings(g).filter((chosen) => 2 * chosen.length === g.n).length,
  InducedMatchingNumber: (g) =>
    Math.max(
      0,
      ...matchings(g)
        .filter((chosen) => {
          const ends = new Set(chosen.flat());
          return g.edges.filter(([u, v]) => ends.has(u) && ends.has(v)).length === chosen.length;
        })
        .map((chosen) => chosen.length),
    ),
  DominationNumber: (g) => Math.min(...dominatingSets(g).map((s) => s.length)),
  DominatingSetCount: (g) => dominatingSets(g).length,
  MinimalDominatingSetCount: (g) => minimalDominatingSets(g).length,
  UpperDominationNumber: (g) => Math.max(0, ...minimalDominatingSets(g).map((s) => s.length)),
  IndependentDominationNumber: (g) =>
    Math.min(
      ...dominatingSets(g)
        .filter((s) => isIndependent(matrix(g), s))
        .map((s) => s.length),
    ),
  GraphDifferential: (g) => {
    const m = matrix(g);
    return Math.max(
      0,
      ...subsets(g.n).map(
        (s) => allVertices(g).filter((v) => !s.includes(v) && neighborsIn(m, v, s).length > 0).length - s.length,
      ),
    );
  },
  Degeneracy: degeneracy,
  DissociationNumber: (g) =>
    Math.max(
      0,
      ...subsets(g.n)
        .filter((s) => s.every((v) => neighborsIn(matrix(g), v, s).length <= 1))
        .map((s) => s.length),
    ),
  GraphVertexConnectivity: (g) => {
    if (g.n === 0) return 0;
    for (let k = 0; k <= g.n - 2; k++)
      if (
        subsets(g.n).some(
          (s) =>
            s.length === k &&
            componentsOn(
              matrix(g),
              allVertices(g).filter((v) => !s.includes(v)),
            ) > 1,
        )
      )
        return k;
    return g.n - 1;
  },
  InducedFourCycleCount: (g) =>
    subsets(g.n).filter(
      (s) =>
        s.length === 4 &&
        pairsOf(s).filter(([u, v]) => matrix(g)[u]![v]).length === 4 &&
        s.every((v) => neighborsIn(matrix(g), v, s).length <= 2),
    ).length,
  GraphEdgeConnectivity: (g) => {
    if (g.n < 2) return 0;
    for (let k = 0; k <= g.edges.length; k++)
      if (
        edgeSubsets(g, k).some(
          (removed) =>
            componentsOn(matrix({ n: g.n, edges: g.edges.filter((edge) => !removed.includes(edge)) }), allVertices(g)) >
            1,
        )
      )
        return k;
    return g.edges.length;
  },
  SpanningSubgraphCount: (g) => range(0, g.edges.length).reduce((total, k) => total + edgeSubsets(g, k).length, 0),
  DegreeSum: (g) => sum(degrees(g)),
  EulerFaceCount: (g) => g.edges.length - g.n + 2,
  BlockCount: (g) => blockSets(g).length,
  MaximumNeighborhoodMultiplicity: (g) => {
    const m = matrix(g);
    return Math.max(0, ...allVertices(g).map((v) => allVertices(g).filter((u) => sameRow(m, u, v)).length));
  },
  GraphPackingNumber: (g) => {
    const m = matrix(g);
    const closed = allVertices(g).map((v) => closedNeighborhood(m, v, g.n));
    return Math.max(
      0,
      ...subsets(g.n)
        .filter((s) => pairsOf(s).every(([u, v]) => !closed[u]!.some((w) => closed[v]!.includes(w))))
        .map((s) => s.length),
    );
  },
  GraphOpenPackingNumber: (g) => {
    const m = matrix(g);
    const open = allVertices(g).map((v) => neighborsIn(m, v, allVertices(g)));
    return Math.max(
      0,
      ...subsets(g.n)
        .filter((s) => pairsOf(s).every(([u, v]) => !open[u]!.some((w) => open[v]!.includes(w))))
        .map((s) => s.length),
    );
  },
  GraphTwoLimitedPackingNumber: (g) => {
    const m = matrix(g);
    return Math.max(
      0,
      ...subsets(g.n)
        .filter((s) =>
          allVertices(g).every((v) => closedNeighborhood(m, v, g.n).filter((w) => s.includes(w)).length <= 2),
        )
        .map((s) => s.length),
    );
  },
  CliqueCocliqueNumber: (g) => cliqueNumberOf(g) * independenceNumberOf(g),
  AnnihilationNumber: (g) => {
    const d = degrees(g).toSorted((a, b) => a - b);
    let k = 0;
    let total = 0;
    while (k < g.n && total + d[k]! <= g.edges.length) total += d[k++]!;
    return k;
  },
  InducedPathOnFourVerticesCount: (g) => inducedFourVertexTrees(g).filter((top) => top === 2).length,
  InducedStarOnFourVerticesCount: (g) => inducedFourVertexTrees(g).filter((top) => top === 3).length,
  InducedDiamondCount: (g) => subsets(g.n).filter((s) => s.length === 4 && inducedOn(g, s).edges.length === 5).length,
  LargestInducedForestSize: (g) => Math.max(0, ...inducedForests(g).map((s) => s.length)),
  IndependenceGap: (g) => {
    const independent = independentSets(g);
    const maximal = independent.filter((s) => !independent.some((t) => t.length > s.length && isSubset(s, t)));
    return g.n === 0 ? 0 : Math.max(...independent.map((s) => s.length)) - Math.min(...maximal.map((s) => s.length));
  },
  FeedbackVertexSetNumber: (g) => g.n - Math.max(0, ...inducedForests(g).map((s) => s.length)),
  CenterEdgeCount: (g) => {
    const center = centerOf(g);
    return g.edges.filter(([u, v]) => center.includes(u - 1) && center.includes(v - 1)).length;
  },
  SameNeighborhoodPairCount: (g) => pairsOf(allVertices(g)).filter(([u, v]) => sameRow(matrix(g), u, v)).length,
  HalfAlbertsonIndex: (g) => sum(g.edges.map(([u, v]) => Math.abs(degrees(g)[u - 1]! - degrees(g)[v - 1]!))) / 2,
  HalfTotalIrregularity: (g) =>
    sum(pairsOf(allVertices(g)).map(([u, v]) => Math.abs(degrees(g)[u]! - degrees(g)[v]!))) / 2,
  LargestInducedStarSize: (g) => {
    const m = matrix(g);
    return Math.max(
      0,
      ...allVertices(g).flatMap((c) =>
        subsets(g.n)
          .filter((leaves) => leaves.every((w) => m[c]![w]) && isIndependent(m, leaves))
          .map((leaves) => 1 + leaves.length),
      ),
    );
  },
  CelebrityCount: (g) => {
    const m = matrix(g);
    const d = degrees(g);
    return allVertices(g).filter(
      (v) => 2 * neighborsIn(m, v, allVertices(g)).filter((u) => d[u]! < d[v]!).length > d[v]!,
    ).length;
  },
  KingCount: (g) => {
    const m = matrix(g);
    const d = degrees(g);
    return allVertices(g).filter((v) => neighborsIn(m, v, allVertices(g)).every((u) => d[v]! > d[u]!)).length;
  },
  AboveAverageDegreeVertexCount: (g) => degrees(g).filter((d) => d * g.n > 2 * g.edges.length).length,
  AbsoluteAdjacencyDeterminant: (g) => Math.abs(determinant(matrix(g).map((row) => row.map(Number)))),
  DifferentDegreePairCount: (g) => pairsOf(allVertices(g)).filter(([u, v]) => degrees(g)[u] !== degrees(g)[v]).length,
  ChromaticCliqueGap: (g) => chromaticNumber(g) - cliqueNumberOf(g),
  TuranEdgeExcess: (g) => {
    // The Turán graph on n vertices in r parts puts vertex v in part v mod r; its complement joins the vertices of a part.
    const parts = independenceNumberOf(g);
    const complementEdges = g.n === 0 ? 0 : pairsOf(allVertices(g)).filter(([u, v]) => u % parts === v % parts).length;
    return g.edges.length - complementEdges;
  },
  MaximumLeafNeighborCount: (g) => {
    const m = matrix(g);
    const d = degrees(g);
    return Math.max(
      0,
      ...allVertices(g).map((v) => neighborsIn(m, v, allVertices(g)).filter((u) => d[u] === 1).length),
    );
  },
  NonTriangleVertexCount: (g) => g.n - triangleVertexSet(g).size,
};
