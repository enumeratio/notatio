---
name: MaximumEigenvalueMultiplicity
domain: Graph statistics
signature: MaximumEigenvalueMultiplicity(graph)
summary: The greatest multiplicity of an eigenvalue of the adjacency matrix.
signatures:
  - call: MaximumEigenvalueMultiplicity(graph)
    description: The greatest multiplicity of an eigenvalue of the adjacency matrix.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000776
    url: https://www.findstat.org/St000776
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000776. A root of multiplicity m is a root of the m - 1 greatest common divisors of the polynomial with its derivatives in turn. The graph with no vertices gives 0.
