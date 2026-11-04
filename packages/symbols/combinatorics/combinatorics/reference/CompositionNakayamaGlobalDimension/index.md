---
name: CompositionNakayamaGlobalDimension
domain: Composition statistics
signature: CompositionNakayamaGlobalDimension(composition)
summary: The global dimension of the linear Nakayama algebra whose Kupisch series is c_1 + 1, ..., 2, c_2 + 1, ..., 2, ..., 1.
catalog:
  - system: findstat
    identity: St001235
    url: https://www.findstat.org/St001235
    on: IntegerComposition
statOn:
  - IntegerComposition
signatures:
  - call: CompositionNakayamaGlobalDimension(composition)
    description: The global dimension of the linear Nakayama algebra whose Kupisch series is c_1 + 1, ..., 2, c_2 + 1, ..., 2, ..., 1.
    library: enumeratio-combinatorics
    type: (composition) -> number
---

- Defined over `IntegerComposition` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `IntegerComposition` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001235 (its Comp-Nakayama algebra): the largest projective dimension of a simple module.
