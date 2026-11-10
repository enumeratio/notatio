---
name: LusztigAFunction
domain: Permutation statistics
signature: LusztigAFunction(p)
summary: "Lusztig's a-function: the sum of binomial(c, 2) over the column lengths c of the Robinson-Schensted shape."
catalog:
  - system: findstat
    identity: St001874
    url: https://www.findstat.org/St001874
    on: Permutation
statOn:
  - Permutation
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
