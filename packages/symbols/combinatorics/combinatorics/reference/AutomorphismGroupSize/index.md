---
name: AutomorphismGroupSize
domain: Tree statistics
signature: AutomorphismGroupSize(tree)
summary: "The number of ways to permute identical children, at every vertex at once: the product, over the vertices, of the factorials of how many times each child tree occurs."
signatures:
  - call: AutomorphismGroupSize(tree)
    description: "The number of ways to permute identical children, at every vertex at once: the product, over the vertices, of the factorials of how many times each child tree occurs."
    library: enumeratio-combinatorics
    type: (labeled_graph | ordered_tree) -> number
catalog:
  - system: findstat
    identity: St000417
    url: https://www.findstat.org/St000417
    on: OrderedTree
  - system: findstat
    identity: St000244
    url: https://www.findstat.org/St000244
    on: LabeledGraph
statOn:
  - LabeledGraph
  - OrderedTree
---

- Defined over `OrderedTree` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `OrderedTree` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000244, the order of the automorphism group. The graph with no vertices has one automorphism, the empty permutation, a convention and not a FindStat row: 1.
