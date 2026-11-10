---
name: NakayamaCoxeterMatrixEntrySum
domain: Dyck path statistics
signature: NakayamaCoxeterMatrixEntrySum(path)
summary: The absolute value of the sum of the entries of the Coxeter matrix of the path's linear Nakayama algebra.
signatures:
  - call: NakayamaCoxeterMatrixEntrySum(path)
    description: The absolute value of the sum of the entries of the Coxeter matrix of the path's linear Nakayama algebra.
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St001473
    url: https://www.findstat.org/St001473
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001473, the Coxeter matrix being -C^-1 C^T for the Cartan matrix C, which is lower unitriangular, so the matrix is integral.
