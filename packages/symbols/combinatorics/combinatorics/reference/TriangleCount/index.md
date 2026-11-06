---
name: TriangleCount
domain: Graph statistics
signature: TriangleCount(graph)
summary: The triples of vertices that are pairwise adjacent.
signatures:
  - call: TriangleCount(graph)
    description: The triples of vertices that are pairwise adjacent.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000095. An edge uv and a vertex w above v adjacent to both. The graph with no vertices gives 0.
