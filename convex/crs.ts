import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, mutation, query } from "./_generated/server";

const crStatus = v.union(
  v.literal("Intake"),
  v.literal("Documentation Pending"),
  v.literal("Ready for Review"),
  v.literal("Meeting Scheduled"),
  v.literal("Review"),
  v.literal("Approved"),
  v.literal("Approved w/Actions"),
  v.literal("In Progress"),
  v.literal("Blocked"),
  v.literal("Held for Actions"),
  v.literal("Pending OOC Approvals"),
  v.literal("Testing"),
  v.literal("Implemented"),
  v.literal("Waiver Processing"),
  v.literal("NCDOC/xClass"),
  v.literal("CM Working List"),
  v.literal("Closed"),
  v.literal("Rejected"),
);

const priority = v.union(
  v.literal("Low"),
  v.literal("Medium"),
  v.literal("High"),
  v.literal("Critical"),
);

const risk = v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"));

const eccBoard = v.union(
  v.literal("PWES Commercial"),
  v.literal("PWES Military"),
  v.literal("EC&A"),
  v.literal("P&C"),
  v.literal("Other"),
);

const crClassification = v.union(
  v.literal("TBD"),
  v.literal("Class Concurrence"),
  v.literal("Class I"),
  v.literal("Class II"),
  v.literal("Waiver"),
  v.literal("Admin/NonTech"),
);

const reviewGate = v.union(
  v.literal("None"),
  v.literal("CC"),
  v.literal("CII"),
  v.literal("G1"),
  v.literal("G2"),
  v.literal("G3"),
  v.literal("G4"),
  v.literal("P&C"),
  v.literal("Waiver"),
  v.literal("Delta Review"),
);

const taskState = v.union(
  v.literal("Not Started"),
  v.literal("In Progress"),
  v.literal("Complete"),
  v.literal("Blocked"),
  v.literal("Not Applicable"),
);

const actionStatus = v.union(
  v.literal("Open"),
  v.literal("Closed"),
  v.literal("Not Holding"),
);

const approvalStatus = v.union(
  v.literal("Needed"),
  v.literal("Sent"),
  v.literal("Approved"),
  v.literal("Rejected"),
  v.literal("Not Required"),
);

const approvalSource = v.union(
  v.literal("SharePoint"),
  v.literal("Email"),
  v.literal("Chair"),
  v.literal("Program"),
  v.literal("Other"),
);

const statusFilter = v.union(
  v.literal("All"),
  v.literal("Intake"),
  v.literal("Documentation Pending"),
  v.literal("Ready for Review"),
  v.literal("Meeting Scheduled"),
  v.literal("Review"),
  v.literal("Approved"),
  v.literal("Approved w/Actions"),
  v.literal("In Progress"),
  v.literal("Blocked"),
  v.literal("Held for Actions"),
  v.literal("Pending OOC Approvals"),
  v.literal("Testing"),
  v.literal("Implemented"),
  v.literal("Waiver Processing"),
  v.literal("NCDOC/xClass"),
  v.literal("CM Working List"),
  v.literal("Closed"),
  v.literal("Rejected"),
);

type CrPatch = Partial<{
  crNumber: string;
  title: string;
  status: Doc<"crs">["status"];
  priority: Doc<"crs">["priority"];
  risk: Doc<"crs">["risk"];
  category: string;
  owner: string;
  requester: string;
  system: string;
  targetDate: string | null;
  submittedDate: string;
  description: string;
  businessImpact: string;
  technicalNotes: string;
  tags: string[];
  eccBoard: Doc<"crs">["eccBoard"];
  classification: Doc<"crs">["classification"];
  currentGate: Doc<"crs">["currentGate"];
  meetingDate: string | null;
  documentationDeadline: string | null;
  crFolderPath: string;
  wbsChargeNumber: string;
  chargeNumberActive: boolean;
  quorum: string[];
  documentationNotificationStatus: Doc<"crs">["documentationNotificationStatus"];
  preMeetingReviewStatus: Doc<"crs">["preMeetingReviewStatus"];
  meetingAttendanceStatus: Doc<"crs">["meetingAttendanceStatus"];
  postMeetingPdfStatus: Doc<"crs">["postMeetingPdfStatus"];
  ncdocStatus: Doc<"crs">["ncdocStatus"];
  xclassStatus: Doc<"crs">["xclassStatus"];
  oocApprovalStatus: Doc<"crs">["oocApprovalStatus"];
  chairApprovalStatus: Doc<"crs">["chairApprovalStatus"];
  closureNotificationStatus: Doc<"crs">["closureNotificationStatus"];
  cmWorkingListStatus: Doc<"crs">["cmWorkingListStatus"];
  waiverOption: string | null;
  designAuthority: string;
  disposition: string;
  isArchived: boolean;
  lastUpdatedAt: number;
}>;

