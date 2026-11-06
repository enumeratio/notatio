---
name: HosoyaIndex
domain: Graph statistics
signature: HosoyaIndex(graph)
summary: The sets of edges with no two sharing a vertex, the empty set included.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000468. The graph with no vertices has the empty set, so 1.
