---
name: AutomorphismBaseSize
domain: Graph statistics
signature: AutomorphismBaseSize(graph)
summary: The fewest vertices that only the identity automorphism fixes pointwise.
catalog:
  - system: findstat
    identity: St001949
    url: https://www.findstat.org/St001949
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: AutomorphismBaseSize(graph)
    description: The fewest vertices that only the identity automorphism fixes pointwise.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `_x[1] <= 7` holds; elsewhere the call stays unevaluated.
- FindStat's St001949: a set of vertices is a base when every nontrivial automorphism moves one of them; each automorphism's moved vertices are a bitmask. A graph with no nontrivial automorphism has the empty base, 0. The graph with no vertices gives 0, a convention and not a FindStat row.
