---
name: LineGraph
domain: Collections
signature: LineGraph(g)
summary: The graph whose vertices are the edges of g, joined when the original edges share an endpoint.
signatures:
  - call: LineGraph(g)
    description: one vertex per edge of g (numbered 1..EdgeCount(g), in EdgeList order), UNDIRECTED regardless of g's own edge directions.
    library: enumeratio-combinatorics
    type: ((labeled_graph) -> labeled_graph) & ((value) -> value)
    types:
      - labeled_graph
seeAlso:
  - VertexDegree
  - AdjacencyGraph
names:
  wolframIdentity: true
bindings:
  - origin: mapped
    form: sage
    template: ($1).line_graph()
    arity: 1
    checked:
      version: "10.9"
      on: 2026-10-16
catalog:
  - system: findstat
    identity: Mp00156
    url: https://www.findstat.org/Mp00156
    on: LabeledGraph
mapOn:
  - LabeledGraph
---

- EdgeCount(LineGraph(g)) = sum over v of C(VertexDegree(v), 2) for a simple g -- every pair of edges sharing vertex v contributes one line-graph edge.
- Also takes a `LabeledGraph`, returning a `LabeledGraph` (FindStat's Mp00156): vertex k is the k-th edge of the graph's ascending edge list, two vertices are joined when their edges share an end, and a graph with no edge has the empty line graph.
