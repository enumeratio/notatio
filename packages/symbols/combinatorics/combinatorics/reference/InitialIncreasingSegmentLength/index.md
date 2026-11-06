---
name: InitialIncreasingSegmentLength
domain: Parking function statistics
signature: InitialIncreasingSegmentLength(parkingFunction)
summary: The length of the initial strictly increasing segment.
catalog:
  - system: findstat
    identity: St001904
    url: https://www.findstat.org/St001904
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: InitialIncreasingSegmentLength(parkingFunction)
    description: The length of the initial strictly increasing segment.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St001904. The first i + 1 entries increase exactly when none of the first i neighboring pairs fails to rise.
