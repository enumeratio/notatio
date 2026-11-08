---
name: AdjacencyNullity
domain: Graph statistics
signature: AdjacencyNullity(graph)
summary: "The multiplicity of the eigenvalue zero of the adjacency matrix: the vertices less the positive and negative eigenvalues."
signatures:
  - call: AdjacencyNullity(graph)
    description: "The multiplicity of the eigenvalue zero of the adjacency matrix: the vertices less the positive and negative eigenvalues."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000986
    url: https://www.findstat.org/St000986
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000986. The graph with no vertices gives 0.
