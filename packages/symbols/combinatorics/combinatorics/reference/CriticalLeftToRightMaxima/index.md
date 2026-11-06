---
name: CriticalLeftToRightMaxima
domain: Parking function statistics
signature: CriticalLeftToRightMaxima(parkingFunction)
summary: The entries p that are left to right maxima with exactly p - 1 entries smaller and n - p larger.
catalog:
  - system: findstat
    identity: St000942
    url: https://www.findstat.org/St000942
    on: ParkingFunction
statOn:
  - ParkingFunction
signatures:
  - call: CriticalLeftToRightMaxima(parkingFunction)
    description: The entries p that are left to right maxima with exactly p - 1 entries smaller and n - p larger.
    library: enumeratio-combinatorics
    type: (parking_function) -> number
---

- Defined over `ParkingFunction` as an expression in `_x`, evaluated by compute-engine — the definition IS the implementation.
- Takes a `ParkingFunction` and nothing else — it reads values against their positions, or walks the orbits, so it needs the bijection. Applying it to a bare list is a type error, not a wrong answer.
- FindStat's St000942. A left to right maximum is larger than every entry before it.
