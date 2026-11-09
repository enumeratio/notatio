---
name: Rotation
domain: Combinatorial maps
signature: Rotation(OrderedTree)
summary: Attach a leaf to the root, remove the leftmost leaf, and let the vertex it hung from become the root.
catalog:
  - system: findstat
    identity: Mp00246
    url: https://www.findstat.org/Mp00246
    on: OrderedTree
  - system: findstat
    identity: Mp00144
    url: https://www.findstat.org/Mp00144
    on: PerfectMatching
mapOn:
  - OrderedTree
  - PerfectMatching
laws:
  - bijection
  - graded:
      from: OrderedTrees
      to: OrderedTrees
    on: ordered_tree
signatures:
  - call: Rotation(OrderedTree)
    description: Attach a leaf to the root, remove the leftmost leaf, and let the vertex it hung from become the root.
    library: enumeratio-combinatorics
    type: ((ordered_tree) -> ordered_tree) & ((perfect_matching) -> perfect_matching)
---

- Takes a `OrderedTree` and returns a `OrderedTree` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00246, a bijection corresponding to rotating a polygon dissection.
- Also takes a `PerfectMatching`, returning a `PerfectMatching`: The matching with every point i replaced by i + 1, and 2m by 1.
- FindStat's Mp00144; the inverse is InverseRotation. Its order divides 2m.
