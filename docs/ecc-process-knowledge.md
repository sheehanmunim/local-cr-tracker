# ECC Process Knowledge

This tracker models Engineering Change Council (ECC) work for Change Requests
(CRs). It is a workflow guide for the assistant and the UI.

Current governing sources supplied on 2026-07-16:

- 107-WLX-003, Change Request - Change Approval, Rev AY, released 2026-06-23.
- EC-30001, ECS ECC Coordinator Expanded Work Instructions, Rev F, effective
  2026-06-30.
- EC-35200, CM Working List Expanded Work Instructions, Rev B, effective
  2026-06-30.

When older screenshots or prior tracker guidance conflicts with these
revisions, use the current documents above.

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
8. ECC closeout: all actions are closed, all approvals are documented, final
   ECC chair approval is obtained, final PDFs are uploaded to the ECC NCDOC,
   the PLM PDFs are sent for export classification, and the closure notification
   is sent.
9. CM Working List: only after complete ECC closeout, Engineering Services asks
   the IPT for the CM Working List Input Form, screens the CR supporting
   documents, updates the CM Working List ECC Tracker, and emails the CR to CM.
10. CM handoff completion: record the date sent to CM in `Targeted Submittal
   Date to CM`. If CM has already approved `CM Review Task Signoff`, skip the CM
   Working List because CM is already working the CR.

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
- Set up the MS ECC NCDOC per EC-30001 Rev F with ID
  `PWES-ECC.REA#-Supplier EC#` and name
  `PWES Military Supplier ECC Checklist`.
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

MS ECC waiver / CC-CII how-to rules from the local screenshots:

- For MS ECC Option 1, after CC and CII are complete, the next work is records
  closeout, not normal request-queue review. Make the ESA SAD and SAD VP
  reports, create the NCDOC, complete xClass, and send the MS ECC closure email.
- MS ECC Option 1 NCDOC naming uses the REA number rather than the generic CR
  number when the REA is the controlling identifier.
- Under the current EC-30001 Rev F waiver convention, use xClass `Other` for the
  EC-60002 ECC Waiver PDF and `Other 1` for the Waiver Approvals PDF. Submit
  technical and non-technical documents in different xClass requests/types.
- The MS ECC closure email should say the Military Supplier ECC Process for the
  CR has been submitted to xClass and closed out of ECC.
- Do not send the normal CM information email for MS ECC final closeout. The
  MS ECC closeout/xClass email is the final closure step for this process.
- For the non-MS CC/CII waiver Option 2 path, create the NCDOC, classify the ECC
  waiver as `Other` and Waiver Approvals as `Other 1`, finish complete ECC
  closeout, then ask for the CM Working List Input Form, review supporting
  documents, request workflow submission, and send the CR to CM.
- Once an IPT submits the CR to workflow, PLM automatically updates release
  status toward `In Work` or `In Review`; the IPT owns that submission.
- If a CR is already through CC and CII but the CR record is missing locally,
  Collins AI should create a local CR record or ask for the missing identifier
  and title/description. It should not refuse just because the CR is not already
  present in the local JSON context.

Required MS ECC Option 1 package/check artifacts:

- ECC OOC Approvals for MS ECC PDF.
- Waiver Approvals PDF.
- MS EC Checklist PDF.
- ECC Waiver PDF.
- NCDOC and xClass evidence.
- Closed-out-of-ECC / submitted-to-xClass email.
- ESA SAD and SAD VP reports.
- 12028 form.
- HSF-5280.03 / SECN form.
- Supplier EC / CR Report HSF-0064.09 when Collins is the supplier.
- Redlines where applicable, especially when another document is being updated.
- SUB form HSF-0064.01.
- AR form HSF-0735.00.

Waiver package checks from the how-to:

- Waiver form is the latest revision, has the correct CR number, active charge
  number, Collins PN/spec confirmation, design authority location / cage code,
  CO need-by or completion date, engine programs, component models, waived ECC
  reviews, and required approvals for the waiver option and affected programs.
- If the CO need-by/completion date is overdue, ask the IPT for a new date.
- WU report lists all affected PNs on ChangeID/ItemID and revision. Verify
  against the Collins PN on the waiver form and MP redlines.
- Approval evidence should include the CR number, approver name, and enough
  email-chain context to clearly show what is being waived.
- AR form should be latest revision, have the CR number and WBS, and use the
  New Document Releases / Document Relationship section only for brand new,
  never-released documents.
- In the ERP/SAP information table, use Part Numbers, not Drawing Numbers. List
  each PN explicitly; grouped entries such as `#####-ALL` are not acceptable.
- SUB form should be latest revision, have the CR number, export
  classification, and WBS. Export classification is not complete until xClass
  occurs.
- Redline changes should align with the SUB form, and MP/redline approvals
  should satisfy ESM3222.
- An Industrial Cut Over Plan is required if a CR waives any combination of
  Gates 1, 2, and 3.
- COM-PC-60116-Mech-Design-CR-Checklist is required only for mechanical
  changes. All questions in its `Compliant` column should be answered Yes or
  No, and approvers should be present and correct.

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

## CM Working List Process

