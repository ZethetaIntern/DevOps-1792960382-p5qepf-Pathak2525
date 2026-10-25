import test from "node:test";
import assert from "node:assert/strict";
import { signToken, verifyToken } from "../src/middleware/auth.js";
import { authorize, can } from "../src/middleware/authorize.js";
import { computeHash, verifyChain } from "../src/services/auditService.js";

test("JWT sign/verify round trip", () => {
  const token = signToken({ _id: "abc123", role: "sre" });
  const payload = verifyToken(token);
  assert.equal(payload.sub, "abc123");
  assert.equal(payload.role, "sre");
  assert.throws(() => verifyToken(token + "x"));
});

function run(mw, user) {
  let result;
  mw({ user }, {}, (err) => { result = err; });
  return result;
}

test("authorize allows listed roles and rejects others", () => {
  const mw = authorize("admin", "sre");
  assert.equal(run(mw, { role: "sre" }), undefined);
  assert.equal(run(mw, { role: "viewer" }).status, 403);
  assert.equal(run(mw, undefined).status, 401);
});

test("permission map: only approvers can approve failover; requester roles cannot", () => {
  assert.equal(run(can("failover:approve"), { role: "dba" }), undefined);
  assert.equal(run(can("failover:approve"), { role: "sre" }).status, 403);
  assert.equal(run(can("failover:reset"), { role: "sre" }).status, 403);
});

test("audit hash chain detects tampering", () => {
  const GENESIS = "0".repeat(64);
  const e1 = { seq: 1, actorId: "a", actorEmail: "a@x", action: "one", resource: "", resourceId: "", metadata: {}, prevHash: GENESIS };
  e1.hash = computeHash(e1);
  const e2 = { seq: 2, actorId: "a", actorEmail: "a@x", action: "two", resource: "", resourceId: "", metadata: {}, prevHash: e1.hash };
  e2.hash = computeHash(e2);
  assert.equal(verifyChain([e1, e2]).valid, true);
  const tampered = { ...e1, action: "changed" };
  assert.equal(verifyChain([tampered, e2]).valid, false);
  assert.equal(verifyChain([e2]).valid, false);
});
