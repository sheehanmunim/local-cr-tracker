import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { MutationCtx, mutation, query } from "./_generated/server";

const crStatus = v.union(
  v.literal("Intake"),
  v.literal("Review"),
  v.literal("Approved"),
  v.literal("In Progress"),
  v.literal("Blocked"),
  v.literal("Testing"),
  v.literal("Implemented"),
  v.literal("Rejected"),
);

const priority = v.union(
  v.literal("Low"),
  v.literal("Medium"),
  v.literal("High"),
  v.literal("Critical"),
);

const risk = v.union(v.literal("Low"), v.literal("Medium"), v.literal("High"));

const statusFilter = v.union(
  v.literal("All"),
  v.literal("Intake"),
  v.literal("Review"),
  v.literal("Approved"),
  v.literal("In Progress"),
  v.literal("Blocked"),
  v.literal("Testing"),
  v.literal("Implemented"),
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
      status: "In Progress",
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
    },
    {
      crNumber: "CR-2026-017",
      title: "Add emergency override approval path",
      status: "Review",
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
    },
    {
      crNumber: "CR-2026-021",
      title: "Revise transformer replacement schedule logic",
      status: "Blocked",
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
    },
    {
      crNumber: "CR-2026-025",
      title: "Expose CR health rollup for weekly review",
      status: "Testing",
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
    },
  ];
}
