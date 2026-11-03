---
name: BargraphUpStepCount
domain: Composition statistics
signature: BargraphUpStepCount(composition)
summary: Up steps of the bargraph.
catalog:
  - system: findstat
    identity: St000808
    url: https://www.findstat.org/St000808
    on: IntegerComposition
statOn:
  - IntegerComposition
signatures:
  - call: BargraphUpStepCount(composition)
    description: Up steps of the bargraph.
    library: enumeratio-combinatorics
    type: (composition) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Deutsch and Elizalde, A bijection between bargraphs and Dyck paths.
