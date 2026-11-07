---
name: BipartiteEdgeDeletionNumber
domain: Graph statistics
signature: BipartiteEdgeDeletionNumber(graph)
summary: The fewest edges whose deletion leaves a bipartite graph.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001572: the edges that fall inside the sides of the best division. The graph with no vertices gives 0.
