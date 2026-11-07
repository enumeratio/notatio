---
name: SimionSchmidtPreimageSize
domain: Permutation statistics
signature: SimionSchmidtPreimageSize(p)
summary: The permutations sent to p by the Simion-Schmidt map onto the 321-avoiding permutations.
catalog:
  - system: findstat
    identity: St000124
    url: https://www.findstat.org/St000124
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: SimionSchmidtPreimageSize(p)
    description: The permutations sent to p by the Simion-Schmidt map onto the 321-avoiding permutations.
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- That map keeps the left-to-right maxima and puts the other entries in increasing order, so p needs those increasing; each other position then chooses among the smaller values left.
