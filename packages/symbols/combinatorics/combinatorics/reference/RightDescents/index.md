---
name: RightDescents
domain: Signed permutation statistics
signature: RightDescents(signedPermutation)
summary: Indices 0 <= k < n with s(k) > s(k+1), where s is the inverse of p and s(0) = 0.
catalog:
  - system: findstat
    identity: St001896
    url: https://www.findstat.org/St001896
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: RightDescents(p)
    description: Indices 0 <= k < n with s(k) > s(k+1), where s is the inverse of p and s(0) = 0.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001896: the left descents of the inverse. The inverse sends k to the position of k or -k, signed as the entry is.
