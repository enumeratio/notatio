---
name: ComponentSizePartition
domain: Combinatorial maps
signature: ComponentSizePartition(LabeledGraph)
summary: The sizes of the connected components, largest first.
catalog:
  - system: findstat
    identity: Mp00037
    url: https://www.findstat.org/Mp00037
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: ComponentSizePartition(LabeledGraph)
    description: The sizes of the connected components, largest first.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> integer_partition
---

- Takes a `LabeledGraph` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00037. Lossy: only the sizes are kept.
