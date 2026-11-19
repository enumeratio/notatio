---
name: IsIsomorphicGraph
domain: Collections
signature: IsIsomorphicGraph(g1, g2)
summary: Whether two [[Graph]] or [[LabeledGraphs]] values have the same structure, up to relabelling vertices.
signatures:
  - call: IsIsomorphicGraph(g1, g2)
    description: true iff some relabelling of g1's vertices reproduces g2's edges exactly (direction included); unevaluated once either graph has more than 16 vertices (9 where an edge is directed or the graph is weighted or has a loop).
    library: enumeratio-combinatorics
    type: (any, any) -> boolean
seeAlso:
  - IsConnectedGraph
names:
  wolfram: IsomorphicGraphQ
bindings:
  - origin: mapped
    form: sage
    template: ($1).is_isomorphic($2)
    arity: 2
    checked:
      version: "10.9"
      on: 2026-10-16
---

- Wolfram calls this `IsomorphicGraphQ`; this library uses the `Is…` spelling everywhere.
- Two `LabeledGraph` values, and two `Graph` objects that are undirected, unweighted and loop-free, are compared by [[CanonicalGraph]]'s search: equal canonical forms are isomorphic. Both are cheap-filtered first by vertex count, edge count and sorted degree sequence, then fine through 16 vertices: the path on 16 vertices, the hardest graph measured, takes 1.5 million search branches (0.2 s), and the cycles, complete bipartite graphs, Petersen graph, Paley graphs on 9 and 13 vertices and the 4 × 4 rook's graph take less. Past 16 vertices the call stays unevaluated, with a message, rather than guessing; so it does when the search passes its two-million-branch limit on a graph this symmetric.
- A graph with a directed edge, an edge weight or a loop is tested by brute force over all n! vertex permutations -- fine through 9 vertices (9! = 362,880), unevaluated beyond that.
