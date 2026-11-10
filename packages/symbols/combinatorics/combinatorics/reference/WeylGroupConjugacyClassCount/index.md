---
name: WeylGroupConjugacyClassCount
domain: Cartan type statistics
signature: WeylGroupConjugacyClassCount(cartanType)
summary: "The conjugacy classes of the Weyl group: p(n + 1) for A_n, the bipartitions of n for B_n and C_n, and for D_n those with an even number of parts in the second partition, together with the classes that split."
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The classes of B_n are the pairs of partitions of sizes adding to n (the positive and the negative cycles); those of D_n have an even number of negative cycles, and a class with only even positive cycles and no negative ones splits in two. The exceptional types are tabulated (Carter, Conjugacy classes in the Weyl group).
