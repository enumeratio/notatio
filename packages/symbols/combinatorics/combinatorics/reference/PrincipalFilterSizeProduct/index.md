---
name: PrincipalFilterSizeProduct
domain: Poset statistics
signature: PrincipalFilterSizeProduct(poset)
summary: The product, over the elements, of the number of elements at or above each.
catalog:
  - system: findstat
    identity: St001813
    url: https://www.findstat.org/St001813
    on: Poset
statOn:
  - Poset
signatures:
  - call: PrincipalFilterSizeProduct(poset)
    description: The product, over the elements, of the number of elements at or above each.
    library: enumeratio-combinatorics
    type: (poset) -> number
---

- Defined over `Poset` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Poset` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001813. The poset with no elements gives 1, the empty product.
