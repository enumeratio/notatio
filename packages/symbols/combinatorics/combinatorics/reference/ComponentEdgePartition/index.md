---
name: ComponentEdgePartition
domain: Combinatorial maps
signature: ComponentEdgePartition(LabeledGraph)
summary: The numbers of edges of the connected components, largest first, a component with no edge left out.
catalog:
  - system: findstat
    identity: Mp00275
    url: https://www.findstat.org/Mp00275
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: ComponentEdgePartition(LabeledGraph)
    description: The numbers of edges of the connected components, largest first, a component with no edge left out.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> integer_partition
---

- Takes a `LabeledGraph` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00275.
