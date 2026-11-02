---
name: PrimeColumnSums
domain: Permutation statistics
signature: PrimeColumnSums(p)
summary: Positions i with i + p(i) prime.
catalog:
  - system: findstat
    identity: St001285
    url: https://www.findstat.org/St001285
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: PrimeColumnSums(p)
    description: Positions i with i + p(i) prime.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
