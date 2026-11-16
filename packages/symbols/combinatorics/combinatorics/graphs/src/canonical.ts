// The canonical form of a simple undirected graph, in plain numbers (no engine): the relabeling whose
// rank in LabeledGraphs(n) is least. Two graphs are isomorphic exactly when their canonical blocks are
// equal.
//
// The pairs (a, b), a < b, are numbered in lex order and pair k is bit k − 1 of the rank, so the pairs
// with first element a are a block of n − a bits, the pair (a, n) most significant within it, and a
// block with larger a outweighs every block below it. The least rank therefore minimizes block n − 1,
// then block n − 2, down to block 1. Labels are chosen n first: with the labels above a chosen, a
// candidate vertex's block is its adjacency to them, and only the candidates of least block go on
// (ties branch). Of tied candidates that are twins (the same neighbours apart from each other) one
// is enough: swapping them is an automorphism that fixes everything chosen.
//
// The form is hereditary: the pairs holding vertex 1 are the low n − 1 bits, so rank(G) =
// rank(G − 1) · 2^(n − 1) + (the neighbours of vertex 1). The canonical graphs on n vertices are
// among h · 2^(n − 1) + S, h canonical on n − 1, S a neighbour set, and the search tells which are.

/** A graph as the rows of its adjacency: bit w of entry v is set when the ordered pair (v, w) is present
 *  (vertices from 0). An undirected graph is symmetric; a directed code reads the same rows as ordered
 *  pairs, with a second row set for the arcs in, and reuses the search over blocks. */
export type Adjacency = readonly number[];

/** The list of canonical ranks is built through this many vertices; past it, `canonicalRanks` declines.
 *  The list for 8 vertices has 12,346 entries and builds in under a second; for 9 it would test
 *  2^8 · 12,346 candidates, which is a design call (pruning by refinement, or a built table). */
export const CANONICAL_LIST_LIMIT = 8;

/** A rank is a double through this many vertices: C(10, 2) = 45 bits. */
export const RANK_VERTEX_LIMIT = 10;

/** Vertices the search reads: a block is at most n − 1 bits of an int32. */
export const SEARCH_VERTEX_LIMIT = 30;

/** Branches one search may create before it declines. The path on 16 vertices, the hardest graph measured at
 *  that size (no twins, no structure to prune by), takes 1.5 million (0.2 s); each vertex more multiplies a path's
 *  branches by about 3.3 (the 18-vertex path takes 17 million, 2.3 s) and the 5 × 5 grid declines. The Petersen
 *  graph takes 1,090, the Paley graph on 13 vertices 1,345, the 4 × 4 rook's graph 15,000. */
export const SEARCH_NODE_LIMIT = 2_000_000;

/** The adjacency of the graph on 1..n with these edges (pairs of distinct vertices, either order). */
export function adjacencyOf(n: number, edges: readonly (readonly number[])[]): number[] {
  const rows = Array.from({ length: n }, () => 0);
  for (const [u, v] of edges) {
    rows[u - 1] |= 1 << (v - 1);
    rows[v - 1] |= 1 << (u - 1);
  }
  return rows;
}

/** Whether `u` and `v` have the same neighbours apart from each other. */
const twins = (rows: Adjacency, u: number, v: number): boolean => (rows[u] & ~(1 << v)) === (rows[v] & ~(1 << u));

/** The blocks of the labeling as given, label n first. */
function ownLevels(rows: Adjacency): number[] {
  const n = rows.length;
  return Array.from({ length: n }, (_, k) => (k === 0 ? 0 : rows[n - k - 1] >>> (n - k)));
}

/** The blocks of the canonical labeling of the graph, label n first (so `levels[0]` is label n's empty block), and
 *  the branches the search made; equal blocks for two graphs exactly when they are isomorphic, and compared as lists
 *  they carry no limit of a double. Depth first, keeping the least blocks found: a branch whose block at some level
 *  is above the best's is dropped, one below it replaces the best from there on. Undefined where the search
 *  declines (more than `SEARCH_VERTEX_LIMIT` vertices, or `limit` branches). */
