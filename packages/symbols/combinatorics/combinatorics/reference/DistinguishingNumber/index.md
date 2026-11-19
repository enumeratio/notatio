---
name: DistinguishingNumber
domain: Graph statistics
signature: DistinguishingNumber(graph)
summary: The fewest colors of the vertices such that no nontrivial automorphism preserves every color.
catalog:
  - system: findstat
    identity: St000469
    url: https://www.findstat.org/St000469
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: DistinguishingNumber(graph)
    description: The fewest colors of the vertices such that no nontrivial automorphism preserves every color.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000469. A coloring is read as the digits of c in base k, vertex v the digit at position v - 1; k = n always works, so the search ends. A graph with no nontrivial automorphism needs 1 color. The graph with no vertices gives 0, a convention and not a FindStat row.
