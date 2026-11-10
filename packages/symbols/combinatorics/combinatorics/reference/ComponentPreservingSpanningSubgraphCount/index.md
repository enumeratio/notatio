---
name: ComponentPreservingSpanningSubgraphCount
domain: Graph statistics
signature: ComponentPreservingSpanningSubgraphCount(graph)
summary: The sets of edges that leave the graph with the same connected components.
catalog:
  - system: findstat
    identity: St000266
    url: https://www.findstat.org/St000266
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000266, the Tutte polynomial at x = 1, y = 2. The graph with no vertices has one, the empty graph, so 1.
