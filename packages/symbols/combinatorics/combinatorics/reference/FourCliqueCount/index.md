---
name: FourCliqueCount
domain: Graph statistics
signature: FourCliqueCount(graph)
summary: The sets of four vertices that are pairwise adjacent.
signatures:
  - call: FourCliqueCount(graph)
    description: The sets of four vertices that are pairwise adjacent.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001309. The graph with no vertices gives 0.
