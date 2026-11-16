// Readings for maps batch 22 (graph-valued maps), after the Sage code FindStat states for each. A graph is read and
// written in FindStat's grammar, `([(0,1),(1,2)],3)`, with the vertices 0 .. n - 1; a reading's graph falls into
// whatever labeling its code gives, and the test compares it with FindStat's up to isomorphism, so the text here is
// not FindStat's spelling. Mp00324's image is a composition and is compared as written.

import type { Reading } from "./map-findstat-readings.ts";

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, k) => from + k);

/** A graph as its vertex count and its neighbor sets. */
interface Graph {
  readonly n: number;
  readonly nbrs: Set<number>[];
}

const makeGraph = (n: number, edges: readonly (readonly [number, number])[]): Graph => {
  const nbrs = range(0, n - 1).map(() => new Set<number>());
  for (const [a, b] of edges) {
    nbrs[a]!.add(b);
    nbrs[b]!.add(a);
  }
  return { n, nbrs };
};

/** FindStat's `([(0,1)],2)`. */
const readGraph = (text: string): Graph => {
  const match = /^\(\[(.*)\],(\d+)\)$/.exec(text.replace(/\s+/g, ""))!;
  const edges = [...match[1]!.matchAll(/\((\d+),(\d+)\)/g)].map((e): [number, number] => [Number(e[1]), Number(e[2])]);
  return makeGraph(Number(match[2]), edges);
};

const edgesOf = (g: Graph): [number, number][] =>
  range(0, g.n - 1).flatMap((a) => [...g.nbrs[a]!].filter((b) => b > a).map((b): [number, number] => [a, b]));

const writeGraph = (g: Graph): string =>
  `([${edgesOf(g)
    .toSorted((p, q) => p[0] - q[0] || p[1] - q[1])
    .map(([a, b]) => `(${a},${b})`)
    .join(",")}],${g.n})`;

/** The graph on `n` vertices whose pairs a < b satisfy `joined`. */
const graphWhere = (n: number, joined: (a: number, b: number) => boolean): string =>
  writeGraph(
    makeGraph(
      n,
      range(0, n - 1).flatMap((a) =>
        range(a + 1, n - 1)
          .filter((b) => joined(a, b))
          .map((b): [number, number] => [a, b]),
      ),
    ),
  );

/** The connected components, each as a sorted vertex list. */
const components = (g: Graph, among: readonly number[] = range(0, g.n - 1)): number[][] => {
  const inside = new Set(among);
  const seen = new Set<number>();
  const out: number[][] = [];
  for (const start of among) {
    if (seen.has(start)) continue;
    const stack = [start];
    const part: number[] = [];
    seen.add(start);
    while (stack.length > 0) {
      const v = stack.pop()!;
      part.push(v);
      for (const w of g.nbrs[v]!)
        if (inside.has(w) && !seen.has(w)) {
          seen.add(w);
          stack.push(w);
        }
    }
    out.push(part.toSorted((a, b) => a - b));
  }
  return out;
};

// --- Mp00111: the complement; Mp00147: the square, G.power(2) ---

const complement = (text: string): string => {
  const g = readGraph(text);
  return graphWhere(g.n, (a, b) => !g.nbrs[a]!.has(b));
};

const square = (text: string): string => {
  const g = readGraph(text);
  return graphWhere(g.n, (a, b) => g.nbrs[a]!.has(b) || [...g.nbrs[a]!].some((c) => g.nbrs[c]!.has(b)));
};

// --- Mp00203, Mp00259: a vertex n added, joined to all or to none ---

const cone = (text: string): string => {
  const g = readGraph(text);
  return graphWhere(g.n + 1, (a, b) => b === g.n || g.nbrs[a]!.has(b));
};

const isolatedVertexAdded = (text: string): string => {
  const g = readGraph(text);
  return writeGraph({ n: g.n + 1, nbrs: [...g.nbrs, new Set<number>()] });
};

// --- Mp00156: G.line_graph(), one vertex per edge, joined when the edges share an end ---

const lineGraph = (text: string): string => {
  const edges = edgesOf(readGraph(text));
  return graphWhere(edges.length, (i, j) => edges[i]!.some((end) => edges[j]!.includes(end)));
};

// --- Mp00157: the complement of each component when it is connected, else the component ---

const connectedComplement = (text: string): string => {
  const g = readGraph(text);
  const out: [number, number][] = [];
  for (const part of components(g)) {
    const inPart = new Set(part);
    const flipped = makeGraph(
      g.n,
      part.flatMap((a) => part.filter((b) => b > a && !g.nbrs[a]!.has(b)).map((b): [number, number] => [a, b])),
    );
    const keepFlipped = components(flipped, part).length === 1;
    out.push(...(keepFlipped ? edgesOf(flipped) : edgesOf(g).filter(([a]) => inPart.has(a))));
  }
  return writeGraph(makeGraph(g.n, out));
};

// --- Mp00117: the Ore closure, one edge at a time as the Sage loop adds it ---

