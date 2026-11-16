---
name: InversionGraph
domain: Combinatorial maps
signature: InversionGraph(Permutation)
summary: The graph on the positions 1 .. n, joined when i < j and the entry at i is above the entry at j.
catalog:
  - system: findstat
    identity: Mp00160
    url: https://www.findstat.org/Mp00160
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: InversionGraph(Permutation)
    description: The graph on the positions 1 .. n, joined when i < j and the entry at i is above the entry at j.
    library: enumeratio-combinatorics
    type: (permutation) -> labeled_graph
---

- Takes a `Permutation` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00160. The vertices are the positions.
