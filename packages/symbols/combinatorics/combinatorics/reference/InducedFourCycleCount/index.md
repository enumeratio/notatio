---
name: InducedFourCycleCount
domain: Graph statistics
signature: InducedFourCycleCount(graph)
summary: "The sets of four vertices that induce a cycle: every one has exactly two neighbors among the four."
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001305. The graph with no vertices gives 0.
