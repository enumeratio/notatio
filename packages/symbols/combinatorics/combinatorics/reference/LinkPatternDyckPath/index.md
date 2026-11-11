---
name: LinkPatternDyckPath
domain: Combinatorial maps
signature: LinkPatternDyckPath(AlternatingSignMatrix)
summary: "The Dyck path of the link pattern: the pattern's points taken two at a time as n vertices, a vertex opening one up step and, when it is the largest of its block of joined vertices, closing once per vertex of the block."
catalog:
  - system: findstat
    identity: Mp00333
    url: https://www.findstat.org/Mp00333
    on: AlternatingSignMatrix
mapOn:
  - AlternatingSignMatrix
signatures:
  - call: LinkPatternDyckPath(AlternatingSignMatrix)
    description: "The Dyck path of the link pattern: the pattern's points taken two at a time as n vertices, a vertex opening one up step and, when it is the largest of its block of joined vertices, closing once per vertex of the block."
    library: enumeratio-combinatorics
    type: (alternating_sign_matrix) -> dyck_path
---

- Takes a `AlternatingSignMatrix` and returns a `DyckPath` — a typed map, so a wrong carrier is a type error rather than a wrong answer.
- FindStat's Mp00333, Sage's to_dyck_word('link_pattern'). Surjective.
