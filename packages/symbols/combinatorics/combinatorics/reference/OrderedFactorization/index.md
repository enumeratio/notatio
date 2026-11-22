---
name: OrderedFactorization
domain: Combinatorics
signature: OrderedFactorization(factors)
summary: A product of factors greater than 1 with the order kept, as its factors in order.
catalogCarrier: true
signatures:
  - call: OrderedFactorization(factors)
    description: A product of factors greater than 1 with the order kept, as its factors in order.
    library: enumeratio-combinatorics
    type: (list<integer>) -> ordered_factorization
---

- The list holds factors $f_1, \dots, f_k$, each at least 2, of a factorization $f_1 \cdots f_k$ of some $n$, in the order written; the empty list is the empty product 1. The list does not hold $n$, which `Element(x, OrderedFactorizations(n))` asks.
- `OrderedFactorization([2, 6])` and `OrderedFactorization([6, 2])` are different factorizations of 12.
- The family [[OrderedFactorizations]] lists the factorizations of $n$; [[MultiplicativePartitions]] forgets their order.
