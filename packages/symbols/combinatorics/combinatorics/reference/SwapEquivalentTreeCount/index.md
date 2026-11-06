---
name: SwapEquivalentTreeCount
domain: Tree statistics
signature: SwapEquivalentTreeCount(tree)
summary: "The number of binary trees that become this one when the children at any nodes are swapped: each node with different subtrees (an only child counts as different from the empty one) doubles the count."
signatures:
  - call: SwapEquivalentTreeCount(tree)
    description: "The number of binary trees that become this one when the children at any nodes are swapped: each node with different subtrees (an only child counts as different from the empty one) doubles the count."
    library: enumeratio-combinatorics
    type: (binary_tree) -> number
catalog:
  - system: findstat
    identity: St000412
    url: https://www.findstat.org/St000412
    on: BinaryTree
statOn:
  - BinaryTree
---

- Defined over `BinaryTree` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `BinaryTree` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000412: the binary trees with the same underlying unordered (rooted) tree.
