---
name: ConnectedInducedSubgraphCount
domain: Graph statistics
signature: ConnectedInducedSubgraphCount(graph)
summary: The nonempty sets of vertices that induce a connected subgraph.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001441. A set is connected when removing one of its vertices that is adjacent to the rest leaves a connected set; every connected graph has such a vertex. The graph with no vertices gives 0.
