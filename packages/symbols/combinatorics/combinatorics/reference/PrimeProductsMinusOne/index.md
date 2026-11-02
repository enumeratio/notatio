---
name: PrimeProductsMinusOne
domain: Permutation statistics
signature: PrimeProductsMinusOne(p)
summary: Positions i with i * p(i) - 1 prime.
catalog:
  - system: findstat
    identity: St001287
    url: https://www.findstat.org/St001287
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: PrimeProductsMinusOne(p)
    description: Positions i with i * p(i) - 1 prime.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
