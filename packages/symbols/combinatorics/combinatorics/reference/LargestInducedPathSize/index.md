---
name: LargestInducedPathSize
domain: Graph statistics
signature: LargestInducedPathSize(graph)
summary: The most vertices that induce a path.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001093, the detour number: a connected set with one fewer edges than vertices is a tree, and a tree with no vertex of degree 3 is a path. The graph with no vertices gives 0.
