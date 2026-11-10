---
name: WeylGroupParabolicSubgroupCount
domain: Cartan type statistics
signature: WeylGroupParabolicSubgroupCount(cartanType)
summary: "The parabolic subgroups of the Weyl group, the fixers of subspaces: the Bell number B(n + 1) for A_n, and for B_n and C_n the sum of C(n, k) times the signed set partitions of k, D_n leaving out those with exactly one zero coordinate."
catalog:
  - system: findstat
    identity: St001791
    url: https://www.findstat.org/St001791
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: WeylGroupParabolicSubgroupCount(cartanType)
    description: "The parabolic subgroups of the Weyl group, the fixers of subspaces: the Bell number B(n + 1) for A_n, and for B_n and C_n the sum of C(n, k) times the signed set partitions of k, D_n leaving out those with exactly one zero coordinate."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- A parabolic subgroup is the pointwise stabilizer of a subspace (Steinberg), so these are the flats of the reflection arrangement; Marin calls the counts the parabolic Bell numbers. The exceptional types are tabulated.
