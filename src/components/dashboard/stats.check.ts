// Run: npx tsx src/components/dashboard/stats.check.ts
import assert from "node:assert/strict";
import type { Day } from "@/lib/analytics";
import { addDays, bucket, linkTaps, span, sum, ticks } from "./stats";

assert.equal(addDays("2026-03-01", -1), "2026-02-28");
assert.equal(addDays("2026-12-31", 1), "2027-01-01");

const days: Day[] = [{ day: "2026-10-10", counts: { view: 5, "l:a": 2 } }, { day: "2026-10-12", counts: { view: 1, wa: 1, "l:b": 3 } }];
const w = span(days, "2026-10-12", 4);
assert.deepEqual(w.map((d) => d.day), ["2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12"]);
assert.deepEqual(w[2]!.counts, {}); // zero-filled gap
assert.deepEqual(sum(w), { view: 6, "l:a": 2, wa: 1, "l:b": 3 });
assert.equal(linkTaps(sum(w)), 5);

// Newest bucket is complete; the oldest takes the remainder.
const b = bucket(span(days, "2026-10-12", 10), 7);
assert.deepEqual(b.map((x) => [x.from, x.to]), [["2026-10-03", "2026-10-05"], ["2026-10-06", "2026-10-12"]]);

assert.deepEqual(ticks(0), [0, 1, 2, 3, 4]);
assert.deepEqual(ticks(173), [0, 50, 100, 150, 200]);
assert.ok(ticks(147_413_923).at(-1)! >= 147_413_923);

console.log("stats.check ok");