export function canonicalSearch(
  rows: Adjacency,
  limit = SEARCH_NODE_LIMIT,
): { levels: number[]; nodes: number } | undefined {
  const n = rows.length;
  if (n > SEARCH_VERTEX_LIMIT) return undefined;
  // codes[k][v]: v's adjacency to the k labels chosen, the first chosen most significant.
  const codes = Array.from({ length: n + 1 }, () => new Int32Array(n));
  const tied = Array.from({ length: n + 1 }, () => new Int8Array(n));
  const best: number[] = [];
  let nodes = 0;
  // Entering a branch at depth k, its blocks below k equal the best's (where the best has them).
  const descend = (k: number, placed: number): boolean => {
    if (k === n) return true;
    const here = codes[k];
    let least = Number.POSITIVE_INFINITY;
    for (let v = 0; v < n; v++) if (!((placed >> v) & 1) && here[v] < least) least = here[v];
    if (best.length > k) {
      if (least > best[k]) return true;
      if (least < best[k]) best.length = k;
    }
    if (best.length === k) best.push(least);
    let count = 0;
    for (let v = 0; v < n; v++) {
      if ((placed >> v) & 1 || here[v] !== least) continue;
      let twin = false;
      for (let i = 0; i < count && !twin; i++) twin = twins(rows, tied[k][i], v);
      if (!twin) tied[k][count++] = v;
    }
    for (let i = 0; i < count; i++) {
      if (++nodes > limit) return false;
      const c = tied[k][i];
      const next = codes[k + 1];
      for (let w = 0; w < n; w++) next[w] = (here[w] << 1) | ((rows[w] >> c) & 1);
      if (!descend(k + 1, placed | (1 << c))) return false;
    }
    return true;
  };
  return descend(0, 0) ? { levels: best, nodes } : undefined;
}

/** The blocks of the canonical labeling of the graph (`canonicalSearch`'s), label n first. */
export function canonicalBlocks(rows: Adjacency, limit = SEARCH_NODE_LIMIT): number[] | undefined {
  return canonicalSearch(rows, limit)?.levels;
}

/** The rank in LabeledGraphs(n) of blocks made by `canonicalBlocks`, exactly. */
export function rankOfBlocks(levels: readonly number[]): bigint {
  const n = levels.length;
  let rank = 0n;
  // Label a's block (levels[n − a]) sits above the pairs of the labels below it.
  for (let a = n - 1; a >= 1; a--) rank = (rank << BigInt(n - a)) | BigInt(levels[n - a]);
  return rank;
}

/** The rank of the graph as labeled, a double: its edges' bits. Undefined past `RANK_VERTEX_LIMIT` vertices. */
export function labeledRank(n: number, edges: readonly (readonly number[])[]): number | undefined {
  if (n > RANK_VERTEX_LIMIT) return undefined;
  return rankOfRows(adjacencyOf(n, edges));
}

function rankOfRows(rows: Adjacency): number {
  return Number(rankOfBlocks(ownLevels(rows)));
}

/** The canonical rank of the graph on 1..n with these edges: the least rank of any labeling.
 *  Undefined past `RANK_VERTEX_LIMIT` vertices (a double no longer holds it) or where the search declines. */
export function canonicalRank(n: number, edges: readonly (readonly number[])[]): number | undefined {
  if (n > RANK_VERTEX_LIMIT) return undefined;
  const levels = canonicalBlocks(adjacencyOf(n, edges));
  return levels === undefined ? undefined : Number(rankOfBlocks(levels));
}

/** Whether the graph is its own canonical form: no labeling has a smaller block at any level. Depth first
 *  over the labelings that match the graph's own blocks so far, with its work arrays made once. */
