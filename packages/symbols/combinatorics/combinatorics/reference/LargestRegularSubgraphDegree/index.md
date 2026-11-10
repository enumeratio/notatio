---
name: LargestRegularSubgraphDegree
domain: Graph statistics
signature: LargestRegularSubgraphDegree(graph)
summary: The greatest k such that some set of edges gives every vertex it meets degree k.
catalog:
  - system: findstat
    identity: St001358
    url: https://www.findstat.org/St001358
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: LargestRegularSubgraphDegree(graph)
    description: The greatest k such that some set of edges gives every vertex it meets degree k.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001358: the degrees add up to k times the vertices met exactly when the met ones all have degree k. The graph with no vertices gives 0.
