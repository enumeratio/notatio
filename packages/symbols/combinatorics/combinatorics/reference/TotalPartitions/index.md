---
name: TotalPartitions
domain: Combinatorics
signature: TotalPartitions(n)
summary: The ways to bracket $n$ items in order, each bracket of two or more, as a lazy indexed family.
signatures:
  - call: TotalPartitions(n)
    description: the total partitions of $n$ items in order, as nested lists, a leaf 0 and a bracket the list of its two or more items.
    library: enumeratio-combinatorics
    type: (integer<0..>) -> indexed_collection<total_partition>
seeAlso:
  - Dissections
  - OrderedTrees
references:
  - system: oeis
    identity: A001003
catalog:
  - system: oeis
    identity: A001003
    url: https://oeis.org/A001003
    note: "shifted: n leaves ⇒ A001003(n-1)"
grades:
  - name: n
    role: axis
carrier: TotalPartition
---

- A total partition of $n$ items in order is a way to put brackets round runs of them, each bracket holding two or more items (an item a leaf or a bracket), the whole being one: $n = 3$ has $(a\,b\,c)$, $(a\,(b\,c))$ and $((a\,b)\,c)$. A leaf is 0 and a bracket the list of its items (see [[TotalPartition]]); one item alone is the leaf `0`.
- They are listed by the size of the first item of a bracket (the smallest first), then that item, then the rest of the bracket, so for $n = 3$ in the order above.
- There are $1, 1, 3, 11, 45, 197, \ldots$ of them for $n = 1, 2, 3, \ldots$, OEIS A001003 (little Schröder numbers: Schröder's second problem, the bracketings in order). They are the [[Dissections]] of an $(n+1)$-gon, in the same order. The unordered ones, Schröder's fourth problem (A000311), are another count.
