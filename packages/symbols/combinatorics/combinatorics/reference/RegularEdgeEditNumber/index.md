---
name: RegularEdgeEditNumber
domain: Graph statistics
signature: RegularEdgeEditNumber(graph)
summary: The fewest edges to add or delete to make a graph regular.
catalog:
  - system: findstat
    identity: St001574
    url: https://www.findstat.org/St001574
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: RegularEdgeEditNumber(graph)
    description: The fewest edges to add or delete to make a graph regular.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001574: the fewest differences between the edges and those of a regular graph on the same vertices; the graph with no edges is regular. The graph with no vertices gives 0.
