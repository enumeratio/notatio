---
name: Avoiding312Permutation
domain: Combinatorial maps
signature: Avoiding312Permutation(DyckPath)
summary: "The 312-avoiding permutation of Bandlow and Killpatrick: from the identity, each area-sequence entry swaps neighbouring positions that many times."
laws:
  - graded:
      from: DyckPaths
      to: Permutations
    on: dyck_path
catalog:
  - system: findstat
    identity: Mp00031
    url: https://www.findstat.org/Mp00031
    on: DyckPath
  - system: findstat
    identity: Mp00017
    url: https://www.findstat.org/Mp00017
    on: BinaryTree
mapOn:
  - BinaryTree
  - DyckPath
signatures:
  - call: Avoiding312Permutation(DyckPath)
    description: "The 312-avoiding permutation of Bandlow and Killpatrick: from the identity, each area-sequence entry swaps neighbouring positions that many times."
    library: enumeratio-combinatorics
    type: ((binary_tree) -> permutation) & ((dyck_path) -> permutation)
---

- Takes a `DyckPath` and returns a `Permutation` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00031. It sends the area to the number of inversions. Injective.
- Also takes a `BinaryTree`, returning a `Permutation`: The 312-avoiding permutation of a binary tree: its nodes numbered in order, read in postorder.
- FindStat's Mp00017, Sage's to_312_avoiding_permutation. An injection onto the 312-avoiding permutations.
