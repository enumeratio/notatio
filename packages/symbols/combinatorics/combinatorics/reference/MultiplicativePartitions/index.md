---
name: MultiplicativePartitions
domain: Combinatorics
signature: MultiplicativePartitions(n)
summary: The ways to write $n$ as a product of factors greater than 1, the order forgotten, as a lazy indexed family.
signatures:
  - call: MultiplicativePartitions(n)
    description: the nonincreasing lists of integers at least 2 whose product is $n$, in lexicographic order.
    library: enumeratio-combinatorics
    type: (integer<0..>) -> indexed_collection<multiplicative_partition>
seeAlso:
  - OrderedFactorizations
references:
  - system: oeis
    identity: A001055
  - system: wikipedia
    identity: Multiplicative partition
catalog:
  - system: oeis
    identity: A001055
    url: https://oeis.org/A001055
grades:
  - name: n
    role: axis
carrier: MultiplicativePartition
---

- A multiplicative partition of $n$ is a way to write it as a product of integers greater than 1 without regard to order, listed as the factors from largest to smallest and ordered lexicographically: the factorizations of 12 are $(3, 2, 2), (4, 3), (6, 2), (12)$. The number 1 has the one empty factorization, and 0 has none.
- The count is OEIS A001055: $1, 1, 1, 2, 1, 2, 1, 3, 2, 2, 1, 4, \ldots$ from $n = 1$.
