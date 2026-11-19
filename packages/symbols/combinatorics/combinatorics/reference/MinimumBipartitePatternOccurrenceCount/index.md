---
name: MinimumBipartitePatternOccurrenceCount
domain: Graph statistics
signature: MinimumBipartitePatternOccurrenceCount(graph)
summary: The fewest occurrences, over all orderings of the vertices, of the pattern with edges 1-2 and 2-3.
catalog:
  - system: findstat
    identity: St001328
    url: https://www.findstat.org/St001328
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: MinimumBipartitePatternOccurrenceCount(graph)
    description: The fewest occurrences, over all orderings of the vertices, of the pattern with edges 1-2 and 2-3.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001328. With fewer than 3 vertices there is no occurrence, so 0. The graph with no vertices gives 0.
