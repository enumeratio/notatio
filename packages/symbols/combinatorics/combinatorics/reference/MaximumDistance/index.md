---
name: MaximumDistance
domain: Graph statistics
signature: MaximumDistance(graph)
summary: "The greatest distance between two vertices: the diameter."
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000259, of a connected graph; a graph with two components has an infinite diameter. The graph with no vertices gives 0.
