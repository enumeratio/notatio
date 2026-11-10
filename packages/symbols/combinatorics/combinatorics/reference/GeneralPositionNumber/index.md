---
name: GeneralPositionNumber
domain: Graph statistics
signature: GeneralPositionNumber(graph)
summary: The most vertices in a set with no three on one shortest path.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001655. The graph with no vertices gives 0.
