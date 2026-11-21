---
name: Factorization
domain: Combinatorial maps
signature: Factorization(bases, exponents)
summary: A multiplicative factorization as parallel lists — $\prod \text{bases}_i^{\text{exponents}_i}$ — with `bases` left as `number` rather than `integer`, unlike the prime-specific [[IntegerFactorization]].
signatures:
  - call: Factorization(bases, exponents)
    description: a factorization as parallel `bases`/`exponents` lists
    library: enumeratio-number-theory
    type: ((integer) -> factorization) & ((tuple<list<number>, list<integer>>) -> factorization)
  - call: Factorization(n)
    description: the prime factorization of the integer `n`, as `FactorInteger` finds it, in the form above
    library: enumeratio-number-theory
seeAlso:
  - FactorInteger
  - IntegerFactorization
---
