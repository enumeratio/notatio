---
name: RootedLabeledTree
domain: Combinatorics
signature: RootedLabeledTree(parents)
summary: A rooted tree on the vertices 1 to n in which labels increase away from the root, as the parent of each vertex.
references:
  - system: oeis
    identity: A000142
catalogCarrier: true
signatures:
  - call: RootedLabeledTree(parents)
    description: A recursive tree, as the parent of each vertex.
    library: enumeratio-combinatorics
    type: (list<integer>) -> rooted_labeled_tree
---

- The list holds the parent of each vertex $1, \dots, n$: entry 1 is 0 (the root has no parent), and entry $i$, for $i \ge 2$, is a vertex from 1 to $i - 1$. Every vertex then has a smaller label than each of its children, which makes this a recursive (increasing) tree.
- `RootedLabeledTree([0, 1, 1, 2])` is the tree on four vertices where vertices 2 and 3 hang from the root and vertex 4 from vertex 2.
- There are $(n-1)!$ such trees on $n$ vertices (OEIS A000142), the family [[RecursiveTrees]].
