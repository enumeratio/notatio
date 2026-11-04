---
name: RightForkRightLeftPatternCount
domain: Tree statistics
signature: RightForkRightLeftPatternCount(tree)
summary: The number of nodes whose right child has two children, the right one of which has a left child.
catalog:
  - system: findstat
    identity: St000130
    url: https://www.findstat.org/St000130
    on: BinaryTree
statOn:
  - BinaryTree
signatures:
  - call: RightForkRightLeftPatternCount(tree)
    description: The number of nodes whose right child has two children, the right one of which has a left child.
    library: enumeratio-combinatorics
    type: (binary_tree) -> number
---

- Defined over `BinaryTree` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryTree` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000130: the contiguous pattern [.,[[.,.],[[.,.],.]]], whose empty slots match any subtree.
