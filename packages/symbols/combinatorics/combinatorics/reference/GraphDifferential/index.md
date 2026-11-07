---
name: GraphDifferential
domain: Graph statistics
signature: GraphDifferential(graph)
summary: The most that the vertices next to a set, outside it, exceed the set in number.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001723; the empty set gives 0. The graph with no vertices gives 0.
