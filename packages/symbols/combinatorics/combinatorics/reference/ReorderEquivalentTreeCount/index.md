---
name: ReorderEquivalentTreeCount
domain: Tree statistics
signature: ReorderEquivalentTreeCount(tree)
summary: "The number of ordered trees with the same underlying rooted tree: the product, over the vertices, of the factorials of their numbers of children, over the automorphism group size."
catalog:
  - system: findstat
    identity: St000413
    url: https://www.findstat.org/St000413
    on: OrderedTree
statOn:
  - OrderedTree
signatures:
  - call: ReorderEquivalentTreeCount(tree)
    description: "The number of ordered trees with the same underlying rooted tree: the product, over the vertices, of the factorials of their numbers of children, over the automorphism group size."
    library: enumeratio-combinatorics
    type: (ordered_tree) -> number
---

- Defined over `OrderedTree` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `OrderedTree` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000413. Reordering the children at every vertex reaches the tree's ordered forms, each as many times as there are automorphisms.
