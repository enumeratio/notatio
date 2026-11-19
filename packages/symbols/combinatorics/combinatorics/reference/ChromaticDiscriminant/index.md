---
name: ChromaticDiscriminant
domain: Graph statistics
signature: ChromaticDiscriminant(graph)
summary: The absolute value of the coefficient of q in the chromatic polynomial.
catalog:
  - system: findstat
    identity: St000948
    url: https://www.findstat.org/St000948
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: ChromaticDiscriminant(graph)
    description: The absolute value of the coefficient of q in the chromatic polynomial.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000948: the chromatic polynomial is the sum over sets of edges A of (-1)^|A| q^components(A), and its coefficient of q is the sum over the sets of rank n - 1, those that leave one component; a disconnected graph has none and gives 0. A single vertex gives 1. The graph with no vertices gives 0, a convention and not a FindStat row.