const oreClosure = (text: string): string => {
  const g = readGraph(text);
  const pending: [[number, number], number][] = components(g).flatMap((part) =>
    part.flatMap((a) =>
      part.filter((b) => b > a && !g.nbrs[a]!.has(b)).map((b): [[number, number], number] => [[a, b], part.length]),
    ),
  );
  let modified = true;
  while (modified) {
    modified = false;
    for (let k = 0; k < pending.length; k++) {
      const [[i, j], order] = pending[k]!;
      if (g.nbrs[i]!.size + g.nbrs[j]!.size >= order) {
        pending.splice(k, 1);
        g.nbrs[i]!.add(j);
        g.nbrs[j]!.add(i);
        modified = true;
        break;
      }
    }
  }
  return writeGraph(g);
};

// --- Mp00247: one vertex per distinct neighborhood, joined by the first member of each class ---

const deduplicate = (text: string): string => {
  const g = readGraph(text);
  const classes = new Map<string, number[]>();
  for (const v of range(0, g.n - 1)) {
    const key = [...g.nbrs[v]!].toSorted((a, b) => a - b).join(",");
    classes.set(key, [...(classes.get(key) ?? []), v]);
  }
  const firsts = [...classes.values()].map((members) => members[0]!);
  return graphWhere(firsts.length, (a, b) => g.nbrs[firsts[a]!]!.has(firsts[b]!));
};

// --- Mp00250: the intersection graph of the maximal cliques (Bron-Kerbosch) ---

const cliqueGraph = (text: string): string => {
  const g = readGraph(text);
  const cliques: Set<number>[] = [];
  const grow = (current: number[], candidates: number[], excluded: number[]): void => {
    if (candidates.length === 0 && excluded.length === 0) {
      cliques.push(new Set(current));
      return;
    }
    const left = [...candidates];
    const barred = [...excluded];
    for (const v of candidates) {
      grow(
        [...current, v],
        left.filter((w) => g.nbrs[v]!.has(w)),
        barred.filter((w) => g.nbrs[v]!.has(w)),
      );
      left.splice(left.indexOf(v), 1);
      barred.push(v);
    }
  };
  grow([], range(0, g.n - 1), []);
  return graphWhere(cliques.length, (a, b) => [...cliques[a]!].some((v) => cliques[b]!.has(v)));
};

// --- Mp00264: the 2-core, then isolated vertices until the component count is back ---

const deleteEndpoints = (text: string): string => {
  const g = readGraph(text);
  const alive = new Set(range(0, g.n - 1));
  const degree = (v: number): number => [...g.nbrs[v]!].filter((w) => alive.has(w)).length;
  for (let peeled = true; peeled;) {
    peeled = false;
    for (const v of alive)
      if (degree(v) < 2) {
        alive.delete(v);
        peeled = true;
      }
  }
  const kept = [...alive].toSorted((a, b) => a - b);
  const lost = components(g).length - components(g, kept).length;
  return graphWhere(kept.length + lost, (a, b) => b < kept.length && g.nbrs[kept[a]!]!.has(kept[b]!));
};

// --- Mp00274: the block-cut tree, the blocks from Tarjan's depth-first search ---

const blockCutTree = (text: string): string => {
  const g = readGraph(text);
  const blocks: Set<number>[] = [];
  const order = new Array<number>(g.n).fill(-1);
  const low = new Array<number>(g.n).fill(0);
  const stack: [number, number][] = [];
  let clock = 0;
  const visit = (v: number, parent: number): void => {
    order[v] = low[v] = clock++;
    for (const w of g.nbrs[v]!) {
      if (order[w]! === -1) {
        stack.push([v, w]);
        visit(w, v);
        low[v] = Math.min(low[v]!, low[w]!);
        if (low[w]! >= order[v]!) {
          const block = new Set<number>();
          for (let edge = stack.pop()!; ; edge = stack.pop()!) {
            block.add(edge[0]);
            block.add(edge[1]);
            if (edge[0] === v && edge[1] === w) break;
          }
          blocks.push(block);
        }
      } else if (w !== parent && order[w]! < order[v]!) {
        stack.push([v, w]);
        low[v] = Math.min(low[v]!, order[w]!);
      }
    }
  };
  for (const v of range(0, g.n - 1)) {
    if (order[v] !== -1) continue;
    visit(v, -1);
    if (g.nbrs[v]!.size === 0) blocks.push(new Set([v]));
  }
  const cuts = range(0, g.n - 1).filter((v) => blocks.filter((b) => b.has(v)).length > 1);
  return graphWhere(cuts.length + blocks.length, (a, b) => b >= cuts.length && blocks[b - cuts.length]!.has(cuts[a]!));
};

// --- Mp00324: alpha_m by assigning each vertex a color 1 .. m or none, then the differences ---

