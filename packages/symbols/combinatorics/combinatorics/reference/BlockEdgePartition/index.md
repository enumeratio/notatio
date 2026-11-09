---
name: BlockEdgePartition
domain: Combinatorial maps
signature: BlockEdgePartition(LabeledGraph)
summary: "The number of edges in each block (biconnected component) of the graph, largest first."
catalog:
  - system: findstat
    identity: Mp00276
    url: https://www.findstat.org/Mp00276
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: BlockEdgePartition(LabeledGraph)
    description: "The number of edges in each block (biconnected component) of the graph, largest first."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> integer_partition
---

- Takes a `LabeledGraph` and returns a `IntegerPartition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00276. An isolated vertex is a block with no edges and contributes no part.
