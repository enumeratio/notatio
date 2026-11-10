---
name: NakayamaFrobeniusDimension
domain: Dyck path statistics
signature: NakayamaFrobeniusDimension(path)
summary: The dimension of the space of homomorphisms from the injective cogenerator D(A) to the regular module of the path's linear Nakayama algebra.
signatures:
  - call: NakayamaFrobeniusDimension(path)
    description: The dimension of the space of homomorphisms from the injective cogenerator D(A) to the regular module of the path's linear Nakayama algebra.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001643
    url: https://www.findstat.org/St001643
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001643, which counts over a field with three elements; the dimension does not depend on the field.
