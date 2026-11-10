---
name: ParkingPermutationPreimageSize
domain: Permutation statistics
signature: ParkingPermutationPreimageSize(p)
summary: The parking functions whose cars park in the order p.
catalog:
  - system: findstat
    identity: St001346
    url: https://www.findstat.org/St001346
    on: Permutation
statOn:
  - Permutation
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Each car chooses among the occupied spots just before its own, and its own.
