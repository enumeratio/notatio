---
name: DistinctAdjacencyMatrixCount
domain: Graph statistics
signature: DistinctAdjacencyMatrixCount(graph)
summary: The distinct adjacency matrices a relabeling of the vertices gives.
catalog:
  - system: findstat
    identity: St000349
    url: https://www.findstat.org/St000349
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: DistinctAdjacencyMatrixCount(graph)
    description: The distinct adjacency matrices a relabeling of the vertices gives.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000349: n! divided by the order of the automorphism group. The graph with no vertices has one, a convention and not a FindStat row: 1.
