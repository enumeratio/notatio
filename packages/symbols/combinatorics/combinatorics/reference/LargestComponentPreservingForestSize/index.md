---
name: LargestComponentPreservingForestSize
domain: Graph statistics
signature: LargestComponentPreservingForestSize(graph)
summary: The most vertices that induce a forest with as many components as the graph.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001318. A forest has as many components as its vertices less its edges. The graph with no vertices gives 0.
