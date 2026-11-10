---
name: HalfDominatingNonblockingSetCount
domain: Graph statistics
signature: HalfDominatingNonblockingSetCount(graph)
summary: Half the sets of vertices that are dominating and whose complement is dominating.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001794. A set is non-blocking when its complement is dominating, and the complement of such a set is another. The graph with no vertices gives 0.
