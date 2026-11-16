---
name: OreClosure
domain: Combinatorial maps
signature: OreClosure(LabeledGraph)
summary: Each component of order s with an edge added between every two non-adjacent vertices whose degrees sum to at least s, until none is left.
catalog:
  - system: findstat
    identity: Mp00117
    url: https://www.findstat.org/Mp00117
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: OreClosure(LabeledGraph)
    description: Each component of order s with an edge added between every two non-adjacent vertices whose degrees sum to at least s, until none is left.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00117. The threshold is the order of the component, not of the graph. Every eligible pair is added in a round, and C(n, 2) rounds reach the fixed point.
