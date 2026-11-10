---
name: GraphEulerCharacteristic
domain: Graph statistics
signature: GraphEulerCharacteristic(graph)
summary: The vertices less the edges.
signatures:
  - call: GraphEulerCharacteristic(graph)
    description: The vertices less the edges.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001828
    url: https://www.findstat.org/St001828
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001828, of the graph as a simplicial complex of dimension at most 1. The graph with no vertices gives 0.
