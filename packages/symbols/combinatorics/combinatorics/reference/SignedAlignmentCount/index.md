---
name: SignedAlignmentCount
domain: Signed permutation statistics
signature: SignedAlignmentCount(signedPermutation)
summary: "The alignments of p: its nesting alignments, those of type EN and those of type NE."
signatures:
  - call: SignedAlignmentCount(p)
    description: "The alignments of p: its nesting alignments, those of type EN and those of type NE."
    library: enumeratio-combinatorics
    type: (signed_permutation) -> number
catalog:
  - system: findstat
    identity: St001822
    url: https://www.findstat.org/St001822
    on: SignedPermutation
statOn:
  - SignedPermutation
---

- Defined over `SignedPermutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `SignedPermutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001822 (St001866, St001867, St001868 summed). Not Alignments, which counts the pairs of arcs of an unsigned permutation.
