// Whether two graphs a map hands over are isomorphic, by canonical form (../../graphs/src/canonical.ts). A map's image
// reaches 12 vertices and more, where the rank in LabeledGraphs(n) passes a double (66 bits at 12), so graphs are
// compared by their lists of blocks, never by a number.

import { adjacencyOf, canonicalBlocks, SEARCH_VERTEX_LIMIT } from "../../graphs/src/canonical.ts";

/** A graph on the vertices 1 to `vertices` with these edges (pairs of distinct vertices, either order). */
export interface GraphImage {
  readonly vertices: number;
  readonly edges: readonly (readonly number[])[];
}

/** A graph as MathJSON: `LabeledGraph(Tuple(n, List(List(u, v), …)))` or the bare `Tuple`, as `readObject` and the
 *  maps give it. Undefined for anything else. */
export function graphImageOf(json: unknown): GraphImage | undefined {
  const tuple = Array.isArray(json) && json[0] === "LabeledGraph" ? json[1] : json;
  if (!Array.isArray(tuple) || tuple[0] !== "Tuple" || tuple.length !== 3) return undefined;
  const [vertices, list] = [tuple[1] as unknown, tuple[2] as unknown];
  if (!Number.isInteger(vertices) || !Array.isArray(list) || list[0] !== "List") return undefined;
  const edges: number[][] = [];
  for (const pair of list.slice(1) as unknown[]) {
    if (!Array.isArray(pair) || pair[0] !== "List" || pair.length !== 3) return undefined;
    edges.push([pair[1], pair[2]] as number[]);
  }
  return { vertices: vertices as number, edges };
}

/** The canonical blocks of the graph (label n first): equal for two graphs exactly when they are isomorphic. Undefined
 *  where the search declines, a graph past 30 vertices or too symmetric for its branch limit. */
export function canonicalImage(graph: GraphImage): readonly number[] | undefined {
  return graph.vertices > SEARCH_VERTEX_LIMIT ? undefined : canonicalBlocks(adjacencyOf(graph.vertices, graph.edges));
}

/** Whether the two graphs are isomorphic, or undefined where the search declines either. */
export function isomorphicImages(a: GraphImage, b: GraphImage): boolean | undefined {
  if (a.vertices !== b.vertices || a.edges.length !== b.edges.length) return false;
  const [blocksA, blocksB] = [canonicalImage(a), canonicalImage(b)];
  if (blocksA === undefined || blocksB === undefined) return undefined;
  return blocksA.every((block, i) => block === blocksB[i]);
}
