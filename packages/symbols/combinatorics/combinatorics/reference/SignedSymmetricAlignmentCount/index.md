---
name: SignedSymmetricAlignmentCount
domain: Signed permutation statistics
signature: SignedSymmetricAlignmentCount(signedPermutation)
summary: Pairs -n <= i < j <= n, neither 0, with one of four alignment shapes of (i, p(i)) and (j, p(j)), where p(-k) = -p(k).
catalog:
  - system: findstat
    identity: St001865
    url: https://www.findstat.org/St001865
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: SignedSymmetricAlignmentCount(signedPermutation)
    description: Pairs -n <= i < j <= n, neither 0, with one of four alignment shapes of (i, p(i)) and (j, p(j)), where p(-k) = -p(k).
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001865. A pair meeting more than one shape counts once. Not SignedAlignmentCount, which is St001822.
