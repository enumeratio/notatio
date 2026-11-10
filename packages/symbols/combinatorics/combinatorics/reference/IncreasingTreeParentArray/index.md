---
name: IncreasingTreeParentArray
domain: Combinatorial maps
signature: IncreasingTreeParentArray(Permutation)
summary: "The increasing binary tree of σ as its parent array: entry p is the position the entry at p hangs under, 0 for the root."
signatures:
  - call: IncreasingTreeParentArray(Permutation)
    description: "The increasing binary tree of σ as its parent array: entry p is the position the entry at p hangs under, 0 for the root."
    library: enumeratio-combinatorics
    type: (permutation) -> binary_tree_parent_array
---

- Takes a `Permutation` and returns a `BinaryTreeParentArray` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- Positions are the tree's in-order labels: the smallest entry roots the tree, and what lies before it and after it become its subtrees. The parent of p is the larger of the nearest smaller entries on its two sides.
