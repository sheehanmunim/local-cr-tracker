# ECC Process Knowledge

This tracker models Engineering Change Council (ECC) work for Change Requests
(CRs). It is a local workflow guide for the assistant and the UI.

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
- PWES Military: supports Class Concurrence, Class I, and Class II.
- EC&A: supports Class Concurrence, Class I, and Class II.
- P&C: supports Class II only; no formal Class Concurrence and no Class I path.

## Classification and Gates

- Class Concurrence confirms whether the CR is Class I or Class II. P&C changes
  are exempt from formal Class Concurrence.
- PWES Class I is a gated process with CC and Gates 1-4.
- EC&A Class I is a gated process with CC and Gates 1-3.
- Class II is a single review path, commonly represented as CII after CC.
- Delta Reviews occur when the original disposition is held for actions or
  rejected and actions must be substantiated before approval.
- Waivers can bypass an in-person review, waive a gate/review, or waive ECC for
  admin/non-technical changes. Waivers still require approval evidence, PDFs,
  NCDOC upload, xClass handling, and notification.

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