export const list = query({
  args: { status: statusFilter },
  handler: async (ctx, args) => {
    if (args.status !== "All") {
      const status = args.status as Doc<"crs">["status"];
      return await ctx.db
        .query("crs")
        .withIndex("by_isArchived_and_status", (q) =>
          q.eq("isArchived", false).eq("status", status),
        )
        .order("desc")
        .take(200);
    }

    return await ctx.db
      .query("crs")
      .withIndex("by_isArchived", (q) => q.eq("isArchived", false))
      .order("desc")
      .take(200);
  },
});

export const listUpdates = query({
  args: { crId: v.id("crs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crUpdates")
      .withIndex("by_crId_and_createdAt", (q) => q.eq("crId", args.crId))
      .order("desc")
      .take(30);
  },
});

export const create = mutation({
  args: {
    crNumber: v.string(),
    title: v.string(),
    status: crStatus,
    priority,
    risk,
    category: v.string(),
    owner: v.string(),
    requester: v.string(),
    system: v.string(),
    targetDate: v.union(v.string(), v.null()),
    submittedDate: v.string(),
    description: v.string(),
    businessImpact: v.string(),
    technicalNotes: v.string(),
    tags: v.array(v.string()),
    eccBoard,
    classification: crClassification,
    currentGate: reviewGate,
    meetingDate: v.union(v.string(), v.null()),
    documentationDeadline: v.union(v.string(), v.null()),
    crFolderPath: v.string(),
    wbsChargeNumber: v.string(),
    chargeNumberActive: v.boolean(),
    quorum: v.array(v.string()),
    documentationNotificationStatus: taskState,
    preMeetingReviewStatus: taskState,
    meetingAttendanceStatus: taskState,
    postMeetingPdfStatus: taskState,
    ncdocStatus: taskState,
    xclassStatus: taskState,
    oocApprovalStatus: taskState,
    chairApprovalStatus: taskState,
    closureNotificationStatus: taskState,
    cmWorkingListStatus: taskState,
    waiverOption: v.union(v.string(), v.null()),
    designAuthority: v.string(),
    disposition: v.string(),
    author: v.string(),
  },
  handler: async (ctx, args) => {
    const crNumber = args.crNumber.trim();
    const title = args.title.trim();

    if (!crNumber || !title) {
      throw new Error("CR number and title are required.");
    }

    const existing = await ctx.db
      .query("crs")
      .withIndex("by_crNumber", (q) => q.eq("crNumber", crNumber))
      .unique();

    if (existing) {
      throw new Error(`A CR with number ${crNumber} already exists.`);
    }

    const now = Date.now();
    const crId = await ctx.db.insert("crs", {
      crNumber,
      title,
      status: args.status,
      priority: args.priority,
      risk: args.risk,
      category: cleanText(args.category, "General"),
      owner: cleanText(args.owner, "Unassigned"),
      requester: cleanText(args.requester, "Unknown"),
      system: cleanText(args.system, "General"),
      targetDate: cleanDate(args.targetDate),
      submittedDate: cleanText(args.submittedDate, todayIso()),
      description: cleanText(args.description, "No description provided."),
      businessImpact: cleanText(args.businessImpact, "Not specified."),
      technicalNotes: cleanText(args.technicalNotes, "Not specified."),
      tags: cleanTags(args.tags),
      eccBoard: args.eccBoard,
      classification: args.classification,
      currentGate: args.currentGate,
      meetingDate: cleanDate(args.meetingDate),
      documentationDeadline: cleanDate(args.documentationDeadline),
      crFolderPath: cleanText(args.crFolderPath, ""),
      wbsChargeNumber: cleanText(args.wbsChargeNumber, ""),
      chargeNumberActive: args.chargeNumberActive,
      quorum: cleanList(args.quorum),
      documentationNotificationStatus: args.documentationNotificationStatus,
      preMeetingReviewStatus: args.preMeetingReviewStatus,
      meetingAttendanceStatus: args.meetingAttendanceStatus,
      postMeetingPdfStatus: args.postMeetingPdfStatus,
      ncdocStatus: args.ncdocStatus,
      xclassStatus: args.xclassStatus,
      oocApprovalStatus: args.oocApprovalStatus,
      chairApprovalStatus: args.chairApprovalStatus,
      closureNotificationStatus: args.closureNotificationStatus,
      cmWorkingListStatus: args.cmWorkingListStatus,
      waiverOption: cleanNullableText(args.waiverOption),
      designAuthority: cleanText(args.designAuthority, ""),
      disposition: cleanText(args.disposition, "Documentation pending"),
      isArchived: false,
      lastUpdatedAt: now,
    });

    await ctx.db.insert("crUpdates", {
      crId,
      author: cleanText(args.author, "Local user"),
      body: "CR created.",
      kind: "created",
      createdAt: now,
    });

    return crId;
  },
});

