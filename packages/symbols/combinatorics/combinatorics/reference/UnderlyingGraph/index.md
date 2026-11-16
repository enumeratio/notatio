---
name: UnderlyingGraph
domain: Combinatorial maps
signature: UnderlyingGraph(BinaryTree)
summary: The graph on the internal nodes of a binary tree, each joined to its parent; leaves are ignored.
catalog:
  - system: findstat
    identity: Mp00011
    url: https://www.findstat.org/Mp00011
    on: BinaryTree
  - system: findstat
    identity: Mp00046
    url: https://www.findstat.org/Mp00046
    on: OrderedTree
mapOn:
  - BinaryTree
  - OrderedTree
signatures:
  - call: UnderlyingGraph(BinaryTree)
    description: The graph on the internal nodes of a binary tree, each joined to its parent; leaves are ignored.
    library: enumeratio-combinatorics
    type: ((binary_tree) -> labeled_graph) & ((ordered_tree) -> labeled_graph)
---

- Takes a `BinaryTree` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00011. The nodes are numbered in order, as in BinaryTreeParentArray.
- Also takes a `OrderedTree`, returning a `LabeledGraph`: The graph on the nodes of an ordered tree, each joined to its parent.
- FindStat's Mp00046. The nodes are numbered in preorder, the root 1.
