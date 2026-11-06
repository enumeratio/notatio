---
name: Charge
domain: Tableau statistics
signature: Charge(tableau)
summary: "The charge of the reading word: the sum of n - e over the entries e whose successor is not in a lower row."
catalog:
  - system: findstat
    identity: St000009
    url: https://www.findstat.org/St000009
    on: StandardTableau
statOn:
  - StandardTableau
signatures:
  - call: Charge(tableau)
    description: "The charge of the reading word: the sum of n - e over the entries e whose successor is not in a lower row."
    library: enumeratio-combinatorics
    type: (standard_tableau) -> number
---

- Defined over `StandardTableau` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `StandardTableau` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- The reading word lists the rows from the bottom up, so e + 1 is to the right of e exactly when its row is not lower. The charge of a standard word adds, for each e with e + 1 to its right, the n - e entries from e + 1 on.
