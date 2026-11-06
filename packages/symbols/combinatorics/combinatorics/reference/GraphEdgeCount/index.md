---
name: GraphEdgeCount
domain: Graph statistics
signature: GraphEdgeCount(graph)
summary: The edges of the graph.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000081. The graph with no vertices gives 0.
