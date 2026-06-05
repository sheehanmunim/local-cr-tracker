import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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

export default defineSchema({
  crs: defineTable({
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
    isArchived: v.boolean(),
    lastUpdatedAt: v.number(),
  })
    .index("by_crNumber", ["crNumber"])
    .index("by_isArchived", ["isArchived"])
    .index("by_isArchived_and_status", ["isArchived", "status"])
    .index("by_isArchived_and_priority", ["isArchived", "priority"])
    .index("by_isArchived_and_owner", ["isArchived", "owner"]),
  crUpdates: defineTable({
    crId: v.id("crs"),
    author: v.string(),
    body: v.string(),
    kind: v.union(
      v.literal("note"),
      v.literal("status"),
      v.literal("created"),
      v.literal("edited"),
    ),
    createdAt: v.number(),
  }).index("by_crId_and_createdAt", ["crId", "createdAt"]),
});
