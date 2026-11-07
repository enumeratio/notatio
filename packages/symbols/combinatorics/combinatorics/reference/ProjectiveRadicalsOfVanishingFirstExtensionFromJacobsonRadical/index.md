---
name: ProjectiveRadicalsOfVanishingFirstExtensionFromJacobsonRadical
domain: Dyck path statistics
signature: ProjectiveRadicalsOfVanishingFirstExtensionFromJacobsonRadical(path)
summary: The indecomposable projective modules whose radical, zero included, has no first extension by the Jacobson radical.
catalog:
  - system: findstat
    identity: St001226
    url: https://www.findstat.org/St001226
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: ProjectiveRadicalsOfVanishingFirstExtensionFromJacobsonRadical(path)
    description: The indecomposable projective modules whose radical, zero included, has no first extension by the Jacobson radical.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001226: the number of i with Ext^1(J, e_i J) zero. The last projective is simple, so its radical is zero and counts.
