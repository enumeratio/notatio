---
name: SetComposition
domain: Collections
signature: SetComposition(list)
summary: The singular-inhabitant constructor for a composition of a set, as its ordered blocks.
references:
  - system: wikipedia
    identity: Weak ordering
catalogCarrier: true
glyph: set-composition
signatures:
  - call: SetComposition(list)
    description: The singular-inhabitant constructor for a composition of a set, as its ordered blocks.
    library: enumeratio-combinatorics
    type: ((list<list<integer>>) -> set_composition) & ((surjection) -> set_composition) & ((parking_function) -> set_composition)
laws:
  - inverse: Surjection
    on: surjection
catalog:
  - system: findstat
    identity: Mp00290
    url: https://www.findstat.org/Mp00290
    on: ParkingFunction
---
