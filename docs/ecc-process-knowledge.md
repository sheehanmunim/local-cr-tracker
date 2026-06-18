# ECC Process Knowledge

This tracker models Engineering Change Council (ECC) work for Change Requests
(CRs). It is a workflow guide for the assistant and the UI.

## Core Flow

1. Intake: IPT submits an ECC meeting request with CR number, engine program,
   component/model, requested review, classification guess, date/time, and
   charge number.
2. Booking: coordinator verifies the charge number is active, creates or links
   the CR folder, reserves the meeting slot, updates the agenda tracker, and
   sends the documentation notification.
3. Documentation: IPT uploads required documents before the deadline, typically
   noon two days before the meeting. If required documents are missing by the
   deadline, the meeting can be cancelled and the IPT must submit a new request.
4. Pre-meeting review: coordinator checks the package for completeness and may
   review with the IPT before the meeting.
5. Meeting: IPT presents the package, quorum reviews checklist/deck material,
   classification/gate decisions are confirmed, actions are recorded, and
   approvals or out-of-conference approval needs are captured.
6. Post meeting: coordinator saves required PDFs, combines packages where
   applicable, uploads to the NCDOC, updates xClass fields, and records
   disposition in the tracker.
7. Actions/OOC approvals: open actions require evidence before closure. Open
   actions usually block the next meeting and OOC approvals unless the chair or
   action wording explicitly says they do not hold up progression.
8. Closure: all actions are closed, all approvals are documented, final ECC
   chair approval is obtained, final PDFs are uploaded/classified, and closure
   notification is sent.

## ECC Boards

- PWES Commercial: supports Class Concurrence, Class I, and Class II.
- PWES Military: supports Class Concurrence, Class I, Class II, and Military
  Supplier EC reviews.
- EC&A: supports Class Concurrence, Class I, and Class II.
- P&C: supports Class II only; no formal Class Concurrence and no Class I path.

## Classification and Gates

- Class Concurrence confirms whether the CR is Class I or Class II. P&C changes
  are exempt from formal Class Concurrence.
- PWES Class I is a gated process with CC and Gates 1-4.
- EC&A Class I is a gated process with CC and Gates 1-3.
- Class II is a single review path, commonly represented as CII after CC.
- Military Supplier EC is a PWES Military review for Pratt & Whitney Supplier
  Class II Military ECs before submission to Pratt & Whitney. It can be paired
  with Class Concurrence and Class II in the same session, but the Military
  Supplier EC review should occur first.
- Delta Reviews occur when the original disposition is held for actions or
  rejected and actions must be substantiated before approval.
- Waivers can bypass an in-person review, waive a gate/review, or waive ECC for
  admin/non-technical changes. Waivers still require approval evidence, PDFs,
  NCDOC upload, xClass handling, and notification.

## Military Supplier EC Process

Source procedure: EC-25230 Military Supplier EC Processes, effective
2025-03-31. Scope is review of Pratt & Whitney Supplier Class II Military ECs
before submission to Pratt & Whitney. COTS for military applications such as
F117 and F139/PW4062 Tanker are not applicable to this process.

Scenario selection:

- Scenario 1: Hamilton Sundstrand CR = yes, PW 51XXXXX drawing affected = yes,
  other PW drawing affected = no. A supplier EC drives an HS CR and a PW EC
  because the parts are co-owned by HS and PW.
- Scenario 2: Hamilton Sundstrand CR = yes, PW 51XXXXX drawing affected = no,
  other PW drawing affected = yes. The HS CR drives a PW Class II EC.
- Scenario 3: Hamilton Sundstrand CR = yes, PW 51XXXXX drawing affected = no,
  other PW drawing affected = no. The HS CR requires PW customer approval but
  does not drive a PW Class II EC.
- Scenario 4: Hamilton Sundstrand CR = no, PW 51XXXXX drawing affected = no,
  other PW drawing affected = yes. The supplier EC drives a PW Class II EC.
- Scenario 5: Hamilton Sundstrand CR = no, PW 51XXXXX drawing affected = no,
  other PW drawing affected = no. The supplier EC does not drive a PW Class II
  EC.

Common Military Supplier EC workflow:

- IPT submits an ECC Meeting Request per EC-20120 on SharePoint with Review
  Being Requested set to `Military Supplier EC`.
- If the IPT is ready for all review types, it can also request Class
  Concurrence and Class II. In that case, the Supplier ECC review is held before
  Class Concurrence and Class II during the same session. Otherwise, Class
  Concurrence and Class II can be requested for a later date.
- Class Concurrence and Class II are recommended not to be approved by the ECC
  Chair until Military Supplier ECC is complete.
- ECC Coordinator provides the IPT with the network folder for ECC documents.
- IPT completes Military Supplier ECC Checklist EC-60019 before the Military
  Supplier ECC review and saves it in the ECC folder.
- ECC Coordinator reviews EC-60019 and supporting documents for completeness
  and sends feedback to the IPT.

PD L3/redline prerequisites for Scenarios 1, 2, and 4:

- Before the ECC folder step, the IPT submits redlines and EC-60020 to
  Engineering Services for Product Definition Level 3 review.
- Scenario 1 uses applicable HS drawing redlines; PD L3 also reviews the
  redline package per EC-60008 for the 51XXXXX Series Checklist.
- Scenarios 2 and 4 use applicable PW drawing redlines.
- PD L3 approval is used for REA Kit Approval and is a prerequisite for the MS
  ECC package. The PD L3 should copy the ECC DL and EPO DL on the approval
  email.
