// Run: npx tsx src/app/api/backup/token.check.ts
import assert from "node:assert/strict";
import { bearerOk } from "./token";

const T = "x".repeat(32);
assert.equal(bearerOk(`Bearer ${T}`, T), true);
assert.equal(bearerOk(`Bearer ${T}y`, T), false);
assert.equal(bearerOk(`bearer ${T}`, T), false);
assert.equal(bearerOk(T, T), false);
assert.equal(bearerOk(null, T), false);
assert.equal(bearerOk("Bearer ", ""), false); // unset token never matches an empty bearer
assert.equal(bearerOk("Bearer short", "short"), false); // tokens under 32 chars are refused
assert.equal(bearerOk(`Bearer ${T}`, undefined), false);

console.log("token.check ok");