export const update = mutation({
  args: {
    id: v.id("crs"),
    crNumber: v.optional(v.string()),
    title: v.optional(v.string()),
    status: v.optional(crStatus),
    priority: v.optional(priority),
    risk: v.optional(risk),
    category: v.optional(v.string()),
    owner: v.optional(v.string()),
    requester: v.optional(v.string()),
    system: v.optional(v.string()),
    targetDate: v.optional(v.union(v.string(), v.null())),
    submittedDate: v.optional(v.string()),
    description: v.optional(v.string()),
    businessImpact: v.optional(v.string()),
    technicalNotes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    eccBoard: v.optional(eccBoard),
    classification: v.optional(crClassification),
    currentGate: v.optional(reviewGate),
    meetingDate: v.optional(v.union(v.string(), v.null())),
    documentationDeadline: v.optional(v.union(v.string(), v.null())),
    crFolderPath: v.optional(v.string()),
    wbsChargeNumber: v.optional(v.string()),
    chargeNumberActive: v.optional(v.boolean()),
    quorum: v.optional(v.array(v.string())),
    documentationNotificationStatus: v.optional(taskState),
    preMeetingReviewStatus: v.optional(taskState),
    meetingAttendanceStatus: v.optional(taskState),
    postMeetingPdfStatus: v.optional(taskState),
    ncdocStatus: v.optional(taskState),
    xclassStatus: v.optional(taskState),
    oocApprovalStatus: v.optional(taskState),
    chairApprovalStatus: v.optional(taskState),
    closureNotificationStatus: v.optional(taskState),
    cmWorkingListStatus: v.optional(taskState),
    waiverOption: v.optional(v.union(v.string(), v.null())),
    designAuthority: v.optional(v.string()),
    disposition: v.optional(v.string()),
    author: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await requireCr(ctx, args.id);
    const now = Date.now();
    const patch: CrPatch = { lastUpdatedAt: now };

    if (args.crNumber !== undefined) {
      const crNumber = args.crNumber.trim();
      if (!crNumber) {
        throw new Error("CR number is required.");
      }
      if (crNumber !== existing.crNumber) {
        const duplicate = await ctx.db
          .query("crs")
          .withIndex("by_crNumber", (q) => q.eq("crNumber", crNumber))
          .unique();
        if (duplicate) {
          throw new Error(`A CR with number ${crNumber} already exists.`);
        }
      }
      patch.crNumber = crNumber;
    }

    if (args.title !== undefined) {
      patch.title = cleanText(args.title, existing.title);
    }
    if (args.status !== undefined) {
      patch.status = args.status;
    }
    if (args.priority !== undefined) {
      patch.priority = args.priority;
    }
    if (args.risk !== undefined) {
      patch.risk = args.risk;
    }
    if (args.category !== undefined) {
      patch.category = cleanText(args.category, existing.category);
    }
    if (args.owner !== undefined) {
      patch.owner = cleanText(args.owner, "Unassigned");
    }
    if (args.requester !== undefined) {
      patch.requester = cleanText(args.requester, "Unknown");
    }
    if (args.system !== undefined) {
      patch.system = cleanText(args.system, "General");
    }
    if (args.targetDate !== undefined) {
      patch.targetDate = cleanDate(args.targetDate);
    }
    if (args.submittedDate !== undefined) {
      patch.submittedDate = cleanText(args.submittedDate, existing.submittedDate);
    }
    if (args.description !== undefined) {
      patch.description = cleanText(args.description, "No description provided.");
    }
    if (args.businessImpact !== undefined) {
      patch.businessImpact = cleanText(args.businessImpact, "Not specified.");
    }
    if (args.technicalNotes !== undefined) {
      patch.technicalNotes = cleanText(args.technicalNotes, "Not specified.");
    }
    if (args.tags !== undefined) {
      patch.tags = cleanTags(args.tags);
    }
    if (args.eccBoard !== undefined) {
      patch.eccBoard = args.eccBoard;
    }
    if (args.classification !== undefined) {
      patch.classification = args.classification;
    }
    if (args.currentGate !== undefined) {
      patch.currentGate = args.currentGate;
    }
    if (args.meetingDate !== undefined) {
      patch.meetingDate = cleanDate(args.meetingDate);
    }
    if (args.documentationDeadline !== undefined) {
      patch.documentationDeadline = cleanDate(args.documentationDeadline);
    }
    if (args.crFolderPath !== undefined) {
      patch.crFolderPath = cleanText(args.crFolderPath, "");
    }
    if (args.wbsChargeNumber !== undefined) {
      patch.wbsChargeNumber = cleanText(args.wbsChargeNumber, "");
    }
    if (args.chargeNumberActive !== undefined) {
      patch.chargeNumberActive = args.chargeNumberActive;
    }
    if (args.quorum !== undefined) {
      patch.quorum = cleanList(args.quorum);
    }
    if (args.documentationNotificationStatus !== undefined) {
      patch.documentationNotificationStatus = args.documentationNotificationStatus;
    }
    if (args.preMeetingReviewStatus !== undefined) {
      patch.preMeetingReviewStatus = args.preMeetingReviewStatus;
    }
    if (args.meetingAttendanceStatus !== undefined) {
      patch.meetingAttendanceStatus = args.meetingAttendanceStatus;
    }
    if (args.postMeetingPdfStatus !== undefined) {
      patch.postMeetingPdfStatus = args.postMeetingPdfStatus;
    }
    if (args.ncdocStatus !== undefined) {
      patch.ncdocStatus = args.ncdocStatus;
    }
    if (args.xclassStatus !== undefined) {
      patch.xclassStatus = args.xclassStatus;
    }
    if (args.oocApprovalStatus !== undefined) {
      patch.oocApprovalStatus = args.oocApprovalStatus;
    }
    if (args.chairApprovalStatus !== undefined) {
      patch.chairApprovalStatus = args.chairApprovalStatus;
    }
    if (args.closureNotificationStatus !== undefined) {
      patch.closureNotificationStatus = args.closureNotificationStatus;
    }
    if (args.cmWorkingListStatus !== undefined) {
      patch.cmWorkingListStatus = args.cmWorkingListStatus;
    }
    if (args.waiverOption !== undefined) {
      patch.waiverOption = cleanNullableText(args.waiverOption);
    }
    if (args.designAuthority !== undefined) {
      patch.designAuthority = cleanText(args.designAuthority, "");
    }
    if (args.disposition !== undefined) {
      patch.disposition = cleanText(args.disposition, "");
    }

    await ctx.db.patch(args.id, patch);

    if (args.status !== undefined && args.status !== existing.status) {
      await ctx.db.insert("crUpdates", {
        crId: args.id,
        author: cleanText(args.author, "Local user"),
        body: `Status changed from ${existing.status} to ${args.status}.`,
        kind: "status",
        createdAt: now,
      });
    } else {
      await ctx.db.insert("crUpdates", {
        crId: args.id,
        author: cleanText(args.author, "Local user"),
        body: "CR details updated.",
        kind: "edited",
        createdAt: now,
      });
    }

    return args.id;
  },
});

