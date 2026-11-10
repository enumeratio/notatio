---
name: LargestRegularSpanningSubgraphDegree
domain: Graph statistics
signature: LargestRegularSpanningSubgraphDegree(graph)
summary: The greatest k such that some set of edges gives every vertex degree k.
catalog:
  - system: findstat
    identity: St001357
    url: https://www.findstat.org/St001357
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: LargestRegularSpanningSubgraphDegree(graph)
    description: The greatest k such that some set of edges gives every vertex degree k.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001357, the largest k with a k-factor; the empty set of edges is the 0-factor. The graph with no vertices gives 0.
