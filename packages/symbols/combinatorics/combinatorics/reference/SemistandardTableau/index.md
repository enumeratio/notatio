---
name: SemistandardTableau
domain: Collections
signature: SemistandardTableau(list)
summary: The singular-inhabitant constructor for a semistandard Young tableau, as its rows.
references:
  - system: wikipedia
    identity: Young tableau
  - system: mathworld
    identity: YoungTableau
stub: carrier
catalogCarrier: true
glyph: tableau
signatures:
  - call: SemistandardTableau(list)
    description: The singular-inhabitant constructor for a semistandard Young tableau, as its rows.
    library: enumeratio-combinatorics
    type: ((list<list<integer>>) -> semistandard_tableau) & ((alternating_sign_matrix) -> semistandard_tableau) & ((gelfand_tsetlin_pattern) -> semistandard_tableau)
catalog:
  - system: findstat
    identity: Mp00001
    url: https://www.findstat.org/Mp00001
    on: AlternatingSignMatrix
  - system: findstat
    identity: Mp00036
    url: https://www.findstat.org/Mp00036
    on: GelfandTsetlinPattern
---
