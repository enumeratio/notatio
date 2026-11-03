---
name: CompositionMajorIndex
domain: Composition statistics
signature: CompositionMajorIndex(composition)
summary: "The sum of the descents of the composition: its partial sums, the total left out."
catalog:
  - system: findstat
    identity: St000008
    url: https://www.findstat.org/St000008
    on: IntegerComposition
statOn:
  - IntegerComposition
signatures:
  - call: CompositionMajorIndex(composition)
    description: "The sum of the descents of the composition: its partial sums, the total left out."
    library: enumeratio-combinatorics
    type: (composition) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Reads the composition as a descent set, as FindStat's St000008 does. `MajorIndex` reads it as a word.
