---
name: LinearExtensionCount
domain: Tree and poset statistics
signature: LinearExtensionCount(object)
summary: "The number of linear extensions of a binary tree or an ordered tree, as a poset (n! over the tree factorial), or of a poset: the orderings of its elements that keep every x < y with x first."
catalog:
  - system: findstat
    identity: St000045
    url: https://www.findstat.org/St000045
    on: BinaryTree
  - system: findstat
    identity: St000085
    url: https://www.findstat.org/St000085
    on: OrderedTree
  - system: findstat
    identity: St000100
    url: https://www.findstat.org/St000100
    on: Poset
statOn:
  - BinaryTree
  - OrderedTree
  - Poset
signatures:
  - call: LinearExtensionCount(tree)
    description: "BinaryTree: The number of linear extensions of the tree as a poset: n! over the tree factorial. OrderedTree: The number of linear extensions of the tree as a poset: n! over the tree factorial."
    library: enumeratio-combinatorics
    type: (binary_tree | ordered_tree | poset) -> number
---

- Defined over `BinaryTree` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryTree` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined over `OrderedTree` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `OrderedTree` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000100. A table over the order ideals: the extensions that build an ideal are the sums over its maximal members of those of the ideal without them. The poset with no elements gives 1, the empty ordering, a convention: FindStat has no row for it.
- Defined where `Length(_x) <= 12` holds; elsewhere the call stays unevaluated.
