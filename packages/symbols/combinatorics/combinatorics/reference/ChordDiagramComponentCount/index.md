---
name: ChordDiagramComponentCount
domain: Permutation statistics
signature: ChordDiagramComponentCount(p)
summary: "The connected components of the chord diagram of p: the labels in a circle with a chord from each i to p(i)."
catalog:
  - system: findstat
    identity: St001461
    url: https://www.findstat.org/St001461
    on: Permutation
statOn:
  - Permutation
signatures:
  - call: ChordDiagramComponentCount(p)
    description: "The connected components of the chord diagram of p: the labels in a circle with a chord from each i to p(i)."
    library: enumeratio-combinatorics
    type: (permutation) -> number
---

- Defined over `Permutation` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `Permutation` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Chords that cross are in one component, as are those joined at a label.
