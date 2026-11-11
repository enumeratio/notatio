---
name: CompleteOrderedTree
domain: Combinatorial maps
signature: CompleteOrderedTree(BinaryTree)
summary: "A binary tree as its complete tree: every missing child becomes a vertex, and a node's two children are its left and right subtrees."
catalog:
  - system: findstat
    identity: Mp00008
    url: https://www.findstat.org/Mp00008
    on: BinaryTree
mapOn:
  - BinaryTree
signatures:
  - call: CompleteOrderedTree(BinaryTree)
    description: "A binary tree as its complete tree: every missing child becomes a vertex, and a node's two children are its left and right subtrees."
    library: enumeratio-combinatorics
    type: (binary_tree) -> ordered_tree
---

- Takes a `BinaryTree` and returns a `OrderedTree` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00008, Sage's as_ordered_tree. An injection from the binary trees with n nodes to the ordered trees with 2n edges, whose image is the full binary trees; OrderedTree(BinaryTree) is the different bijection Mp00010.
