---
name: MinimumStarPatternOccurrenceCount
domain: Graph statistics
signature: MinimumStarPatternOccurrenceCount(graph)
summary: The fewest occurrences, over all orderings of the vertices, of the pattern with the edge 1-2 on three positions.
catalog:
  - system: findstat
    identity: St001319
    url: https://www.findstat.org/St001319
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: MinimumStarPatternOccurrenceCount(graph)
    description: The fewest occurrences, over all orderings of the vertices, of the pattern with the edge 1-2 on three positions.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `_x[1] <= 8` holds; elsewhere the call stays unevaluated.
- FindStat's St001319: positions i < j < k whose first two vertices are joined, the others free. With fewer than 3 vertices there is no occurrence, so 0. The graph with no vertices gives 0.
