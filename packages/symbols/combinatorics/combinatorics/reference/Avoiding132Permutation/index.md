---
name: Avoiding132Permutation
domain: Combinatorial maps
signature: Avoiding132Permutation(DyckPath)
summary: The 132-avoiding permutation of Krattenthaler's bijection, built from the path's area sequence read from the end.
laws:
  - graded:
      from: DyckPaths
      to: Permutations
    on: dyck_path
catalog:
  - system: findstat
    identity: Mp00025
    url: https://www.findstat.org/Mp00025
    on: DyckPath
  - system: findstat
    identity: Mp00014
    url: https://www.findstat.org/Mp00014
    on: BinaryTree
mapOn:
  - BinaryTree
  - DyckPath
signatures:
  - call: Avoiding132Permutation(DyckPath)
    description: The 132-avoiding permutation of Krattenthaler's bijection, built from the path's area sequence read from the end.
    library: enumeratio-combinatorics
    type: ((binary_tree) -> permutation) & ((dyck_path) -> permutation)
---

- Takes a `DyckPath` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00025, Sage's to_132_avoiding_permutation. Injective.
- Also takes a `BinaryTree`, returning a `Permutation`: The 132-avoiding permutation of a binary tree: its nodes numbered in order, read in postorder with the right subtree before the left.
- FindStat's Mp00014, Sage's to_132_avoiding_permutation. An injection onto the 132-avoiding permutations.
