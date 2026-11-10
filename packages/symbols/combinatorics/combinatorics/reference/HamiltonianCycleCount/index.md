---
name: HamiltonianCycleCount
domain: Graph statistics
signature: HamiltonianCycleCount(graph)
summary: The cycles through every vertex.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000379, each cycle counted once however it is started or turned. A graph on fewer than 3 vertices has none. The graph with no vertices gives 0.
