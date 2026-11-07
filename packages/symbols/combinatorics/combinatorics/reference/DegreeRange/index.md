---
name: DegreeRange
domain: Graph statistics
signature: DegreeRange(graph)
summary: The greatest degree less the least.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001742. The graph with no vertices gives 0.
