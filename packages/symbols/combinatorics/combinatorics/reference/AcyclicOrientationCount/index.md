---
name: AcyclicOrientationCount
domain: Graph statistics
signature: AcyclicOrientationCount(graph)
summary: The ways to direct every edge so that no directed cycle results.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000269. The sinks of an acyclic orientation form a nonempty independent set, and what is left is acyclic; inclusion-exclusion over the sinks gives the count. The graph with no vertices has one orientation, the empty one, so 1.
