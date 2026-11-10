---
name: RestrainedDominationNumber
domain: Graph statistics
signature: RestrainedDominationNumber(graph)
summary: The fewest vertices in a set such that every vertex outside it has a neighbor inside it and a neighbor outside it.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001672. The graph with no vertices gives 0.
