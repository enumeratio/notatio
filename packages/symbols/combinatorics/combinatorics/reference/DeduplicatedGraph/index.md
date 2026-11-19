---
name: DeduplicatedGraph
domain: Combinatorial maps
signature: DeduplicatedGraph(LabeledGraph)
summary: The graph on the distinct open neighborhoods, two joined when their members are.
catalog:
  - system: findstat
    identity: Mp00247
    url: https://www.findstat.org/Mp00247
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: DeduplicatedGraph(LabeledGraph)
    description: The graph on the distinct open neighborhoods, two joined when their members are.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00247. A vertex stands for the least vertex with the same neighbors; those representatives, in order, become 1, 2, 3, and so on. Adjacent twins have different neighborhoods and stay apart.
