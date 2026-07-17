export function isMsEccOption1NcdocProcess(value: string) {
  return (
    /\b(?:make|create|add|start|open|draft)\s+(?:a\s+|an\s+|the\s+)?(?:new\s+)?(?:cr|change request)\b/i.test(
      value,
    ) &&
    /\b(?:ms\s+ecc|military\s+supplier\s+ecc)\b/i.test(value) &&
    /\boption\s*(?:1|one)\b/i.test(value) &&
    /\bncdoc\b/i.test(value)
  );
}

export const msEccOption1NcdocWorkflowState = {
  status: "NCDOC/xClass",
  classification: "Class II",
  currentGate: "CII",
  preMeetingReviewStatus: "Complete",
  ncdocStatus: "In Progress",
  xclassStatus: "Not Started",
  oocApprovalStatus: "Complete",
  chairApprovalStatus: "Complete",
  closureNotificationStatus: "Not Started",
  cmWorkingListStatus: "Not Applicable",
} as const;

export function getMsEccOption1NcdocWorkflowState(value: string) {
  return isMsEccOption1NcdocProcess(value)
    ? msEccOption1NcdocWorkflowState
    : null;
}
