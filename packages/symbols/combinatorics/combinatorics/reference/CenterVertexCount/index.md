---
name: CenterVertexCount
domain: Graph statistics
signature: CenterVertexCount(graph)
summary: The vertices whose greatest distance to another vertex is the least.
signatures:
  - call: CenterVertexCount(graph)
    description: The vertices whose greatest distance to another vertex is the least.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001342. In a disconnected graph every vertex is as far as 2n from another, so all are central. The graph with no vertices gives 0.
