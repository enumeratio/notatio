---
name: SignedConnectivitySetSize
domain: Signed permutation statistics
signature: SignedConnectivitySetSize(signedPermutation)
summary: 1 when no entry is negative, plus the i < n for which the first i entries are 1 .. i in some order.
catalog:
  - system: findstat
    identity: St001889
    url: https://www.findstat.org/St001889
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: SignedConnectivitySetSize(signedPermutation)
    description: 1 when no entry is negative, plus the i < n for which the first i entries are 1 .. i in some order.
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001889: n less the number of generators in a reduced word, the sign change being the last generator. The generator s_i is absent when the first i entries are 1 .. i in order of no sign, and the sign change when no entry is negative.
