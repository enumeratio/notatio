---
name: SzegedWienerGap
domain: Graph statistics
signature: SzegedWienerGap(graph)
summary: The Szeged index less the Wiener index.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000403, the difference of St000263 and St000265, with their conventions for a disconnected graph. The graph with no vertices gives 0.
