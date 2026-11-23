---
name: TotalPartition
domain: Combinatorics
signature: TotalPartition(bracketing)
summary: A way to bracket $n$ items in order, as nested lists.
catalogCarrier: true
signatures:
  - call: TotalPartition(bracketing)
    description: A bracketing of $n$ items in order, each bracket of two or more items, a leaf 0 and a bracket the list of its items.
    library: enumeratio-combinatorics
    type: (integer | list<any>) -> total_partition
---

- A leaf is 0 and a bracket the list of its items, two or more of them, each a leaf or a bracket; the whole is a list, except that one item alone is the leaf `0`. The leaves are the items in order, so they are not labeled.
- `TotalPartition([[0, 0], 0])` brackets three items as $((a\,b)\,c)$.
- The family [[TotalPartitions]] lists those of $n$ items.
