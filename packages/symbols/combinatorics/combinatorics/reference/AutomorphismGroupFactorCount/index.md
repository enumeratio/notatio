---
name: AutomorphismGroupFactorCount
domain: Graph statistics
signature: AutomorphismGroupFactorCount(graph)
summary: The most blocks in a partition of the vertex orbits into unions whose restrictions multiply to the order of the automorphism group.
catalog:
  - system: findstat
    identity: St001951
    url: https://www.findstat.org/St001951
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: AutomorphismGroupFactorCount(graph)
    description: The most blocks in a partition of the vertex orbits into unions whose restrictions multiply to the order of the automorphism group.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `_x[1] <= 7` holds; elsewhere the call stays unevaluated.
- FindStat's St001951. A partition of the orbits is read as the base-r digits of c, r the orbit count, a digit the block of an orbit; the restriction of the group to a union of orbits has |G| over the automorphisms that fix those vertices. The rows count the most blocks whose restrictions multiply to |G|, so a graph with no nontrivial automorphism gives n. The graph with no vertices gives 0, a convention and not a FindStat row.
