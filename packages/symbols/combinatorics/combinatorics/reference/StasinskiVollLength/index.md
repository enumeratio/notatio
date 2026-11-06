---
name: StasinskiVollLength
domain: Permutation statistics
signature: StasinskiVollLength(p)
summary: Half the pairs -n <= i < j <= n of opposite parity with p(i) > p(j), where p(-k) = -p(k) and p(0) = 0.
signatures:
  - call: StasinskiVollLength(p)
    description: Half the pairs -n <= i < j <= n of opposite parity with p(i) > p(j), where p(-k) = -p(k) and p(0) = 0.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
catalog:
  - system: findstat
    identity: St001823
    url: https://www.findstat.org/St001823
    on: SignedPermutation
statOn:
  - SignedPermutation
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001823. The map (i, j) -> (-j, -i) pairs the counted pairs off, so counting those with i + j > 0, i = j - 1, j - 3, ..., 1 - j, gives the half.
