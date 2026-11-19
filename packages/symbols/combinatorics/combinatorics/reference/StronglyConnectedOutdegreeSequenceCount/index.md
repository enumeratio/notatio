---
name: StronglyConnectedOutdegreeSequenceCount
domain: Graph statistics
signature: StronglyConnectedOutdegreeSequenceCount(graph)
summary: "The outdegree sequences of the strongly connected orientations: the Tutte polynomial at x = 0, y = 1."
catalog:
  - system: findstat
    identity: St000344
    url: https://www.findstat.org/St000344
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: StronglyConnectedOutdegreeSequenceCount(graph)
    description: "The outdegree sequences of the strongly connected orientations: the Tutte polynomial at x = 0, y = 1."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000344. The graph with no vertices has one, the empty sequence, a convention and not a FindStat row: 1.
