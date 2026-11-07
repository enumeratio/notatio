---
name: CartanMatrix
domain: Cartan type statistics
signature: CartanMatrix(cartanType)
summary: "The Cartan matrix of the type in Bourbaki's numbering: the entry at row i and column j is the pairing of the simple root i with the coroot j."
signatures:
  - call: CartanMatrix(cartanType)
    description: "The Cartan matrix of the type in Bourbaki's numbering: the entry at row i and column j is the pairing of the simple root i with the coroot j."
    library: enumeratio-combinatorics
    type: (cartan_type) -> list<list<integer>>
---

- Defined over `CartanType` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `CartanType` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
