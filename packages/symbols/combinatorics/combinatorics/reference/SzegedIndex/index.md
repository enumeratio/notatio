---
name: SzegedIndex
domain: Graph statistics
signature: SzegedIndex(graph)
summary: The sum over the edges of the vertices nearer one end times those nearer the other.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000263. A vertex in another component is as far from both ends, so is in neither count. The graph with no vertices gives 0.
