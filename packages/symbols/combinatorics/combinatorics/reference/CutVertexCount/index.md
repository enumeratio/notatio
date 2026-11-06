---
name: CutVertexCount
domain: Graph statistics
signature: CutVertexCount(graph)
summary: The vertices whose deletion leaves more components.
signatures:
  - call: CutVertexCount(graph)
    description: The vertices whose deletion leaves more components.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000552. The deleted vertex stays as an isolated one, a component of its own. The graph with no vertices gives 0.
