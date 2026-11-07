---
name: DistinctNeighborhoodCount
domain: Graph statistics
signature: DistinctNeighborhoodCount(graph)
summary: The different sets of neighbors the vertices have.
signatures:
  - call: DistinctNeighborhoodCount(graph)
    description: The different sets of neighbors the vertices have.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
catalog:
  - system: findstat
    identity: St000722
    url: https://www.findstat.org/St000722
    on: LabeledGraph
statOn:
  - LabeledGraph
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000722: the vertices whose row of the adjacency matrix has no equal row above it. Two adjacent vertices never share a neighborhood. The graph with no vertices gives 0.
