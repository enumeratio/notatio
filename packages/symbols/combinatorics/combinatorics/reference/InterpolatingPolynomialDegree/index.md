---
name: InterpolatingPolynomialDegree
domain: Permutation statistics
signature: InterpolatingPolynomialDegree(p)
summary: "The degree of the polynomial through the points (i, p(i)): the largest k with a nonzero k-th finite difference."
catalog:
  - system: findstat
    identity: St001958
    url: https://www.findstat.org/St001958
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: InterpolatingPolynomialDegree(p)
    description: "The degree of the polynomial through the points (i, p(i)): the largest k with a nonzero k-th finite difference."
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
