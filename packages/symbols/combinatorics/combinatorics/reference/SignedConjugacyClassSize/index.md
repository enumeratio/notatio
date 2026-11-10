---
name: SignedConjugacyClassSize
domain: Signed permutation statistics
signature: SignedConjugacyClassSize(signedPermutation)
summary: "The signed permutations of the same signed cycle type: 2^n n! over the product of 2k for each cycle of k points and the factorials of the numbers of cycles of each length and sign."
catalog:
  - system: findstat
    identity: St001852
    url: https://www.findstat.org/St001852
    on: SignedPermutation
statOn:
  - SignedPermutation
signatures:
  - call: SignedConjugacyClassSize(signedPermutation)
    description: "The signed permutations of the same signed cycle type: 2^n n! over the product of 2k for each cycle of k points and the factorials of the numbers of cycles of each length and sign."
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001852. A cycle and its negative are one signed cycle; it is positive when it never reaches its own negative. Not ConjugacyClassSize, which reads an unsigned permutation.
