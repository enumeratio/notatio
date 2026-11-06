---
name: OreDegree
domain: Graph statistics
signature: OreDegree(graph)
summary: The greatest sum of the degrees of the two ends of an edge.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000915. A graph with no edge gives 0.
