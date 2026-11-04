---
name: SimpleSummandsOfSecondRadicalLayer
domain: Dyck path statistics
signature: SimpleSummandsOfSecondRadicalLayer(path)
summary: The simple summands of J^2/J^3 for the Jacobson radical J of the path's linear Nakayama algebra, one for each indecomposable projective of dimension at least three.
catalog:
  - system: findstat
    identity: St001480
    url: https://www.findstat.org/St001480
    on: DyckPath
statOn:
  - DyckPath
signatures:
  - call: SimpleSummandsOfSecondRadicalLayer(path)
    description: The simple summands of J^2/J^3 for the Jacobson radical J of the path's linear Nakayama algebra, one for each indecomposable projective of dimension at least three.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
