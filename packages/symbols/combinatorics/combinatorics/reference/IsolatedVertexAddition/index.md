---
name: IsolatedVertexAddition
domain: Combinatorial maps
signature: IsolatedVertexAddition(LabeledGraph)
summary: The graph with one more vertex, number n + 1, joined to none.
catalog:
  - system: findstat
    identity: Mp00259
    url: https://www.findstat.org/Mp00259
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: IsolatedVertexAddition(LabeledGraph)
    description: The graph with one more vertex, number n + 1, joined to none.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00259.