export function isCanonical(rows: Adjacency, limit = SEARCH_NODE_LIMIT): boolean | undefined {
  const n = rows.length;
  if (n > SEARCH_VERTEX_LIMIT) return undefined;
  const own = ownLevels(rows);
  // codes[k][v]: v's adjacency to the k labels chosen, the first chosen most significant.
  const codes = Array.from({ length: n + 1 }, () => new Int32Array(n));
  const tied = Array.from({ length: n + 1 }, () => new Int8Array(n));
  let nodes = 0;
  // 1 when some labeling has a smaller block below this point, 0 when none does, −1 past the limit.
  const smaller = (k: number, placed: number): number => {
    if (k === n) return 0;
    const here = codes[k];
    const target = own[k];
    let count = 0;
    for (let v = 0; v < n; v++) {
      if ((placed >> v) & 1) continue;
      if (here[v] < target) return 1;
      if (here[v] !== target) continue;
      let twin = false;
      for (let i = 0; i < count && !twin; i++) twin = twins(rows, tied[k][i], v);
      if (!twin) tied[k][count++] = v;
    }
    for (let i = 0; i < count; i++) {
      if (++nodes > limit) return -1;
      const c = tied[k][i];
      const next = codes[k + 1];
      for (let w = 0; w < n; w++) next[w] = (here[w] << 1) | ((rows[w] >> c) & 1);
      const found = smaller(k + 1, placed | (1 << c));
      if (found !== 0) return found;
    }
    return 0;
  };
  const found = smaller(0, 0);
  return found < 0 ? undefined : found === 0;
}

/** The edges, ascending as pairs [u, v], u < v, of the graph whose canonical blocks are `levels`: the pair (a, b)
 *  is bit b − a − 1 of label a's block. */
export function edgesOfBlocks(levels: readonly number[]): number[][] {
  const n = levels.length;
  const edges: number[][] = [];
  for (let a = 1; a < n; a++)
    for (let b = a + 1; b <= n; b++) if ((levels[n - a] >> (b - a - 1)) & 1) edges.push([a, b]);
  return edges;
}

/** The adjacency of the graph with rank `rank` in LabeledGraphs(n): n ≤ 10, so a double holds the bits. */
export function adjacencyOfRank(n: number, rank: number): number[] {
  const rows = Array.from({ length: n }, () => 0);
  let rest = rank;
  for (let a = 0; a < n - 1; a++)
    for (let b = a + 1; b < n; b++) {
      if (rest % 2 === 1) {
        rows[a] |= 1 << b;
        rows[b] |= 1 << a;
      }
      rest = Math.floor(rest / 2);
    }
  return rows;
}

/** The edges of the graph with rank `rank` in LabeledGraphs(n), ascending as pairs [u, v], u < v. */
export function edgesOfRank(n: number, rank: number): number[][] {
  const edges: number[][] = [];
  let rest = rank;
  for (let u = 1; u < n; u++)
    for (let v = u + 1; v <= n; v++) {
      if (rest % 2 === 1) edges.push([u, v]);
      rest = Math.floor(rest / 2);
    }
  return edges;
}

// The canonical ranks for each n, ascending, kept for the process.
const lists: number[][] = [[0]];

/** The canonical ranks of the graphs on n vertices, ascending: the least rank of each isomorphism class.
 *  Generated from the list for n − 1 by the heredity above and kept. Undefined past `CANONICAL_LIST_LIMIT`. */
export function canonicalRanks(n: number): readonly number[] | undefined {
  if (!Number.isInteger(n) || n < 0 || n > CANONICAL_LIST_LIMIT) return undefined;
  for (let m = lists.length; m <= n; m++) {
    const made: number[] = [];
    const sets = 2 ** (m - 1);
    for (const h of lists[m - 1]) {
      const old = adjacencyOfRank(m - 1, h);
      for (let s = 0; s < sets; s++) {
        // Vertex 1 takes the neighbour set s; the old vertices move up one.
        const rows = [s << 1, ...old.map((row, i) => (row << 1) | ((s >> i) & 1))];
        if (isCanonical(rows)) made.push(h * sets + s);
      }
    }
    lists.push(made);
  }
  return lists[n];
}

/** The place of a canonical `rank` in the list for n, or −1 where it is not there. */
export function positionOf(n: number, rank: number): number {
  const list = canonicalRanks(n);
  if (list === undefined) return -1;
  let [low, high] = [0, list.length - 1];
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (list[mid] === rank) return mid;
    if (list[mid] < rank) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
