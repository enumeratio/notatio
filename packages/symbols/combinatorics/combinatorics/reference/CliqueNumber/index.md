---
name: CliqueNumber
domain: Graph statistics
signature: CliqueNumber(graph)
summary: The most vertices that are pairwise adjacent.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000097. A set of s vertices is a clique when it holds s(s - 1) / 2 edges. The graph with no vertices gives 0.
