---
name: ChromaticPolynomialDerivativeAtOne
domain: Graph statistics
signature: ChromaticPolynomialDerivativeAtOne(graph)
summary: The absolute value of the derivative of the chromatic polynomial at 1.
catalog:
  - system: findstat
    identity: St001070
    url: https://www.findstat.org/St001070
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: ChromaticPolynomialDerivativeAtOne(graph)
    description: The absolute value of the derivative of the chromatic polynomial at 1.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001070: the chromatic polynomial is the sum over sets of edges A of (-1)^|A| k^components(A), and the components of A are n less its rank. The graph with no vertices gives 0.