export const addUpdate = mutation({
  args: {
    crId: v.id("crs"),
    author: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCr(ctx, args.crId);
    const body = args.body.trim();
    if (!body) {
      throw new Error("Update note cannot be empty.");
    }
    const now = Date.now();
    await ctx.db.insert("crUpdates", {
      crId: args.crId,
      author: cleanText(args.author, "Local user"),
      body,
      kind: "note",
      createdAt: now,
    });
    await ctx.db.patch(args.crId, { lastUpdatedAt: now });
    return args.crId;
  },
});

export const archive = mutation({
  args: { id: v.id("crs"), author: v.string() },
  handler: async (ctx, args) => {
    await requireCr(ctx, args.id);
    const now = Date.now();
    await ctx.db.patch(args.id, { isArchived: true, lastUpdatedAt: now });
    await ctx.db.insert("crUpdates", {
      crId: args.id,
      author: cleanText(args.author, "Local user"),
      body: "CR archived.",
      kind: "edited",
      createdAt: now,
    });
    return args.id;
  },
});

export const listActions = query({
  args: { crId: v.id("crs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crActions")
      .withIndex("by_crId_and_createdAt", (q) => q.eq("crId", args.crId))
      .order("desc")
      .take(100);
  },
});

export const addAction = mutation({
  args: {
    crId: v.id("crs"),
    gate: reviewGate,
    owner: v.string(),
    body: v.string(),
    dueDate: v.union(v.string(), v.null()),
    evidenceLocation: v.string(),
    author: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCr(ctx, args.crId);
    const body = args.body.trim();
    if (!body) {
      throw new Error("Action text cannot be empty.");
    }
    const now = Date.now();
    await ctx.db.insert("crActions", {
      crId: args.crId,
      gate: args.gate,
      owner: cleanText(args.owner, "IPT"),
      body,
      status: "Open",
      dueDate: cleanDate(args.dueDate),
      evidenceLocation: cleanText(args.evidenceLocation, ""),
      createdAt: now,
      closedAt: null,
    });
    await ctx.db.patch(args.crId, {
      status: "Held for Actions",
      disposition: "Held for actions",
      lastUpdatedAt: now,
    });
    await ctx.db.insert("crUpdates", {
      crId: args.crId,
      author: cleanText(args.author, "Local user"),
      body: `Action opened: ${body}`,
      kind: "edited",
      createdAt: now,
    });
    return args.crId;
  },
});

