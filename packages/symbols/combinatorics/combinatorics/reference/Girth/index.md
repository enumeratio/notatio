---
name: Girth
domain: Graph statistics
signature: Girth(graph)
summary: The length of the shortest cycle.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000264, of a graph that is not a tree; a graph without a cycle has an infinite girth. The graph with no vertices gives 0.
