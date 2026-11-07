---
name: ChromaticCliqueGap
domain: Graph statistics
signature: ChromaticCliqueGap(graph)
summary: The chromatic number less the clique number.
catalog:
  - system: findstat
    identity: St001793
    url: https://www.findstat.org/St001793
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: ChromaticCliqueGap(graph)
    description: The chromatic number less the clique number.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001793, which is 0 on a weakly perfect graph. The graph with no vertices gives 0.
