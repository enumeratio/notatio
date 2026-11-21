---
name: MultiplicativePartition
domain: Combinatorics
signature: MultiplicativePartition(factors)
summary: A product of factors greater than 1 with the order forgotten, as its factors from largest to smallest.
catalogCarrier: true
signatures:
  - call: MultiplicativePartition(factors)
    description: A product of factors greater than 1 with the order forgotten, as its factors from largest to smallest.
    library: enumeratio-combinatorics
    type: (list<integer>) -> multiplicative_partition
---

- The list holds factors $f_1 \ge f_2 \ge \dots \ge f_k$, each at least 2, of a factorization of some $n$; the empty list is the empty product 1. The list does not hold $n$, which `Element(x, MultiplicativePartitions(n))` asks.
- `MultiplicativePartition([3, 2, 2])` is a factorization of 12.
- The family [[MultiplicativePartitions]] lists the factorizations of $n$; [[OrderedFactorizations]] keeps their order.
