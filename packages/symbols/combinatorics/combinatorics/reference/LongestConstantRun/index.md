---
name: LongestConstantRun
domain: Composition statistics
signature: LongestConstantRun(composition)
summary: The length of the longest run of equal parts.
catalog:
  - system: findstat
    identity: St000899
    url: https://www.findstat.org/St000899
    on: IntegerComposition
statOn:
  - IntegerComposition
signatures:
  - call: LongestConstantRun(composition)
    description: The length of the longest run of equal parts.
    library: enumeratio-combinatorics
    type: (composition) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
