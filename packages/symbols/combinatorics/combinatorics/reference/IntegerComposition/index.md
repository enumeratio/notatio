---
name: IntegerComposition
domain: Collections
signature: IntegerComposition(list)
summary: The singular-inhabitant constructor for a composition of an integer, as its parts.
references:
  - system: wikipedia
    identity: Composition (combinatorics)
  - system: mathworld
    identity: Composition
catalogCarrier: true
glyph: composition
signatures:
  - call: IntegerComposition(list)
    description: The singular-inhabitant constructor for a composition of an integer, as its parts.
    library: enumeratio-combinatorics
    type: ((list<integer>) -> composition) & ((binary_word) -> composition)
laws:
  - inverse: CutWord
---
