---
name: FullSupportReflectionCount
domain: Cartan type statistics
signature: FullSupportReflectionCount(cartanType)
summary: "The reflections whose reduced words use every simple reflection: n h / |W| times the product of the codegrees d - 2 (leaving out the degree 2)."
catalog:
  - system: findstat
    identity: St000855
    url: https://www.findstat.org/St000855
    on: CartanType
statOn:
  - CartanType
signatures:
  - call: FullSupportReflectionCount(cartanType)
    description: "The reflections whose reduced words use every simple reflection: n h / |W| times the product of the codegrees d - 2 (leaving out the degree 2)."
    library: enumeratio-combinatorics
    type: (cartan_type) -> number
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
