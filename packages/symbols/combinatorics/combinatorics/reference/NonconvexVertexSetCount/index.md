---
name: NonconvexVertexSetCount
domain: Graph statistics
signature: NonconvexVertexSetCount(graph)
summary: The sets of vertices that miss a vertex on a shortest path between two of their members.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001764. The graph with no vertices gives 0.
