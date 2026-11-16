---
name: ThresholdGraph
domain: Combinatorial maps
signature: ThresholdGraph(IntegerComposition)
summary: "The threshold graph of a composition: for each part c a vertex joined to every earlier vertex, then c - 1 isolated vertices."
catalog:
  - system: findstat
    identity: Mp00184
    url: https://www.findstat.org/Mp00184
    on: IntegerComposition
mapOn:
  - IntegerComposition
signatures:
  - call: ThresholdGraph(IntegerComposition)
    description: "The threshold graph of a composition: for each part c a vertex joined to every earlier vertex, then c - 1 isolated vertices."
    library: enumeratio-combinatorics
    type: (composition) -> labeled_graph
---

- Takes a `IntegerComposition` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00184. A vertex is joined to all earlier vertices exactly when it is the first vertex of a part.
