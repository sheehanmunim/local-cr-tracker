import assert from "node:assert/strict";
import test from "node:test";
import {
  getMsEccOption1NcdocWorkflowState,
  isMsEccOption1NcdocProcess,
  msEccOption1NcdocWorkflowState,
} from "../lib/ecc-workflow-intent.ts";

test("recognizes an MS ECC Option 1 CR already at NCDOC", () => {
  assert.equal(
    isMsEccOption1NcdocProcess(
      "Make a CR-0211897, this is now in MS ECC Option 1 NCDOC process",
    ),
    true,
  );
  assert.deepEqual(
    getMsEccOption1NcdocWorkflowState(
      "Make a CR-0211897, this is now in MS ECC Option 1 NCDOC process",
    ),
    msEccOption1NcdocWorkflowState,
  );
  assert.equal(msEccOption1NcdocWorkflowState.status, "NCDOC/xClass");
  assert.equal(msEccOption1NcdocWorkflowState.ncdocStatus, "In Progress");
  assert.equal(msEccOption1NcdocWorkflowState.xclassStatus, "Not Started");
  assert.equal(msEccOption1NcdocWorkflowState.oocApprovalStatus, "Complete");
  assert.equal(msEccOption1NcdocWorkflowState.chairApprovalStatus, "Complete");
});

test("does not treat an Option 1 request without NCDOC as already at NCDOC", () => {
  assert.equal(
    isMsEccOption1NcdocProcess("Make a CR-0211897 for MS ECC Option 1 review"),
    false,
  );
  assert.equal(
    getMsEccOption1NcdocWorkflowState(
      "Make a CR-0211897 for MS ECC Option 1 review",
    ),
    null,
  );
});