export const updateActionStatus = mutation({
  args: {
    id: v.id("crActions"),
    status: actionStatus,
    evidenceLocation: v.optional(v.string()),
    author: v.string(),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.id);
    if (!action) {
      throw new Error("Action not found.");
    }
    await requireCr(ctx, action.crId);
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: args.status,
      evidenceLocation:
        args.evidenceLocation === undefined
          ? action.evidenceLocation
          : cleanText(args.evidenceLocation, ""),
      closedAt: args.status === "Closed" ? now : null,
    });
    await ctx.db.patch(action.crId, { lastUpdatedAt: now });
    await ctx.db.insert("crUpdates", {
      crId: action.crId,
      author: cleanText(args.author, "Local user"),
      body: `Action marked ${args.status}: ${action.body}`,
      kind: "edited",
      createdAt: now,
    });
    return action.crId;
  },
});

export const listApprovals = query({
  args: { crId: v.id("crs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crApprovals")
      .withIndex("by_crId_and_createdAt", (q) => q.eq("crId", args.crId))
      .order("desc")
      .take(100);
  },
});

export const addApproval = mutation({
  args: {
    crId: v.id("crs"),
    gate: reviewGate,
    approverName: v.string(),
    role: v.string(),
    source: approvalSource,
    evidenceLocation: v.string(),
    author: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCr(ctx, args.crId);
    const approverName = args.approverName.trim();
    if (!approverName) {
      throw new Error("Approver name is required.");
    }
    const now = Date.now();
    await ctx.db.insert("crApprovals", {
      crId: args.crId,
      gate: args.gate,
      approverName,
      role: cleanText(args.role, "Quorum"),
      status: "Needed",
      source: args.source,
      evidenceLocation: cleanText(args.evidenceLocation, ""),
      sentAt: null,
      approvedAt: null,
      createdAt: now,
    });
    await ctx.db.patch(args.crId, {
      oocApprovalStatus: "In Progress",
      status: "Pending OOC Approvals",
      disposition: "Pending OOC approvals",
      lastUpdatedAt: now,
    });
    await ctx.db.insert("crUpdates", {
      crId: args.crId,
      author: cleanText(args.author, "Local user"),
      body: `Approval needed from ${approverName}.`,
      kind: "edited",
      createdAt: now,
    });
    return args.crId;
  },
});

