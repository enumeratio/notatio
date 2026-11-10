---
name: IncreasingTree
domain: Combinatorial maps
signature: IncreasingTree(Permutation)
summary: "The shape of the increasing binary tree of a permutation: the smallest entry is the root, the entries before it make its left subtree and the entries after it its right."
seeAlso:
  - BinaryTree
  - BinaryTreeParentArray
catalog:
  - system: findstat
    identity: Mp00061
    url: https://www.findstat.org/Mp00061
    on: Permutation
mapOn:
  - Permutation
signatures:
  - call: IncreasingTree(Permutation)
    description: "The shape of the increasing binary tree of a permutation: the smallest entry is the root, the entries before it make its left subtree and the entries after it its right."
    library: enumeratio-combinatorics
    type: (permutation) -> binary_tree
---

- Takes a `Permutation` and returns a `BinaryTree` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- Defined as a COMPOSITION, applied right to left: [[BinaryTree]] after [[BinaryTreeParentArray]]. Each step goes through its own declared head, so every intermediate value is a properly constructed carrier.
- FindStat's Mp00061, Sage's increasing_tree_shape. A surjection: a tree is the shape of as many permutations as it has linear extensions.
