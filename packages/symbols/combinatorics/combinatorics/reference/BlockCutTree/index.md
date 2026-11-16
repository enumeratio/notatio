---
name: BlockCutTree
domain: Combinatorial maps
signature: BlockCutTree(LabeledGraph)
summary: The tree with a vertex for each cut vertex and each block, a cut vertex joined to the blocks that contain it.
catalog:
  - system: findstat
    identity: Mp00274
    url: https://www.findstat.org/Mp00274
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: BlockCutTree(LabeledGraph)
    description: The tree with a vertex for each cut vertex and each block, a cut vertex joined to the blocks that contain it.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00274. A bridge and an isolated vertex are blocks. The vertices are the cut vertices in order, then the blocks by their least edge, then the isolated vertices in order.
