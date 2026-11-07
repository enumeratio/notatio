---
name: SmallestMissingDegree
domain: Graph statistics
signature: SmallestMissingDegree(graph)
summary: The least number, 0 or more, that is not the degree of any vertex.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001367. The graph with no vertices gives 0.
