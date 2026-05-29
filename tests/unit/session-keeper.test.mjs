import test from "node:test";
import assert from "node:assert/strict";
import { computeNextDelay } from "../../src/utils/sessionBackoff.js";

test("computeNextDelay returns base interval when no failures", () => {
  assert.equal(computeNextDelay(0), 10 * 60 * 1000);
});

test("computeNextDelay applies exponential backoff with cap", () => {
  assert.equal(computeNextDelay(1), 20 * 60 * 1000);
  assert.equal(computeNextDelay(2), 30 * 60 * 1000);
  assert.equal(computeNextDelay(10), 30 * 60 * 1000);
});
