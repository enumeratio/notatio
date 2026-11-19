---
name: TutteMinusOneSpanningTreeQuotient
domain: Graph statistics
signature: TutteMinusOneSpanningTreeQuotient(graph)
summary: The spanning trees divided, rounded down, by the absolute value of the Tutte polynomial at x = -1, y = -1.
catalog:
  - system: findstat
    identity: St001796
    url: https://www.findstat.org/St001796
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: TutteMinusOneSpanningTreeQuotient(graph)
    description: The spanning trees divided, rounded down, by the absolute value of the Tutte polynomial at x = -1, y = -1.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001796: SpanningTreeCount over the absolute value of the Tutte polynomial at (-1, -1), which is never 0; the sets of edges with size = rank = n - 1 are the spanning trees, so a disconnected graph has none and gives 0. The graph with no vertices has no spanning-tree count, as SpanningTreeCount: 0.
