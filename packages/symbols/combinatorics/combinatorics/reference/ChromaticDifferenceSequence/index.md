---
name: ChromaticDifferenceSequence
domain: Combinatorial maps
signature: ChromaticDifferenceSequence(LabeledGraph)
summary: The differences alpha(m) - alpha(m - 1), where alpha(m) is the most vertices of an m-colorable induced subgraph, up to the first m at which alpha(m) is every vertex.
catalog:
  - system: findstat
    identity: Mp00324
    url: https://www.findstat.org/Mp00324
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: ChromaticDifferenceSequence(LabeledGraph)
    description: The differences alpha(m) - alpha(m - 1), where alpha(m) is the most vertices of an m-colorable induced subgraph, up to the first m at which alpha(m) is every vertex.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> composition
---

- Takes a `LabeledGraph` and returns a `IntegerComposition` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00324. The parts sum to the number of vertices and their count is the chromatic number.
