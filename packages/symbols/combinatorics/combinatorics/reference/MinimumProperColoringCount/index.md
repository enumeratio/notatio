---
name: MinimumProperColoringCount
domain: Graph statistics
signature: MinimumProperColoringCount(graph)
summary: The proper colorings of the vertices in the fewest colors the graph allows.
catalog:
  - system: findstat
    identity: St001109
    url: https://www.findstat.org/St001109
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: MinimumProperColoringCount(graph)
    description: The proper colorings of the vertices in the fewest colors the graph allows.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001109: the chromatic polynomial, the sum over sets of edges A of (-1)^|A| k^components(A), at k the chromatic number. The graph with no vertices has one coloring, the empty one, a convention and not a FindStat row: 1.
