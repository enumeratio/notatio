---
name: StandardizedBiAlternatingInversionNumber
domain: Permutation statistics
signature: StandardizedBiAlternatingInversionNumber(p)
summary: Half of floor(n/2)^2 plus the signed inversions, each pair i < j weighted by (-1)^(i+j).
catalog:
  - system: findstat
    identity: St000677
    url: https://www.findstat.org/St000677
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: StandardizedBiAlternatingInversionNumber(p)
    description: Half of floor(n/2)^2 plus the signed inversions, each pair i < j weighted by (-1)^(i+j).
    library: enumeratio-combinatorics
    type: (list<integer> | permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation`, and also a bare list of integers: this reading compares entries with each other rather than with their positions, so it stands on any sequence.
- Half of the sum of (-1)^(i+j) sgn(p(j) - p(i)) over i < j, shifted by floor(n/2)^2.
