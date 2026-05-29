import test from "node:test";
import assert from "node:assert/strict";
import {
  canApprove,
  canComplete,
  canEdit,
  canSignOff,
  canStart,
  buildWorkOrderStats,
} from "../../src/pages/WorkOrders/helpers.js";

test("capabilities contract is authoritative when present", () => {
  const actor = { _id: "u1", role: "admin" };
  const wo = {
    status: "draft",
    priority: "urgent",
    createdBy: "u2",
    capabilities: {
      canEdit: false,
      canApprove: false,
      canStart: false,
      canComplete: false,
      canSignOff: false,
    },
  };

  assert.equal(canEdit(actor, wo), false);
  assert.equal(canApprove(actor, wo), false);
  assert.equal(canStart(actor, wo), false);
  assert.equal(canComplete(actor, wo), false);
  assert.equal(canSignOff(actor, wo), false);
});

test("sensitive actions are denied when capabilities contract is missing", () => {
  const actor = { _id: "u1", role: "admin" };
  const wo = { status: "pending_approval", priority: "high", createdBy: "u1" };

  assert.equal(canApprove(actor, wo), false);
  assert.equal(canStart(actor, wo), false);
  assert.equal(canComplete(actor, wo), false);
  assert.equal(canSignOff(actor, wo), false);
});

test("buildWorkOrderStats counts today from createdAt", () => {
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stats = buildWorkOrderStats([
    { status: "in_progress", priority: "urgent", createdAt: today.toISOString() },
    { status: "pending_approval", priority: "high", createdAt: yesterday.toISOString() },
    { status: "done", priority: "low", createdAt: today.toISOString() },
  ]);

  assert.equal(stats.inProgress, 1);
  assert.equal(stats.pending, 1);
  assert.equal(stats.doneRate, 33);
  assert.equal(stats.urgentOpen, 1);
  assert.equal(stats.todayNew, 2);
});

