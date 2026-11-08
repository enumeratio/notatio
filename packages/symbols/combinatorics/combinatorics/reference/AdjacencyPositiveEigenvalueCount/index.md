---
name: AdjacencyPositiveEigenvalueCount
domain: Graph statistics
signature: AdjacencyPositiveEigenvalueCount(graph)
summary: The positive eigenvalues of the adjacency matrix, with multiplicity.
signatures:
  - call: AdjacencyPositiveEigenvalueCount(graph)
    description: The positive eigenvalues of the adjacency matrix, with multiplicity.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000985
    url: https://www.findstat.org/St000985
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000985. The adjacency matrix is symmetric, so the eigenvalues are real and Descartes' rule counts the positive ones as the sign changes of the characteristic polynomial. The graph with no vertices gives 0.
