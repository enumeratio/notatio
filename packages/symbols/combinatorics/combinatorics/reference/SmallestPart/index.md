---
name: SmallestPart
domain: Composition statistics
signature: SmallestPart(composition)
summary: The smallest part.
catalog:
  - system: findstat
    identity: St000657
    url: https://www.findstat.org/St000657
    on: IntegerComposition
statOn:
  - IntegerComposition
signatures:
  - call: SmallestPart(composition)
    description: The smallest part.
    library: enumeratio-combinatorics
    type: (composition) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
