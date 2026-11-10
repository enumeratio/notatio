---
name: CliqueSizePartition
domain: Combinatorial maps
signature: CliqueSizePartition(LabeledGraph)
summary: The sizes of the maximal cliques of a graph, largest first.
catalog:
  - system: findstat
    identity: Mp00251
    url: https://www.findstat.org/Mp00251
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: CliqueSizePartition(LabeledGraph)
    description: The sizes of the maximal cliques of a graph, largest first.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> integer_partition
---

- Takes a `LabeledGraph` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00251. An isolated vertex is a maximal clique of size 1.
