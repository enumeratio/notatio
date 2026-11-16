// How the compile steps' items are split: across the processes of one step (shards.ts), and
// across the deep job's parts (verdict-snapshot.ts). Pure, so both read it.

import { createHash } from "node:crypto";

/** A key's shard when no costs are known: stable across runs and unrelated to listing order. */
export const hashShard = (key: string, shards: number): number =>
  createHash("sha256").update(key).digest().readUInt32BE(0) % shards;

/**
 * Each key's shard. With recorded costs (any unit, one per key): longest first, each to the
 * least loaded shard, so the dear definitions can't pile into one (a key with no record counts
 * the median). With none recorded (a cold first run) the hash split. Equal inputs give an equal
 * split, which every process of a run computes for itself.
 */
export function assignShards(
  keys: readonly string[],
  shards: number,
  costs: Readonly<Record<string, number>>,
): Map<string, number> {
  const known = keys.map((k) => costs[k]).filter((c): c is number => c !== undefined);
  if (known.length === 0) return new Map(keys.map((k) => [k, hashShard(k, shards)]));
  const median = known.toSorted((a, b) => a - b)[known.length >> 1]!;
  const cost = (key: string): number => costs[key] ?? median;
  const load = Array.from({ length: shards }, () => 0);
  const out = new Map<string, number>();
  for (const key of keys.toSorted((a, b) => cost(b) - cost(a) || (a < b ? -1 : a > b ? 1 : 0))) {
    const shard = load.indexOf(Math.min(...load));
    load[shard]! += cost(key);
    out.set(key, shard);
  }
  return out;
}
