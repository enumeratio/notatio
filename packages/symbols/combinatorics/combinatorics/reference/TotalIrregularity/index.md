---
name: TotalIrregularity
domain: Graph statistics
signature: TotalIrregularity(graph)
summary: The sum over the unordered pairs of vertices of the difference of their degrees.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001522. The graph with no vertices gives 0.
