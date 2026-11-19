---
name: GraphCone
domain: Combinatorial maps
signature: GraphCone(LabeledGraph)
summary: The graph with one more vertex, number n + 1, joined to every vertex.
catalog:
  - system: findstat
    identity: Mp00203
    url: https://www.findstat.org/Mp00203
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: GraphCone(LabeledGraph)
    description: The graph with one more vertex, number n + 1, joined to every vertex.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00203. The edges are listed again in order, since [1, n + 1] sorts before an old [2, 3].
