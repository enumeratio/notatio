---
name: AsymmetryDegree
domain: Composition statistics
signature: AsymmetryDegree(composition)
summary: Pairs of mirror positions holding different parts.
catalog:
  - system: findstat
    identity: St001673
    url: https://www.findstat.org/St001673
    on: IntegerComposition
statOn:
  - IntegerComposition
signatures:
  - call: AsymmetryDegree(composition)
    description: Pairs of mirror positions holding different parts.
    library: enumeratio-combinatorics
    type: (composition) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
