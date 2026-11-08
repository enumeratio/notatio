---
name: AdjacencyNegativeEigenvalueCount
domain: Graph statistics
signature: AdjacencyNegativeEigenvalueCount(graph)
summary: The negative eigenvalues of the adjacency matrix, with multiplicity.
signatures:
  - call: AdjacencyNegativeEigenvalueCount(graph)
    description: The negative eigenvalues of the adjacency matrix, with multiplicity.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St001971
    url: https://www.findstat.org/St001971
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001971: the sign changes of the characteristic polynomial at -x. The graph with no vertices gives 0.
