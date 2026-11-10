---
name: PadmakarIvanIndex
domain: Graph statistics
signature: PadmakarIvanIndex(graph)
summary: The sum over the edges of the edges inside the vertices nearer one end, and inside those nearer the other.
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001374. An edge lies inside a set of vertices when both its ends do; a vertex in another component is nearer neither end. The graph with no vertices gives 0.
