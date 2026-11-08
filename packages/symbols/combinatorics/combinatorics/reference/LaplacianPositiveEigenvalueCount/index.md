---
name: LaplacianPositiveEigenvalueCount
domain: Graph statistics
signature: LaplacianPositiveEigenvalueCount(graph)
summary: The positive eigenvalues of the Laplacian, with multiplicity.
signatures:
  - call: LaplacianPositiveEigenvalueCount(graph)
    description: The positive eigenvalues of the Laplacian, with multiplicity.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000987
    url: https://www.findstat.org/St000987
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000987: the vertices less the components. The graph with no vertices gives 0.
