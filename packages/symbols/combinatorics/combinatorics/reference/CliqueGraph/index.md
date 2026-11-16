---
name: CliqueGraph
domain: Combinatorial maps
signature: CliqueGraph(LabeledGraph)
summary: The graph on the maximal cliques, two joined when they share a vertex.
catalog:
  - system: findstat
    identity: Mp00250
    url: https://www.findstat.org/Mp00250
    on: LabeledGraph
mapOn:
  - LabeledGraph
signatures:
  - call: CliqueGraph(LabeledGraph)
    description: The graph on the maximal cliques, two joined when they share a vertex.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00250. The cliques are numbered by increasing bitmask, vertex v being bit v - 1; an isolated vertex is a clique of its own.
