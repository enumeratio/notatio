---
name: EulerFaceCount
domain: Graph statistics
signature: EulerFaceCount(graph)
summary: "The edges less the vertices plus 2: the faces of a connected planar graph."
catalog:
  - system: findstat
    identity: St000450
    url: https://www.findstat.org/St000450
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: EulerFaceCount(graph)
    description: "The edges less the vertices plus 2: the faces of a connected planar graph."
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000450. The graph with no vertices gives 2, the formula as written.
