---
name: InducedMatchingNumber
domain: Graph statistics
signature: InducedMatchingNumber(graph)
summary: The most edges whose ends induce a subgraph that is just those edges.
signatures:
  - call: InducedMatchingNumber(graph)
    description: The most edges whose ends induce a subgraph that is just those edges.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001393
    url: https://www.findstat.org/St001393
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001393: half the vertices of the largest set in which every vertex has exactly one neighbor. The graph with no vertices gives 0.
