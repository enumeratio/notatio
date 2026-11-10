---
name: MaximumDissociationSetCount
domain: Graph statistics
signature: MaximumDissociationSetCount(graph)
summary: The sets of the most vertices in which every vertex has at most one neighbor.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001694. Its title says maximal sets; its code and rows count the sets of greatest size. The graph with no vertices gives 0.
