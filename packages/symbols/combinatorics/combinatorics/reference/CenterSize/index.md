---
name: CenterSize
domain: Parking function statistics
signature: CenterSize(parkingFunction)
summary: The length of the longest subsequence a(1), ..., a(k) with a(i) <= i.
catalog:
  - system: findstat
    identity: St001937
    url: https://www.findstat.org/St001937
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: CenterSize(parkingFunction)
    description: The length of the longest subsequence a(1), ..., a(k) with a(i) <= i.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001937. Taking each entry that fits the next index is the longest such subsequence.
