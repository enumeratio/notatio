---
name: AutomorphismGroupExponent
domain: Graph statistics
signature: AutomorphismGroupExponent(graph)
summary: The least common multiple of the orders of the automorphisms.
catalog:
  - system: findstat
    identity: St000364
    url: https://www.findstat.org/St000364
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: AutomorphismGroupExponent(graph)
    description: The least common multiple of the orders of the automorphisms.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000364. The rows count the least common multiple of the orders of the automorphisms, each the least common multiple of its cycle lengths; the title's "least common multiple of orbit sizes" is not what the rows hold (143 rows differ). The graph with no vertices gives 1, a convention and not a FindStat row.
