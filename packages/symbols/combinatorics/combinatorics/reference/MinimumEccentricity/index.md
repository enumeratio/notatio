---
name: MinimumEccentricity
domain: Graph statistics
signature: MinimumEccentricity(graph)
summary: "The least eccentricity of a vertex, the greatest distance from it to another vertex: the radius."
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000260, of a connected graph; with two components every vertex has an infinite eccentricity. The graph with no vertices gives 0.