- Redlines are stored in PW TCE ETFF > Eng Requirements and Layout > Design
  Layout.
- Engineering Services Product Definition is a required approver for Military
  Supplier ECC. Prefer naming the same PD L3 who approved the redlines.
- If review actions change redlines, the PD L3 must review the revised redlines
  and send a new approval email.
- If ECC approvals are gathered out of conference, the workflow can exclude the
  PD L3 because the PD L3 email approval is the evidence.

Military Supplier EC package guidance:

- Common package items include EC-60019, filled-out HSF-5280.03, filled-out
  12028 form, supplier EC evidence, supplier redlines where applicable, SADVP if
  applicable, and deviation if applicable.
- Scenario 1 adds Supplier EC, Supplier Redlines, and Hamilton Sundstrand
  redlines.
- Scenario 2 uses Supplier EC/CR Report and Supplier/Hamilton Sundstrand
  redlines.
- Scenario 3 uses Supplier EC/Hamilton Sundstrand CR and Supplier/Hamilton
  Sundstrand redlines.
- Scenarios 4 and 5 use Supplier EC and Supplier Redlines.

Military Supplier EC action and closeout rules:

- If actions are assigned, action closure confirmation from the action
  requestor is required for each action by email.
- If quorum requests a delta ECC review, action closure confirmations are
  required before the delta review.
- Military Supplier ECC closeout uses a separate NCDOC from the ECC Class
  Concurrence/Class II NCDOC and from the Supplier EC NCDOC.
- Set up the MS ECC NCDOC per EC-30001. Use
  `PWES Military Supplier ECC Checklist (EC #)` for supplier EC-numbered cases
  and `PWES Military Supplier ECC Checklist (CR-#)` for HS CR-numbered cases.
- For an MS ECC review meeting, required closeout files are the post-meeting PDF
  of the checklist, OOC approvals, and final checklist if applicable.
- For a waiver path, required closeout files are ECC Waiver Request Form
  EC-60002, waiver approvals, the final checklist, and required OOC approvals.
- Scenario 3 specifically uploads the PDF of EC-60019 to its own NCDOC rather
  than the normal ECC NCDOC.
- When a PW EC validates in Scenarios 1, 2, or 4, the Class II EC Writer
  approves the Supplier EC NCDOC. In Scenario 2, the PW EC Coordinator/Class II
  Council Chair also informs Hamilton Sundstrand CM and the PW Supplier EC
  Coordinator that the validated PW EC constitutes customer approval of the HS
  CR.

Military Supplier EC terms:

- MS ECC: Military Supplier Engineering Change Council.
- HS: Hamilton Sundstrand.
- COTS: commercial off-the-shelf.
- PD L3: Product Definition Level 3.
- REA: request for engineering action.
- CL II: Class II.
- DL: distribution list.
- HSF-5280.03: form saved with the MS ECC package.
- ETFF: Engineering Task File Folder in PW TCE.
- PW TCE: Pratt & Whitney Teamcenter Enterprise; prefer this term over PW TC.

## Required Package Guidance

- PWES Commercial/Military Class Concurrence: checklist, slide deck, WU report,
  and MP redlines when applicable.
- PWES Class I: checklist, Class I slide deck, WU report, MP redlines, and
  electronic addendum if EEC or related details are affected.
- PWES Class II: checklist, Class II slide deck, WU report, MP redlines, and
  electronic addendum if applicable.
- EC&A Class Concurrence: EC&A slide deck, WU report, and MP redlines.
- EC&A Class I: Gate 1/2/3 templates, WU report, and MP redlines.
- EC&A Class II: Class II slide deck, WU report, and MP redlines.
- P&C Class II: checklist, SUB form, WU report, MP redlines, and electronic
  addendum if applicable.
- PWES Military Supplier EC: Military Supplier ECC Checklist EC-60019,
  HSF-5280.03, filled-out 12028 form, supplier EC evidence, supplier redlines
  where applicable, SADVP if applicable, deviation if applicable, and PD L3
  redline approval evidence for Scenarios 1, 2, and 4.

## Dispositions

Use one of the standard dispositions when it fits:

- Approved
- Approved w/Actions
- Held for Actions
- Pending OOC Approvals

If none applies, use a concise descriptive disposition.

## Closure Rules

- A CR is not closed until all actions are closed and supported by evidence.
- A CR is not closed until all required OOC approvals and chair approval are
  gathered and documented.
- Approval evidence must identify approver, CR number, role, what was approved,
  source, and timestamp/date where available.
- NCDOC and xClass work should remain visible as separate checklist states.
- Design authority affects the closure path and notification routing.

## Naming Rules to Support

- Folder: `CR-# - Engine Program - Component Model`
- Calendar title: `CR-# - Engine Program - Engine Component`
- Checklist: `CR-# - Review/Gate - Date`
- PowerPoint: `CR-# - Review/Gate Review - Date`
- Combined PDF: `CR-# - Combined - Reviews/Gates - Date`
- Attendance: `CR-# - Attendance - Review/Gate - Date`
- OOC approval: `CR-# - OOC Approval - Role - Last Name - Date`
- OOC approval PDF: `CR-# - OOC Approvals - Reviews/Gates - Date`
- NCDOC IDs: `PWES-ECC.CR-#`, `ECA-ECC.CR-#`, or `PC-ECC.CR-#`
- Military Supplier EC NCDOC title: `PWES Military Supplier ECC Checklist (EC #)`
  or `PWES Military Supplier ECC Checklist (CR-#)`, separate from the Class
  Concurrence/Class II NCDOC and separate from the Supplier EC NCDOC.
