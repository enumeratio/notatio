---
name: OddDegreeVertexCount
domain: Graph statistics
signature: OddDegreeVertexCount(graph)
summary: The vertices with an odd number of edges.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000311. The graph with no vertices gives 0.
