---
name: ClosedVertexSetCount
domain: Graph statistics
signature: ClosedVertexSetCount(graph)
summary: The sets of vertices that hold every common neighbor of each two of their members.
signatures:
  - call: ClosedVertexSetCount(graph)
    description: The sets of vertices that hold every common neighbor of each two of their members.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001706
    url: https://www.findstat.org/St001706
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001706. A vertex outside the set is a common neighbor of two members when two of its neighbors are in the set. The graph with no vertices has the empty set, so 1.
