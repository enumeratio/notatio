---
name: LargestInducedPathSize
domain: Graph statistics
signature: LargestInducedPathSize(graph)
summary: The most vertices that induce a path.
signatures:
  - call: LargestInducedPathSize(graph)
    description: The most vertices that induce a path.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001093
    url: https://www.findstat.org/St001093
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001093, the detour number: a connected set with one fewer edges than vertices is a tree, and a tree with no vertex of degree 3 is a path. The graph with no vertices gives 0.
