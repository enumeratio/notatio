---
name: SwapEquivalentTreeCountLog
domain: Tree statistics
signature: SwapEquivalentTreeCountLog(tree)
summary: "The binary logarithm of the number of binary trees with the same underlying rooted tree: the nodes whose two subtrees differ up to swaps."
signatures:
  - call: SwapEquivalentTreeCountLog(tree)
    description: "The binary logarithm of the number of binary trees with the same underlying rooted tree: the nodes whose two subtrees differ up to swaps."
    library: enumeratio-combinatorics
    type: (binary_tree) -> number
catalog:
  - system: findstat
    identity: St000414
    url: https://www.findstat.org/St000414
    on: BinaryTree
statOn:
  - BinaryTree
---

- Defined over `BinaryTree` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryTree` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000414.
