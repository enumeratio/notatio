---
name: NegativeEigenvaluePairGap
domain: Graph statistics
signature: NegativeEigenvaluePairGap(graph)
summary: The ways to choose a pair of negative eigenvalues of the adjacency matrix, or one of them twice, less the positive eigenvalues.
signatures:
  - call: NegativeEigenvaluePairGap(graph)
    description: The ways to choose a pair of negative eigenvalues of the adjacency matrix, or one of them twice, less the positive eigenvalues.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001969
    url: https://www.findstat.org/St001969
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001969: C(negative + 1, 2) less positive, conjectured nonnegative. The graph with no vertices gives 0.
