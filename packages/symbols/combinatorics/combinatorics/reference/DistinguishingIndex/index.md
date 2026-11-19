---
name: DistinguishingIndex
domain: Graph statistics
signature: DistinguishingIndex(graph)
summary: The fewest colors of the edges such that no nontrivial automorphism preserves every color.
catalog:
  - system: findstat
    identity: St001060
    url: https://www.findstat.org/St001060
    on: LabeledGraph
statOn:
  - LabeledGraph
signatures:
  - call: DistinguishingIndex(graph)
    description: The fewest colors of the edges such that no nontrivial automorphism preserves every color.
    library: enumeratio-combinatorics
    type: (labeled_graph) -> number
---

- Defined over `LabeledGraph` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `LabeledGraph` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- Defined where `True if _x[1] == 0 else Apply((n: integer) => Apply((edges: list<list<integer>>) => Apply(
                                                                                             (degrees: list<integer>) => Max(Sum(Map(Function((1 if degrees[e[1]] == 1 else 0) *
                                                                                                                                              (1 if degrees[e[2]] == 1 else 0), e), edges)), 0) ==
                                                                                                                         0 &&
                                                                                                                         Max(Sum(Map(Function(1 if d == 0 else 0, d), degrees)), 0) <=
                                                                                                                         1,
                                                                                             Map(
                                                                                                  Function(Max(Sum(Map(Function((1 if e[1] == v else 0) +
                                                                                                                                (1 if e[2] == v else 0), e), edges)), 0), v),
                                                                                                  Range(1, n),
                                                                                                ),
                                                                                           ), _x[2]), _x[1])` holds; elsewhere the call stays unevaluated.
- FindStat's St001060. An edge coloring is read as the digits of c in base k, edge f the digit at position f - 1; an automorphism sends edge f to the edge between the images of its ends. Defined where no component is a single edge and at most one vertex is isolated, so that no nontrivial automorphism fixes every edge; elsewhere the call stays unevaluated. A single vertex gives 1 and the graph with no vertices 0, conventions and not FindStat rows.
