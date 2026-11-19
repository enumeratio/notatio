---
name: ConnectedComplement
domain: Combinatorial maps
signature: ConnectedComplement(LabeledGraph)
summary: Each connected component replaced by its complement when that complement is connected, else left as it is.
catalog:
  - system: findstat
    identity: Mp00157
    url: https://www.findstat.org/Mp00157
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: ConnectedComplement(LabeledGraph)
    description: Each connected component replaced by its complement when that complement is connected, else left as it is.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00157. A single vertex is its own complement. The vertices keep their numbers, and no edge joins two components.