const chromaticDifferences = (text: string): string => {
  const g = readGraph(text);
  const mostColorable = (colors: number): number => {
    const color = new Array<number>(g.n).fill(0);
    let best = 0;
    const assign = (v: number, used: number, colored: number): void => {
      if (colored + (g.n - v) <= best) return;
      if (v === g.n) {
        best = colored;
        return;
      }
      for (let c = 1; c <= Math.min(colors, used + 1); c++) {
        if ([...g.nbrs[v]!].some((w) => w < v && color[w] === c)) continue;
        color[v] = c;
        assign(v + 1, Math.max(used, c), colored + 1);
        color[v] = 0;
      }
      assign(v + 1, used, colored);
    };
    assign(0, 0, 0);
    return best;
  };
  const alpha = [0];
  for (let m = 1; m <= g.n && alpha.at(-1) !== g.n; m++) alpha.push(mostColorable(m));
  return `[${alpha
    .slice(1)
    .map((a, k) => a - alpha[k]!)
    .join(",")}]`;
};

// --- Mp00160: the inversions of a permutation; Mp00184: dominating and isolated vertices from a composition ---

const inversionGraph = (text: string): string => {
  const pi = JSON.parse(text) as number[];
  return graphWhere(pi.length, (i, j) => pi[i]! > pi[j]!);
};

const thresholdGraph = (text: string): string => {
  const parts = JSON.parse(text) as number[];
  const edges: [number, number][] = [];
  let n = 0;
  for (const part of parts) {
    const v = n++;
    for (let u = 0; u < v; u++) edges.push([u, v]);
    n += part - 1;
  }
  return writeGraph(makeGraph(n, edges));
};

// --- Mp00011, Mp00046: the edges between a tree's nodes and their parents ---

/** A binary tree `[[.,.],.]` as the pairs [parent, child] of its internal nodes, the nodes numbered as met. */
const binaryTreeGraph = (text: string): string => {
  let at = 0;
  let next = 0;
  const edges: [number, number][] = [];
  const parse = (): number | undefined => {
    if (text[at] === ".") {
      at++;
      return undefined;
    }
    at++; // "["
    const node = next++;
    for (const child of [parse(), (at++, parse())]) if (child !== undefined) edges.push([node, child]);
    at++; // "]"
    return node;
  };
  parse();
  return writeGraph(makeGraph(next, edges));
};

/** An ordered tree `[[],[[]]]`: a node is the bracket pair of its children. */
const orderedTreeGraph = (text: string): string => {
  let at = 0;
  let next = 0;
  const edges: [number, number][] = [];
  const parse = (): number => {
    at++; // "["
    const node = next++;
    while (text[at] !== "]") {
      if (text[at] === ",") at++;
      edges.push([node, parse()]);
    }
    at++; // "]"
    return node;
  };
  parse();
  return writeGraph(makeGraph(next, edges));
};

export const BATCH_TWENTYTWO_READINGS: Readonly<Record<string, Reading>> = {
  "GraphComplement@LabeledGraph": complement,
  "GraphSquare@LabeledGraph": square,
  "GraphCone@LabeledGraph": cone,
  "IsolatedVertexAddition@LabeledGraph": isolatedVertexAdded,
  "LineGraph@LabeledGraph": lineGraph,
  "ConnectedComplement@LabeledGraph": connectedComplement,
  "OreClosure@LabeledGraph": oreClosure,
  "DeduplicatedGraph@LabeledGraph": deduplicate,
  "CliqueGraph@LabeledGraph": cliqueGraph,
  "EndpointDeletion@LabeledGraph": deleteEndpoints,
  "BlockCutTree@LabeledGraph": blockCutTree,
  "ChromaticDifferenceSequence@LabeledGraph": chromaticDifferences,
  "InversionGraph@Permutation": inversionGraph,
  "ThresholdGraph@IntegerComposition": thresholdGraph,
  "UnderlyingGraph@BinaryTree": binaryTreeGraph,
  "UnderlyingGraph@OrderedTree": orderedTreeGraph,
};

/** Each reading's FindStat map. */
export const BATCH_TWENTYTWO_IDS: Readonly<Record<string, string>> = {
  "GraphComplement@LabeledGraph": "Mp00111",
  "GraphSquare@LabeledGraph": "Mp00147",
  "GraphCone@LabeledGraph": "Mp00203",
  "IsolatedVertexAddition@LabeledGraph": "Mp00259",
  "LineGraph@LabeledGraph": "Mp00156",
  "ConnectedComplement@LabeledGraph": "Mp00157",
  "OreClosure@LabeledGraph": "Mp00117",
  "DeduplicatedGraph@LabeledGraph": "Mp00247",
  "CliqueGraph@LabeledGraph": "Mp00250",
  "EndpointDeletion@LabeledGraph": "Mp00264",
  "BlockCutTree@LabeledGraph": "Mp00274",
  "ChromaticDifferenceSequence@LabeledGraph": "Mp00324",
  "InversionGraph@Permutation": "Mp00160",
  "ThresholdGraph@IntegerComposition": "Mp00184",
  "UnderlyingGraph@BinaryTree": "Mp00011",
  "UnderlyingGraph@OrderedTree": "Mp00046",
};
