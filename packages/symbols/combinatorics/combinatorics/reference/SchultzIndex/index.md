---
name: SchultzIndex
domain: Graph statistics
signature: SchultzIndex(graph)
summary: The sum over the pairs of vertices of the sum of their degrees times their distance.
signatures:
  - call: SchultzIndex(graph)
    description: The sum over the pairs of vertices of the sum of their degrees times their distance.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000464, of a connected graph; a pair with no path adds nothing. The graph with no vertices gives 0.
