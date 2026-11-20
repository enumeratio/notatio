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
- Defined where `_x[1] <= 7` holds; elsewhere the call stays unevaluated.
- FindStat's St000469. A coloring is read as a restricted growth string (the digits of c in base n, vertex v the digit at position v - 1, each digit at most one more than the largest before it): renaming colors never changes which automorphisms preserve it, so these Bell(n) colorings stand for all of them, and the fewest colors is the fewest blocks of one that no nontrivial automorphism preserves; all n blocks always works. A graph with no nontrivial automorphism needs 1 color. The graph with no vertices gives 0, a convention and not a FindStat row.
