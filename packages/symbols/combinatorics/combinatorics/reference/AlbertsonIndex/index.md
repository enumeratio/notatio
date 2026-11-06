---
name: AlbertsonIndex
domain: Graph statistics
signature: AlbertsonIndex(graph)
summary: The sum over the edges of the difference of the degrees of its ends.
signatures:
  - call: AlbertsonIndex(graph)
    description: The sum over the edges of the difference of the degrees of its ends.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001351, the sum of |d(u) - d(v)| over the edges uv. The graph with no vertices gives 0.
