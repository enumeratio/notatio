---
name: PlaneTree
domain: Combinatorics
signature: PlaneTree(counts)
summary: A plane (ordered rooted) tree, as the child count of each node in preorder.
references:
  - system: oeis
    identity: A000108
  - system: sage
    identity: sage.combinat.ordered_tree.OrderedTrees
catalogCarrier: true
signatures:
  - call: PlaneTree(counts)
    description: A plane tree, as the number of children of each node in preorder.
    library: enumeratio-combinatorics
    type: (list<integer>) -> plane_tree
---

- A plane tree is a rooted tree whose children are ordered. It is written as the list of the number of children of each node, taken in preorder (the root, then each child's subtree from left to right).
- A list of non-negative integers names a tree exactly when, starting with one node owed (the root) and reading left to right, each entry fills one owed node and adds its own child count, the number owed reaches zero at the last entry and not before. `PlaneTree([2, 1, 0, 0])` is a root with two children, the first of which has one child.
- The plane trees with $n$ nodes are counted by the Catalan number $C_{n-1}$ (OEIS A000108).