Source procedure: EC-35200 CM Working List Expanded Work Instructions, Rev B,
effective 2026-06-30. Scope is ECC Coordinator guidance for reviewing CR
readiness for Configuration Management and submitting CRs to CM after ECC has
closed. The process applies only to the LHSWLPWES and/or LHSWLGEAI (EC&A)
Design Authority Groups.

CM Working List purpose and timing:

- CM asked Engineering Services to screen CRs before they go to CM.
- Initiate CM Working List only after the required ECC path is completely
  closed out: Class Concurrence plus Class II for Class II changes, Gate 4 for
  PWES Class I, or the P&C ECC review for P&C changes.
- Complete closeout means all actions, OOC approvals, and ECC Chair approvals
  are in the ECC folder; the PDF evidence is uploaded to the ECC NCDOC in PLM;
  and the PLM PDF has been sent for export classification.
- Military Supplier ECC does not require CM Working List because its CR should
  already be in the CM queue by this point.
- If the CR is already in workflow and CM has approved `CM Review Task Signoff`,
  skip the CM Working List process because CM is already working the CR.

CM Working List IPT follow-up:

- After complete ECC closeout, send the closure email and ask the IPT to fill
  out and return the `CM Working List Input Form`.
- Treat the returned input form as the source for the CM Working List ECC
  Tracker fields and attach the form to the email that sends the CR to CM.

CM Working List tracker handling:

- Add the CR to the CM Working List ECC Tracker and populate the respective
  columns from the IPT's CM Working List Input Form.
- Review the supporting documents in the PLM CR for accuracy and completeness:
  marked prints/redlines, marked-print/redline approvals, Where Used Report,
  SUB form, AR form, and any other document required by 107-WLX-003.
- Use the Collins PLM/Change Notes/Status column for notes such as missing
  documents and the next IPT follow-up date.
- When the required documents and participants are satisfactory, request that
  the IPT submit the CR to workflow.
- When emailing CM, attach the CM Working List Input Form. If the CR has not
  been submitted to workflow, use `Engineering Queue` and state that the IPT
  still needs to submit it. Use `CS QUEUE` while Release Status is `In Work`
  and `CM QUEUE` after Change Specialist approval changes it to `In Review`.
- If 51XXXXX-series drawings are affected, verify with PW Class II EC Writing
  or Engineering Services PD L3 that the redlines and Part Properties Form have
  PD L3 approval before CM works the CR, subject to the PW 1.5.2.1 Design
  Redline exception.
- After sending the CR to CM, update the tracker and set `Targeted Submittal
  Date to CM` to the date of the CM Working List Additions email.

CM submission:

- Send the CM Working List Additions email only after complete ECC closeout,
  receipt of the CM Working List Input Form, satisfactory supporting-document
  review, and the applicable workflow/queue status note.
- Attach the CM Working List Input Form to the email and record the sent date in
  `Targeted Submittal Date to CM`.

## 107-WLX-003 Supporting Document Rules

- Current source is 107-WLX-003 Rev AY, released 2026-06-23.
- Reference files belong under the CR's `Reference Items` tab in
  `References (Statused)`; ZIP files are not allowed.
- xClass type mapping: redlined drawings/specifications = `Redlined Drawing`;
  redlined parts list = `Parts List`; substantiation/SAN form = `Forms`; Where
  Used, AR form, and electronic marked-print approvals should be classified
  together as `Other`; old-style EC PDF = `Engineering Report`; customer
  approval PDF = `Coordination Memo`; and other supporting material uses
  `Other1`, `Other2`, or `Other3` (`Other4` and `Other5` do not exist).
- xClass requests use the owning-site cage code, not the cage code of the
  drawing that produced the redline: WLOX = 73030 and RKFD = 99167.
- Any file added after the initial xClass request must also be classified using
  a different available xClass type.
- If a classified file needs correction, replace the file in place; do not cut
  and re-add it. All attached-file symbols must update from `U` before workflow
  submission.
- The Where Used Report can be skipped only for an installation drawing, ATP,
  ESS, Programming/program-specific HS specification, or parts list. For a
  non-program-specific HS specification, contact CM for help. Where Used works
  on parts, not drawings.

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
- CM Working List is a post-ECC-closeout CM readiness/handoff state. Do not move
  a CR into it until the applicable ECC review has been completely closed out.
- Military Supplier ECC is not applicable to CM Working List because the CR
  should already be in the CM queue.
- For MS ECC, "pushed to closure" means the CR is in NCDOC/xClass records work,
  not the Closure phase and not Closed, until NCDOC, xClass, and IPT notification
  are complete.
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
- Military Supplier EC NCDOC ID: `PWES-ECC.REA#-Supplier EC#`; name:
  `PWES Military Supplier ECC Checklist`. Keep it separate from the Class
  Concurrence/Class II NCDOC and the Supplier EC NCDOC.
- Waiver PDFs: `CR# - ECC Waiver - CC, CII, G1-G4, Military Supplier - Date`
  and `CR# - Waiver Approvals - Date`.
- CM Working List email must include the CM Working List Input Form and the
  tracker must record the email date in `Targeted Submittal Date to CM`.
