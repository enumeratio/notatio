---
name: FeedbackVertexSetNumber
domain: Graph statistics
signature: FeedbackVertexSetNumber(graph)
summary: The fewest vertices whose deletion leaves a graph with no cycle.
catalog:
  - system: findstat
    identity: St001331
    url: https://www.findstat.org/St001331
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: FeedbackVertexSetNumber(graph)
    description: The fewest vertices whose deletion leaves a graph with no cycle.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001331: the vertices less the largest induced forest. The graph with no vertices gives 0.