export const updateApprovalStatus = mutation({
  args: {
    id: v.id("crApprovals"),
    status: approvalStatus,
    evidenceLocation: v.optional(v.string()),
    author: v.string(),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.id);
    if (!approval) {
      throw new Error("Approval not found.");
    }
    await requireCr(ctx, approval.crId);
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: args.status,
      evidenceLocation:
        args.evidenceLocation === undefined
          ? approval.evidenceLocation
          : cleanText(args.evidenceLocation, ""),
      sentAt: args.status === "Sent" && approval.sentAt === null ? now : approval.sentAt,
      approvedAt: args.status === "Approved" ? now : approval.approvedAt,
    });
    await ctx.db.patch(approval.crId, { lastUpdatedAt: now });
    await ctx.db.insert("crUpdates", {
      crId: approval.crId,
      author: cleanText(args.author, "Local user"),
      body: `${approval.approverName} approval marked ${args.status}.`,
      kind: "edited",
      createdAt: now,
    });
    return approval.crId;
  },
});

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("crs")
      .withIndex("by_isArchived", (q) => q.eq("isArchived", false))
      .take(1);

    if (existing.length > 0) {
      return { inserted: 0, skipped: true };
    }

    const now = Date.now();
    const demo = demoCrs();
    for (const item of demo) {
      const crId = await ctx.db.insert("crs", {
        ...item,
        isArchived: false,
        lastUpdatedAt: now,
      });
      await ctx.db.insert("crUpdates", {
        crId,
        author: "System",
        body: item.status === "Blocked" ? "Imported with blocker." : "Demo CR loaded.",
        kind: "created",
        createdAt: now,
      });
    }

    return { inserted: demo.length, skipped: false };
  },
});

export const assistantContext = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit), 1), 120);
    const crs = await ctx.db
      .query("crs")
      .withIndex("by_isArchived", (q) => q.eq("isArchived", false))
      .order("desc")
      .take(limit);

    const rows = [];
    for (const cr of crs) {
      const updates = await ctx.db
        .query("crUpdates")
        .withIndex("by_crId_and_createdAt", (q) => q.eq("crId", cr._id))
        .order("desc")
        .take(3);
      const actions = await ctx.db
        .query("crActions")
        .withIndex("by_crId_and_createdAt", (q) => q.eq("crId", cr._id))
        .order("desc")
        .take(20);
      const approvals = await ctx.db
        .query("crApprovals")
        .withIndex("by_crId_and_createdAt", (q) => q.eq("crId", cr._id))
        .order("desc")
        .take(20);

      rows.push({
        crNumber: cr.crNumber,
        title: cr.title,
        status: cr.status,
        priority: cr.priority,
        risk: cr.risk,
        category: cr.category,
        owner: cr.owner,
        requester: cr.requester,
        system: cr.system,
        targetDate: cr.targetDate,
        submittedDate: cr.submittedDate,
        description: cr.description,
        businessImpact: cr.businessImpact,
        technicalNotes: cr.technicalNotes,
        tags: cr.tags,
        eccBoard: cr.eccBoard ?? "Other",
        classification: cr.classification ?? "TBD",
        currentGate: cr.currentGate ?? "None",
        meetingDate: cr.meetingDate ?? null,
        documentationDeadline: cr.documentationDeadline ?? null,
        crFolderPath: cr.crFolderPath ?? "",
        wbsChargeNumber: cr.wbsChargeNumber ?? "",
        chargeNumberActive: cr.chargeNumberActive ?? false,
        quorum: cr.quorum ?? [],
        documentationNotificationStatus:
          cr.documentationNotificationStatus ?? "Not Started",
        preMeetingReviewStatus: cr.preMeetingReviewStatus ?? "Not Started",
        meetingAttendanceStatus: cr.meetingAttendanceStatus ?? "Not Started",
        postMeetingPdfStatus: cr.postMeetingPdfStatus ?? "Not Started",
        ncdocStatus: cr.ncdocStatus ?? "Not Started",
        xclassStatus: cr.xclassStatus ?? "Not Started",
        oocApprovalStatus: cr.oocApprovalStatus ?? "Not Started",
        chairApprovalStatus: cr.chairApprovalStatus ?? "Not Started",
        closureNotificationStatus: cr.closureNotificationStatus ?? "Not Started",
        cmWorkingListStatus: cr.cmWorkingListStatus ?? "Not Started",
        waiverOption: cr.waiverOption ?? null,
        designAuthority: cr.designAuthority ?? "",
        disposition: cr.disposition ?? "",
        openActions: actions
          .filter((action) => action.status !== "Closed")
          .map((action) => ({
            gate: action.gate,
            owner: action.owner,
            body: action.body,
            status: action.status,
            dueDate: action.dueDate,
            evidenceLocation: action.evidenceLocation,
          })),
        approvals: approvals.map((approval) => ({
          gate: approval.gate,
          approverName: approval.approverName,
          role: approval.role,
          status: approval.status,
          source: approval.source,
          evidenceLocation: approval.evidenceLocation,
          sentAt: approval.sentAt,
          approvedAt: approval.approvedAt,
        })),
        latestUpdates: updates.map((update) => ({
          body: update.body,
          author: update.author,
          kind: update.kind,
          createdAt: update.createdAt,
        })),
      });
    }

    return {
      generatedAt: Date.now(),
      totalInContext: rows.length,
      crs: rows,
    };
  },
});

