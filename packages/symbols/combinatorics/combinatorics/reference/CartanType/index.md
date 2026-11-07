---
name: CartanType
domain: Combinatorics
signature: CartanType(...)
summary: An irreducible finite Cartan type, written with its letter and rank, as in `CartanType(Tuple("A", 3))`.
catalogCarrier: true
stub: carrier
signatures:
  - call: CartanType(...)
    description: An irreducible finite Cartan type, written with its letter and rank, as in `CartanType(Tuple("A", 3))`.
    library: enumeratio-combinatorics
    type: (tuple<string, integer>) -> cartan_type
---
