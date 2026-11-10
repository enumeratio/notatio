---
name: CyclicNakayamaDominantDimension
domain: Dyck path statistics
signature: CyclicNakayamaDominantDimension(path)
summary: "The dominant dimension of the cyclic Nakayama algebra got from the path's linear Nakayama algebra by adding the first Kupisch entry to the last: the least codominant dimension of a non-projective injective module."
signatures:
  - call: CyclicNakayamaDominantDimension(path)
    description: "The dominant dimension of the cyclic Nakayama algebra got from the path's linear Nakayama algebra by adding the first Kupisch entry to the last: the least codominant dimension of a non-projective injective module."
    library: enumeratio-combinatorics
    type: (dyck_path) -> number
catalog:
  - system: findstat
    identity: St000968
    url: https://www.findstat.org/St000968
    on: DyckPath
statOn:
  - DyckPath
---

- Defined over `DyckPath` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `DyckPath` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000968. The algebra is self-injective, with infinite dominant dimension, when no injective module is non-projective.
