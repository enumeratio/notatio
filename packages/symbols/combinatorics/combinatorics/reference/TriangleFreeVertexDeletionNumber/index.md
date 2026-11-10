---
name: TriangleFreeVertexDeletionNumber
domain: Graph statistics
signature: TriangleFreeVertexDeletionNumber(graph)
summary: The fewest vertices whose deletion leaves a graph with no triangle.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001336: the vertices less the largest set that holds no triangle. The graph with no vertices gives 0.
