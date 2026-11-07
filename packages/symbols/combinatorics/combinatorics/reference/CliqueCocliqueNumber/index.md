---
name: CliqueCocliqueNumber
domain: Graph statistics
signature: CliqueCocliqueNumber(graph)
summary: The clique number times the independence number.
catalog:
  - system: findstat
    identity: St000926
    url: https://www.findstat.org/St000926
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: CliqueCocliqueNumber(graph)
    description: The clique number times the independence number.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000926. The graph with no vertices gives 0.
