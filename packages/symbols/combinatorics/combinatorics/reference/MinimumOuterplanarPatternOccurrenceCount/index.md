---
name: MinimumOuterplanarPatternOccurrenceCount
domain: Graph statistics
signature: MinimumOuterplanarPatternOccurrenceCount(graph)
summary: The fewest occurrences, over all orderings of the vertices, of the pattern with edges 1-3 and 2-4 on four positions.
catalog:
  - system: findstat
    identity: St001329
    url: https://www.findstat.org/St001329
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: MinimumOuterplanarPatternOccurrenceCount(graph)
    description: The fewest occurrences, over all orderings of the vertices, of the pattern with edges 1-3 and 2-4 on four positions.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001329. With fewer than 4 vertices there is no occurrence, so 0. The graph with no vertices gives 0.
