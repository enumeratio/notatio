---
name: SpanningSubgraphCount
domain: Graph statistics
signature: SpanningSubgraphCount(graph)
summary: "The subgraphs on all the vertices: 2 to the power of the number of edges."
catalog:
  - system: findstat
    identity: St000343
    url: https://www.findstat.org/St000343
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: SpanningSubgraphCount(graph)
    description: "The subgraphs on all the vertices: 2 to the power of the number of edges."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000343, the Tutte polynomial at x = y = 2. The graph with no vertices has one, so 1.
