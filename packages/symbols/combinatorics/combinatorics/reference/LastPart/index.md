---
name: LastPart
domain: Composition statistics
signature: LastPart(composition)
summary: The last part.
catalog:
  - system: findstat
    identity: St000383
    url: https://www.findstat.org/St000383
    on: IntegerComposition
statOn:
  - IntegerComposition
signatures:
  - call: LastPart(composition)
    description: The last part.
    library: enumeratio-combinatorics
    type: (composition) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
