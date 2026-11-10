---
name: ShortestMaximalPathLength
domain: Graph statistics
signature: ShortestMaximalPathLength(graph)
summary: The edges of the shortest path that no vertex can be added to at either end.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001119; a vertex alone is a path of length 0, maximal when it has no neighbor. The graph with no vertices gives 0.
