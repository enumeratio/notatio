---
name: OrderedFactorizations
domain: Combinatorics
signature: OrderedFactorizations(n)
summary: The ways to write $n$ as an ordered product of factors greater than 1, as a lazy indexed family.
signatures:
  - call: OrderedFactorizations(n)
    description: the lists of integers at least 2 whose product is $n$, in lexicographic order.
    library: enumeratio-combinatorics
    type: (integer<0..>) -> indexed_collection<ordered_factorization>
seeAlso:
  - MultiplicativePartitions
references:
  - system: oeis
    identity: A074206
  - system: wikipedia
    identity: Multiplicative partition
catalog:
  - system: oeis
    identity: A074206
    url: https://oeis.org/A074206
grades:
  - name: n
    role: axis
carrier: OrderedFactorization
---

- An ordered factorization of $n$ is a list of integers greater than 1 with product $n$, the order kept, listed lexicographically: 12 is $2 \cdot 2 \cdot 3$, $2 \cdot 3 \cdot 2$, $2 \cdot 6$, $3 \cdot 2 \cdot 2$, $3 \cdot 4$, $4 \cdot 3$, $6 \cdot 2$ and $12$. The number 1 has the one empty factorization, and 0 has none.
- The count is OEIS A074206, the Kalmar numbers: $1, 1, 1, 1, 2, 1, 3, 1, 4, 2, 3, 1, 8, \ldots$ from $n = 1$.
