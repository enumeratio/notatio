---
name: VertexConnectivity
domain: Graph statistics
signature: VertexConnectivity(graph)
summary: The fewest vertices whose deletion leaves a disconnected graph; the complete graph on n vertices gives n - 1.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000262. A disconnected graph gives 0. The graph with no vertices gives 0.
