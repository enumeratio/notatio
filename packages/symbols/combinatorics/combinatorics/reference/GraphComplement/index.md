---
name: GraphComplement
domain: Combinatorial maps
signature: GraphComplement(LabeledGraph)
summary: The graph on the same vertices whose edges are the pairs the graph does not join.
catalog:
  - system: findstat
    identity: Mp00111
    url: https://www.findstat.org/Mp00111
    on: LabeledGraph
  - system: wolfram
    identity: GraphComplement
    url: https://reference.wolfram.com/language/ref/GraphComplement.html
names:
  wolframIdentity: true
mapOn:
  - LabeledGraph
signatures:
  - call: GraphComplement(LabeledGraph)
    description: The graph on the same vertices whose edges are the pairs the graph does not join.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> labeled_graph
---

- Takes a `LabeledGraph` and returns a `LabeledGraph` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00111. The vertices keep their numbers.