async function requireCr(ctx: MutationCtx, id: Id<"crs">) {
  const cr = await ctx.db.get(id);
  if (!cr || cr.isArchived) {
    throw new Error("CR not found.");
  }
  return cr;
}

function cleanText(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function cleanDate(value: string | null) {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function cleanNullableText(value: string | null) {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function cleanTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .slice(0, 12),
    ),
  );
}

function cleanList(items: string[]) {
  return Array.from(
    new Set(
      items
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 30),
    ),
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dateFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

type DemoCr = Omit<
  Doc<"crs">,
  "_id" | "_creationTime" | "isArchived" | "lastUpdatedAt"
>;

function demoCrs(): DemoCr[] {
  return [
    {
      crNumber: "CR-2026-014",
      title: "Replace field inspection intake form",
      status: "Meeting Scheduled",
      priority: "High",
      risk: "Medium",
      category: "Workflow",
      owner: "Nadia Patel",
      requester: "Field Operations",
      system: "Inspection Portal",
      targetDate: dateFromToday(12),
      submittedDate: dateFromToday(-8),
      description:
        "Move the inspection intake from email attachments into a structured web form with required asset and location fields.",
      businessImpact:
        "Reduces rework from missing inspection details and gives dispatch a cleaner queue.",
      technicalNotes:
        "Needs validation for asset identifiers and a CSV export for current downstream reporting.",
      tags: ["inspection", "forms", "ops"],
      eccBoard: "PWES Commercial",
      classification: "Class II",
      currentGate: "CII",
      meetingDate: dateFromToday(3),
      documentationDeadline: dateFromToday(1),
      crFolderPath: "CR-2026-014 - PWES - Inspection Portal",
      wbsChargeNumber: "WBS-014",
      chargeNumberActive: true,
      quorum: ["ECC Chair", "Program Chief", "Design Assurance"],
      documentationNotificationStatus: "Complete",
      preMeetingReviewStatus: "In Progress",
      meetingAttendanceStatus: "Not Started",
      postMeetingPdfStatus: "Not Started",
      ncdocStatus: "Not Started",
      xclassStatus: "Not Started",
      oocApprovalStatus: "Not Started",
      chairApprovalStatus: "Not Started",
      closureNotificationStatus: "Not Started",
      cmWorkingListStatus: "Not Started",
      waiverOption: null,
      designAuthority: "LHSWLPWES",
      disposition: "Meeting scheduled; documentation under coordinator review.",
    },
    {
      crNumber: "CR-2026-017",
      title: "Add emergency override approval path",
      status: "Ready for Review",
      priority: "Critical",
      risk: "High",
      category: "Compliance",
      owner: "Marcus Lee",
      requester: "Regulatory Affairs",
      system: "Change Governance",
      targetDate: dateFromToday(5),
      submittedDate: dateFromToday(-3),
      description:
        "Create a controlled approval path for urgent field changes when the normal review board is not available.",
      businessImpact:
        "Keeps critical work moving while preserving audit evidence for post-incident review.",
      technicalNotes:
        "Requires clear audit fields, approver identity capture, and an after-action review task.",
      tags: ["approval", "audit", "urgent"],
      eccBoard: "EC&A",
      classification: "Class I",
      currentGate: "G1",
      meetingDate: dateFromToday(5),
      documentationDeadline: dateFromToday(3),
      crFolderPath: "CR-2026-017 - EC&A - Change Governance",
      wbsChargeNumber: "WBS-017",
      chargeNumberActive: true,
      quorum: ["ECC Chair", "Contracts", "Program Chief", "Value Stream Leader"],
      documentationNotificationStatus: "Complete",
      preMeetingReviewStatus: "Complete",
      meetingAttendanceStatus: "Not Started",
      postMeetingPdfStatus: "Not Started",
      ncdocStatus: "Not Started",
      xclassStatus: "Not Started",
      oocApprovalStatus: "Not Started",
      chairApprovalStatus: "Not Started",
      closureNotificationStatus: "Not Started",
      cmWorkingListStatus: "Not Started",
      waiverOption: null,
      designAuthority: "LHSWLGEAI",
      disposition: "Ready for Gate 1 review.",
    },
    {
      crNumber: "CR-2026-021",
      title: "Revise transformer replacement schedule logic",
      status: "Held for Actions",
      priority: "High",
      risk: "High",
      category: "Scheduling",
      owner: "Avery Chen",
      requester: "Asset Planning",
      system: "Work Planner",
      targetDate: dateFromToday(2),
      submittedDate: dateFromToday(-11),
      description:
        "Adjust schedule rules so transformer replacements consider crew certification, outage windows, and procurement lead time.",
      businessImpact:
        "Prevents schedule churn and reduces the risk of crew assignments that cannot be executed.",
      technicalNotes:
        "Blocked until procurement confirms the latest material lead-time feed format.",
      tags: ["planning", "procurement", "blocked"],
      eccBoard: "PWES Military",
      classification: "Class I",
      currentGate: "G3",
      meetingDate: dateFromToday(-2),
      documentationDeadline: dateFromToday(-4),
      crFolderPath: "CR-2026-021 - PWES Military - Work Planner",
      wbsChargeNumber: "WBS-021",
      chargeNumberActive: true,
      quorum: ["ECC Chair", "Supply Chain", "Program Chief"],
      documentationNotificationStatus: "Complete",
      preMeetingReviewStatus: "Complete",
      meetingAttendanceStatus: "Complete",
      postMeetingPdfStatus: "Complete",
      ncdocStatus: "In Progress",
      xclassStatus: "Not Started",
      oocApprovalStatus: "Blocked",
      chairApprovalStatus: "Not Started",
      closureNotificationStatus: "Not Started",
      cmWorkingListStatus: "Not Started",
      waiverOption: null,
      designAuthority: "LHSWLKEECS",
      disposition: "Held for actions; procurement evidence required before OOC approvals.",
    },
    {
      crNumber: "CR-2026-025",
      title: "Expose CR health rollup for weekly review",
      status: "Pending OOC Approvals",
      priority: "Medium",
      risk: "Low",
      category: "Reporting",
      owner: "Sofia Romero",
      requester: "PMO",
      system: "Leadership Dashboard",
      targetDate: dateFromToday(18),
      submittedDate: dateFromToday(-14),
      description:
        "Add a weekly rollup of open CRs by status, owner, due date, and risk rating.",
      businessImpact:
        "Gives project leads a fast way to spot aging requests and unblock owners.",
      technicalNotes:
        "Current export works; validating date grouping and status labels.",
      tags: ["reporting", "pmo"],
      eccBoard: "P&C",
      classification: "Class II",
      currentGate: "P&C",
      meetingDate: dateFromToday(-1),
      documentationDeadline: dateFromToday(-3),
      crFolderPath: "CR-2026-025 - P&C - Leadership Dashboard",
      wbsChargeNumber: "WBS-025",
      chargeNumberActive: true,
      quorum: ["ECC Chair", "PMO", "Program Chief"],
      documentationNotificationStatus: "Complete",
      preMeetingReviewStatus: "Complete",
      meetingAttendanceStatus: "Complete",
      postMeetingPdfStatus: "Complete",
      ncdocStatus: "Complete",
      xclassStatus: "In Progress",
      oocApprovalStatus: "In Progress",
      chairApprovalStatus: "Not Started",
      closureNotificationStatus: "Not Started",
      cmWorkingListStatus: "Not Applicable",
      waiverOption: null,
      designAuthority: "LHSRKEPS",
      disposition: "Pending OOC approvals and xClass completion.",
    },
  ];
}
