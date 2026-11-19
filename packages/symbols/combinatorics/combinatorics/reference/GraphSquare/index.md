---
name: GraphSquare
domain: Combinatorial maps
signature: GraphSquare(LabeledGraph)
summary: "The graph that joins two vertices at distance 1 or 2: adjacent, or with a common neighbor."
catalog:
  - system: findstat
    identity: Mp00147
    url: https://www.findstat.org/Mp00147
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: GraphSquare(LabeledGraph)
    description: "The graph that joins two vertices at distance 1 or 2: adjacent, or with a common neighbor."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00147. The vertices keep their numbers.
