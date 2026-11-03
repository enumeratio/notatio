---
name: RibbonCornerCount
domain: Composition statistics
signature: RibbonCornerCount(composition)
summary: "Corners of the ribbon: its inner and outer corners together."
catalog:
  - system: findstat
    identity: St001486
    url: https://www.findstat.org/St001486
    on: IntegerComposition
statOn:
  - IntegerComposition
signatures:
  - call: RibbonCornerCount(composition)
    description: "Corners of the ribbon: its inner and outer corners together."
    library: enumeratio-combinatorics
    type: (composition) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
