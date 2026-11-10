---
name: TopToRandomEigenvalue
domain: Tableau statistics
signature: TopToRandomEigenvalue(tableau)
summary: "The eigenvalue of the top-to-random operator on the simple module that the tableau indexes: the least k for which the first ascent above k, less k, is even, or the number of entries if there is none."
catalog:
  - system: findstat
    identity: St001816
    url: https://www.findstat.org/St001816
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: TopToRandomEigenvalue(tableau)
    description: "The eigenvalue of the top-to-random operator on the simple module that the tableau indexes: the least k for which the first ascent above k, less k, is even, or the number of entries if there is none."
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001816, whose Sage code is empty. The eigenvalue is the number of times the entry 1 is deleted and the tableau rectified until its first ascent is even, a desarrangement tableau; read from the descents, that is the least k for which the first ascent above k, less k, is even, and it gives all 352 rows (tableaux of up to 5 entries). An entry is an ascent when its successor is not in a lower row, and the largest entry is one. When no smaller k works the value is the number of entries, so n - 1 never occurs. The empty tableau gives 0.
