"use client";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Archive,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Download,
  Loader2,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Cr = Doc<"crs">;
type CrUpdate = Doc<"crUpdates">;
type CrAction = Doc<"crActions">;
type CrApproval = Doc<"crApprovals">;
type CrId = Id<"crs">;
type CrActionId = Id<"crActions">;
type CrApprovalId = Id<"crApprovals">;
type CrStatus = Cr["status"];
type Priority = Cr["priority"];
type Risk = Cr["risk"];
type EccBoard = NonNullable<Cr["eccBoard"]>;
type CrClassification = NonNullable<Cr["classification"]>;
type ReviewGate = NonNullable<Cr["currentGate"]>;
type TaskState = NonNullable<Cr["documentationNotificationStatus"]>;
type ActionStatus = CrAction["status"];
type ApprovalStatus = CrApproval["status"];
type ApprovalSource = CrApproval["source"];
type StatusFilter = CrStatus | "All";

type CrFormState = {
  crNumber: string;
  title: string;
  status: CrStatus;
  priority: Priority;
  risk: Risk;
  category: string;
  owner: string;
  requester: string;
  system: string;
  targetDate: string;
  submittedDate: string;
  description: string;
  businessImpact: string;
  technicalNotes: string;
  tagsInput: string;
  eccBoard: EccBoard;
  classification: CrClassification;
  currentGate: ReviewGate;
  meetingDate: string;
  documentationDeadline: string;
  crFolderPath: string;
  wbsChargeNumber: string;
  chargeNumberActive: boolean;
  quorumInput: string;
  documentationNotificationStatus: TaskState;
  preMeetingReviewStatus: TaskState;
  meetingAttendanceStatus: TaskState;
  postMeetingPdfStatus: TaskState;
  ncdocStatus: TaskState;
  xclassStatus: TaskState;
  oocApprovalStatus: TaskState;
  chairApprovalStatus: TaskState;
  closureNotificationStatus: TaskState;
  cmWorkingListStatus: TaskState;
  waiverOption: string;
  designAuthority: string;
  disposition: string;
};

type ActionFormState = {
  gate: ReviewGate;
  owner: string;
  body: string;
  dueDate: string;
  evidenceLocation: string;
};

type ApprovalFormState = {
  gate: ReviewGate;
  approverName: string;
  role: string;
  source: ApprovalSource;
  evidenceLocation: string;
};

type AssistantMessage = {
  role: "assistant" | "user";
  content: string;
};

const statuses: CrStatus[] = [
  "Intake",
  "Documentation Pending",
  "Ready for Review",
  "Meeting Scheduled",
  "Review",
  "Approved",
  "Approved w/Actions",
  "In Progress",
  "Blocked",
  "Held for Actions",
  "Pending OOC Approvals",
  "Testing",
  "Implemented",
  "Waiver Processing",
  "NCDOC/xClass",
  "CM Working List",
  "Closed",
  "Rejected",
];

const priorities: Priority[] = ["Low", "Medium", "High", "Critical"];
const risks: Risk[] = ["Low", "Medium", "High"];
const eccBoards: EccBoard[] = [
  "PWES Commercial",
  "PWES Military",
  "EC&A",
  "P&C",
  "Other",
];
const classifications: CrClassification[] = [
  "TBD",
  "Class Concurrence",
  "Class I",
  "Class II",
  "Waiver",
  "Admin/NonTech",
];
const reviewGates: ReviewGate[] = [
  "None",
  "CC",
  "CII",
  "G1",
  "G2",
  "G3",
  "G4",
  "P&C",
  "Waiver",
  "Delta Review",
];
const taskStates: TaskState[] = [
  "Not Started",
  "In Progress",
  "Complete",
  "Blocked",
  "Not Applicable",
];
const actionStatuses: ActionStatus[] = ["Open", "Closed", "Not Holding"];
const approvalStatuses: ApprovalStatus[] = [
  "Needed",
  "Sent",
  "Approved",
  "Rejected",
  "Not Required",
];
const approvalSources: ApprovalSource[] = [
  "SharePoint",
  "Email",
  "Chair",
  "Program",
  "Other",
];

const statusTone: Record<CrStatus, string> = {
  Intake: "border-[#cbd5d1] bg-[#eef2f0] text-[#33413e]",
  "Documentation Pending": "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
  "Ready for Review": "border-[#86efac] bg-[#ecfdf3] text-[#166534]",
  "Meeting Scheduled": "border-[#67e8f9] bg-[#ecfeff] text-[#155e75]",
  Review: "border-[#a5b4fc] bg-[#eef2ff] text-[#3730a3]",
  Approved: "border-[#86efac] bg-[#ecfdf3] text-[#166534]",
  "Approved w/Actions": "border-[#bef264] bg-[#f7fee7] text-[#3f6212]",
  "In Progress": "border-[#67e8f9] bg-[#ecfeff] text-[#155e75]",
  Blocked: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
  "Held for Actions": "border-[#fecaca] bg-[#fff1f2] text-[#be123c]",
  "Pending OOC Approvals": "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
  Testing: "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
  Implemented: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  "Waiver Processing": "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]",
  "NCDOC/xClass": "border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1]",
  "CM Working List": "border-[#c7d2fe] bg-[#eef2ff] text-[#4338ca]",
  Closed: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  Rejected: "border-[#d6d3d1] bg-[#f5f5f4] text-[#57534e]",
};

const priorityTone: Record<Priority, string> = {
  Low: "border-[#cbd5d1] bg-white text-[#596466]",
  Medium: "border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1]",
  High: "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
  Critical: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
};

const riskTone: Record<Risk, string> = {
  Low: "text-[#15803d]",
  Medium: "text-[#b45309]",
  High: "text-[#b91c1c]",
};

export function CrTrackerApp() {
  const crs = useQuery(api.crs.list, { status: "All" });
  const seedDemoData = useMutation(api.crs.seedDemoData);
  const createCr = useMutation(api.crs.create);
  const [selectedId, setSelectedId] = useState<CrId | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [riskFilter, setRiskFilter] = useState<Risk | "All">("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const owners = useMemo(() => {
    const source = crs ?? [];
    return Array.from(new Set(source.map((cr) => cr.owner))).sort();
  }, [crs]);

  const filteredCrs = useMemo(() => {
    const source = crs ?? [];
    const term = search.trim().toLowerCase();
    return source.filter((cr) => {
      const matchesStatus = statusFilter === "All" || cr.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || cr.priority === priorityFilter;
      const matchesRisk = riskFilter === "All" || cr.risk === riskFilter;
      const matchesOwner = ownerFilter === "All" || cr.owner === ownerFilter;
      const haystack = [
        cr.crNumber,
        cr.title,
        cr.description,
        cr.businessImpact,
        cr.technicalNotes,
        cr.owner,
        cr.requester,
        cr.system,
        cr.category,
        cr.eccBoard ?? "",
        cr.classification ?? "",
        cr.currentGate ?? "",
        cr.disposition ?? "",
        cr.wbsChargeNumber ?? "",
        cr.designAuthority ?? "",
        cr.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        matchesPriority &&
        matchesRisk &&
        matchesOwner &&
        (!term || haystack.includes(term))
      );
    });
  }, [crs, ownerFilter, priorityFilter, riskFilter, search, statusFilter]);

  const selectedCr =
    (selectedId && filteredCrs.find((cr) => cr._id === selectedId)) ??
    filteredCrs[0] ??
    null;

  const stats = useMemo(() => buildStats(crs ?? []), [crs]);

  async function handleSeed() {
    setNotice("");
    const result = await seedDemoData({});
    setNotice(
      result.skipped
        ? "Seed skipped because CRs already exist."
        : `Loaded ${result.inserted} demo CRs.`,
    );
  }

  function handleExport() {
    const payload = JSON.stringify(filteredCrs, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cr-tracker-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-[#1d2224]">
      <header className="border-b border-[#d7dfda] bg-white">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-[#0f766e]">
              <CircleDot className="h-3.5 w-3.5" />
              Local change control
            </div>
            <h1 className="text-2xl font-semibold tracking-normal">
              CR Control Room
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-[#596466]">
              Track change requests, owner risk, due dates, and update history
              with a local Convex backend and a local Qwen assistant.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {notice ? (
              <span className="rounded-md border border-[#d7dfda] bg-[#f8faf9] px-3 py-2 text-xs text-[#596466]">
                {notice}
              </span>
            ) : null}
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={handleSeed}>
              <Sparkles className="h-4 w-4" />
              Seed Demo
            </Button>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4" />
              New CR
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1680px] gap-4 px-4 py-4 lg:px-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          <MetricStrip stats={stats} />
          <FilterBar
            owners={owners}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            riskFilter={riskFilter}
            ownerFilter={ownerFilter}
            search={search}
            onStatusFilterChange={setStatusFilter}
            onPriorityFilterChange={setPriorityFilter}
            onRiskFilterChange={setRiskFilter}
            onOwnerFilterChange={setOwnerFilter}
            onSearchChange={setSearch}
          />

          {isCreating ? (
            <NewCrPanel
              createCr={createCr}
              onCreated={(id) => {
                setIsCreating(false);
                setSelectedId(id);
                setNotice("CR created.");
              }}
              onCancel={() => setIsCreating(false)}
            />
          ) : null}

          <section className="grid gap-4 min-[1180px]:grid-cols-[420px_minmax(0,1fr)]">
            <CrList
              crs={filteredCrs}
              loading={!crs}
              selectedId={selectedCr?._id ?? null}
              onSelect={setSelectedId}
            />
            <CrDetails key={selectedCr?._id ?? "empty"} cr={selectedCr} />
          </section>
        </div>

        <AssistantPanel selectedCr={selectedCr} />
      </main>
    </div>
  );
}

function MetricStrip({ stats }: { stats: ReturnType<typeof buildStats> }) {
  const metrics = [
    {
      label: "Open",
      value: stats.open,
      detail: `${stats.total} total active`,
      tone: "bg-[#0f766e]",
      icon: CircleDot,
    },
    {
      label: "Blocked",
      value: stats.blocked,
      detail: "Needs intervention",
      tone: "bg-[#dc2626]",
      icon: AlertTriangle,
    },
    {
      label: "Due Soon",
      value: stats.dueSoon,
      detail: "Next 14 days",
      tone: "bg-[#d97706]",
      icon: CalendarClock,
    },
    {
      label: "High Risk",
      value: stats.highRisk,
      detail: "Risk marked high",
      tone: "bg-[#4f46e5]",
      icon: SlidersHorizontal,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="rounded-lg border border-[#d7dfda] bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-[#596466]">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                <p className="mt-1 text-xs text-[#596466]">{metric.detail}</p>
              </div>
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md text-white",
                  metric.tone,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function FilterBar({
  owners,
  statusFilter,
  priorityFilter,
  riskFilter,
  ownerFilter,
  search,
  onStatusFilterChange,
  onPriorityFilterChange,
  onRiskFilterChange,
  onOwnerFilterChange,
  onSearchChange,
}: {
  owners: string[];
  statusFilter: StatusFilter;
  priorityFilter: Priority | "All";
  riskFilter: Risk | "All";
  ownerFilter: string;
  search: string;
  onStatusFilterChange: (value: StatusFilter) => void;
  onPriorityFilterChange: (value: Priority | "All") => void;
  onRiskFilterChange: (value: Risk | "All") => void;
  onOwnerFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}) {
  return (
    <section className="rounded-lg border border-[#d7dfda] bg-white p-3 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(120px,170px))]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#7c8788]" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="pl-9"
            placeholder="Search CRs, systems, owners, tags"
          />
        </label>
        <Select
          label="Status"
          value={statusFilter}
          onChange={(value) => onStatusFilterChange(value as StatusFilter)}
          options={["All", ...statuses]}
        />
        <Select
          label="Priority"
          value={priorityFilter}
          onChange={(value) => onPriorityFilterChange(value as Priority | "All")}
          options={["All", ...priorities]}
        />
        <Select
          label="Risk"
          value={riskFilter}
          onChange={(value) => onRiskFilterChange(value as Risk | "All")}
          options={["All", ...risks]}
        />
        <Select
          label="Owner"
          value={ownerFilter}
          onChange={onOwnerFilterChange}
          options={["All", ...owners]}
        />
      </div>
    </section>
  );
}

function NewCrPanel({
  createCr,
  onCreated,
  onCancel,
}: {
  createCr: ReturnType<typeof useMutation<typeof api.crs.create>>;
  onCreated: (id: CrId) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CrFormState>(() => defaultCrForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const id = await createCr(formToCreateArgs(form));
      onCreated(id);
      setForm(defaultCrForm());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create CR.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#b9d8d3] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">New CR</h2>
          <p className="text-sm text-[#596466]">
            Capture the request, impact, risk, owner, and target date.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} title="Close form">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <CrForm
        form={form}
        setForm={setForm}
        error={error}
        saving={saving}
        submitLabel="Create CR"
        onSubmit={handleSubmit}
      />
    </section>
  );
}

function CrList({
  crs,
  loading,
  selectedId,
  onSelect,
}: {
  crs: Cr[];
  loading: boolean;
  selectedId: CrId | null;
  onSelect: (id: CrId) => void;
}) {
  return (
    <section className="min-h-[520px] rounded-lg border border-[#d7dfda] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#d7dfda] px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">Change Requests</h2>
          <p className="text-xs text-[#596466]">{crs.length} shown</p>
        </div>
        <RefreshCw
          className={cn("h-4 w-4 text-[#7c8788]", loading && "animate-spin")}
        />
      </div>
      <div className="divide-y divide-[#e5ebe8]">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-[#596466]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading CRs
          </div>
        ) : null}
        {!loading && crs.length === 0 ? (
          <div className="p-6 text-sm text-[#596466]">
            No CRs match the current filters.
          </div>
        ) : null}
        {crs.map((cr) => (
          <button
            key={cr._id}
            onClick={() => onSelect(cr._id)}
            className={cn(
              "block w-full px-4 py-3 text-left transition hover:bg-[#f8faf9]",
              selectedId === cr._id && "bg-[#eef8f7]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#0f766e]">
                    {cr.crNumber}
                  </span>
                  <Badge className={statusTone[cr.status]}>{cr.status}</Badge>
                </div>
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold">
                  {cr.title}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={priorityTone[cr.priority]}>{cr.priority}</Badge>
                <span className="text-xs text-[#596466]">
                  {cr.currentGate ?? "No gate"}
                </span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-[#596466] sm:grid-cols-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{cr.owner}</span>
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{dueLabel(cr)}</span>
              </span>
              <span className="truncate sm:col-span-2">
                {(cr.eccBoard ?? "Other") + " / " + (cr.classification ?? "TBD")}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function CrDetails({ cr }: { cr: Cr | null }) {
  const updateCr = useMutation(api.crs.update);
  const addUpdate = useMutation(api.crs.addUpdate);
  const archiveCr = useMutation(api.crs.archive);
  const addAction = useMutation(api.crs.addAction);
  const updateActionStatus = useMutation(api.crs.updateActionStatus);
  const addApproval = useMutation(api.crs.addApproval);
  const updateApprovalStatus = useMutation(api.crs.updateApprovalStatus);
  const updates = useQuery(
    api.crs.listUpdates,
    cr ? { crId: cr._id } : "skip",
  );
  const actions = useQuery(
    api.crs.listActions,
    cr ? { crId: cr._id } : "skip",
  );
  const approvals = useQuery(
    api.crs.listApprovals,
    cr ? { crId: cr._id } : "skip",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<CrFormState>(() =>
    cr ? formFromCr(cr) : defaultCrForm(),
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!cr) {
    return (
      <section className="rounded-lg border border-[#d7dfda] bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold">CR Detail</h2>
        <p className="mt-2 text-sm text-[#596466]">
          Select a CR or create a new one to see details here.
        </p>
      </section>
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cr) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateCr({
        id: cr._id,
        ...formToUpdateArgs(form),
      });
      setIsEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save CR.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!cr || !note.trim()) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      await addUpdate({ crId: cr._id, author: "Local user", body: note });
      setNote("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add note.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!cr) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      await archiveCr({ id: cr._id, author: "Local user" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to archive CR.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#d7dfda] bg-white shadow-sm">
      <div className="border-b border-[#d7dfda] px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#0f766e]">
                {cr.crNumber}
              </span>
              <Badge className={statusTone[cr.status]}>{cr.status}</Badge>
              <Badge className={priorityTone[cr.priority]}>{cr.priority}</Badge>
              <Badge className="border-[#cbd5d1] bg-white text-[#33413e]">
                {cr.eccBoard ?? "Other"}
              </Badge>
              <Badge className="border-[#cbd5d1] bg-white text-[#33413e]">
                {cr.classification ?? "TBD"} / {cr.currentGate ?? "None"}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold">{cr.title}</h2>
            <p className="mt-1 text-sm text-[#596466]">
              {cr.system} / {cr.category}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing((value) => !value)}
            >
              {isEditing ? (
                <X className="h-4 w-4" />
              ) : (
                <SlidersHorizontal className="h-4 w-4" />
              )}
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {isEditing ? (
          <CrForm
            form={form}
            setForm={setForm}
            error={error}
            saving={saving}
            submitLabel="Save changes"
            onSubmit={handleSave}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Info label="Owner" value={cr.owner} />
              <Info label="Requester" value={cr.requester} />
              <Info label="Meeting" value={cr.meetingDate ?? "No date"} />
              <Info label="Doc Deadline" value={cr.documentationDeadline ?? "No date"} />
              <Info label="Target" value={cr.targetDate ?? "No date"} />
              <Info label="Risk" value={cr.risk} valueClassName={riskTone[cr.risk]} />
              <Info label="WBS Active" value={cr.chargeNumberActive ? "Yes" : "No"} />
              <Info label="Disposition" value={cr.disposition ?? "Not set"} />
            </div>
            <WorkflowSummary cr={cr} />
            <TextBlock label="Description" value={cr.description} />
            <TextBlock label="Business Impact" value={cr.businessImpact} />
            <TextBlock label="Technical Notes" value={cr.technicalNotes} />
            <TextBlock label="CR Folder Path" value={cr.crFolderPath ?? "Not set"} />
            <TextBlock
              label="Quorum / Approvers"
              value={(cr.quorum ?? []).join(", ") || "Not set"}
            />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-[#596466]">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {cr.tags.length > 0 ? (
                  cr.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-[#d7dfda] bg-[#f8faf9] px-2 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#596466]">No tags</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-[#e5ebe8] pt-4">
          <ActionsApprovalsPanel
            cr={cr}
            actions={actions ?? []}
            approvals={approvals ?? []}
            loading={!actions || !approvals}
            addAction={addAction}
            updateActionStatus={updateActionStatus}
            addApproval={addApproval}
            updateApprovalStatus={updateApprovalStatus}
            onError={setError}
          />
        </div>

        <div className="mt-6 border-t border-[#e5ebe8] pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Update Notes</h3>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#0f766e]" />
            ) : null}
          </div>
          <div className="flex gap-2">
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a note, blocker, or decision"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleAddNote();
                }
              }}
            />
            <Button onClick={handleAddNote} disabled={!note.trim() || saving}>
              <MessageSquarePlus className="h-4 w-4" />
              Add
            </Button>
          </div>
          {error ? <p className="mt-2 text-sm text-[#b91c1c]">{error}</p> : null}
          <div className="mt-4 space-y-3">
            {!updates ? (
              <p className="text-sm text-[#596466]">Loading updates...</p>
            ) : null}
            {updates?.map((update) => (
              <UpdateItem key={update._id} update={update} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowSummary({ cr }: { cr: Cr }) {
  const milestones: Array<[string, TaskState]> = [
    ["Doc Notify", cr.documentationNotificationStatus ?? "Not Started"],
    ["Pre-Meeting", cr.preMeetingReviewStatus ?? "Not Started"],
    ["Attendance", cr.meetingAttendanceStatus ?? "Not Started"],
    ["PDFs", cr.postMeetingPdfStatus ?? "Not Started"],
    ["NCDOC", cr.ncdocStatus ?? "Not Started"],
    ["xClass", cr.xclassStatus ?? "Not Started"],
    ["OOC", cr.oocApprovalStatus ?? "Not Started"],
    ["Chair", cr.chairApprovalStatus ?? "Not Started"],
    ["Closure", cr.closureNotificationStatus ?? "Not Started"],
    ["CM List", cr.cmWorkingListStatus ?? "Not Started"],
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase text-[#596466]">
        ECC Workflow
      </p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {milestones.map(([label, state]) => (
          <div
            key={label}
            className="rounded-md border border-[#d7dfda] bg-[#f8faf9] p-2"
          >
            <p className="text-[11px] font-semibold uppercase text-[#596466]">
              {label}
            </p>
            <p className={cn("mt-1 text-xs font-medium", taskStateTone(state))}>
              {state}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Info label="WBS" value={cr.wbsChargeNumber ?? "Not set"} />
        <Info label="Design Authority" value={cr.designAuthority ?? "Not set"} />
        <Info label="Waiver Option" value={cr.waiverOption ?? "Not applicable"} />
        <Info label="Updated" value={formatTimestamp(cr.lastUpdatedAt)} />
      </div>
    </div>
  );
}

function ActionsApprovalsPanel({
  cr,
  actions,
  approvals,
  loading,
  addAction,
  updateActionStatus,
  addApproval,
  updateApprovalStatus,
  onError,
}: {
  cr: Cr;
  actions: CrAction[];
  approvals: CrApproval[];
  loading: boolean;
  addAction: ReturnType<typeof useMutation<typeof api.crs.addAction>>;
  updateActionStatus: ReturnType<
    typeof useMutation<typeof api.crs.updateActionStatus>
  >;
  addApproval: ReturnType<typeof useMutation<typeof api.crs.addApproval>>;
  updateApprovalStatus: ReturnType<
    typeof useMutation<typeof api.crs.updateApprovalStatus>
  >;
  onError: (message: string) => void;
}) {
  const [actionForm, setActionForm] = useState<ActionFormState>(() => ({
    gate: cr.currentGate ?? "None",
    owner: "IPT",
    body: "",
    dueDate: "",
    evidenceLocation: "",
  }));
  const [approvalForm, setApprovalForm] = useState<ApprovalFormState>(() => ({
    gate: cr.currentGate ?? "None",
    approverName: "",
    role: "Quorum",
    source: "SharePoint",
    evidenceLocation: "",
  }));
  const [saving, setSaving] = useState(false);

  async function handleAddAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!actionForm.body.trim()) {
      return;
    }
    setSaving(true);
    onError("");
    try {
      await addAction({
        crId: cr._id,
        gate: actionForm.gate,
        owner: actionForm.owner,
        body: actionForm.body,
        dueDate: actionForm.dueDate || null,
        evidenceLocation: actionForm.evidenceLocation,
        author: "Local user",
      });
      setActionForm({
        gate: cr.currentGate ?? "None",
        owner: "IPT",
        body: "",
        dueDate: "",
        evidenceLocation: "",
      });
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Unable to add action.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActionStatus(id: CrActionId, status: ActionStatus) {
    setSaving(true);
    onError("");
    try {
      await updateActionStatus({ id, status, author: "Local user" });
    } catch (caught) {
      onError(
        caught instanceof Error ? caught.message : "Unable to update action.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAddApproval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!approvalForm.approverName.trim()) {
      return;
    }
    setSaving(true);
    onError("");
    try {
      await addApproval({
        crId: cr._id,
        gate: approvalForm.gate,
        approverName: approvalForm.approverName,
        role: approvalForm.role,
        source: approvalForm.source,
        evidenceLocation: approvalForm.evidenceLocation,
        author: "Local user",
      });
      setApprovalForm({
        gate: cr.currentGate ?? "None",
        approverName: "",
        role: "Quorum",
        source: "SharePoint",
        evidenceLocation: "",
      });
    } catch (caught) {
      onError(
        caught instanceof Error ? caught.message : "Unable to add approval.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleApprovalStatus(
    id: CrApprovalId,
    status: ApprovalStatus,
  ) {
    setSaving(true);
    onError("");
    try {
      await updateApprovalStatus({ id, status, author: "Local user" });
    } catch (caught) {
      onError(
        caught instanceof Error ? caught.message : "Unable to update approval.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Actions and OOC Approvals</h3>
        {loading || saving ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#0f766e]" />
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-[#d7dfda] p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Open Actions</p>
            <span className="text-xs text-[#596466]">
              {actions.filter((action) => action.status !== "Closed").length} open
            </span>
          </div>
          <form onSubmit={handleAddAction} className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
              <Select
                label="Gate"
                value={actionForm.gate}
                options={reviewGates}
                onChange={(value) =>
                  setActionForm({ ...actionForm, gate: value as ReviewGate })
                }
              />
              <Field
                label="Owner"
                value={actionForm.owner}
                onChange={(value) =>
                  setActionForm({ ...actionForm, owner: value })
                }
              />
            </div>
            <Field
              label="Action"
              value={actionForm.body}
              onChange={(value) => setActionForm({ ...actionForm, body: value })}
              placeholder="Evidence needed before next gate/OOC"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Field
                label="Due"
                type="date"
                value={actionForm.dueDate}
                onChange={(value) =>
                  setActionForm({ ...actionForm, dueDate: value })
                }
              />
              <Field
                label="Evidence"
                value={actionForm.evidenceLocation}
                onChange={(value) =>
                  setActionForm({ ...actionForm, evidenceLocation: value })
                }
                placeholder="Folder path or note"
              />
            </div>
            <Button type="submit" size="sm" disabled={saving || !actionForm.body.trim()}>
              <Plus className="h-4 w-4" />
              Add Action
            </Button>
          </form>
          <div className="mt-3 space-y-2">
            {actions.length === 0 ? (
              <p className="text-sm text-[#596466]">No actions recorded.</p>
            ) : null}
            {actions.map((action) => (
              <div key={action._id} className="rounded-md bg-[#f8faf9] p-3 text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge className="border-[#cbd5d1] bg-white text-[#33413e]">
                    {action.gate}
                  </Badge>
                  <span className={taskStateTone(action.status)}>{action.status}</span>
                  <span className="text-xs text-[#596466]">{action.owner}</span>
                </div>
                <p>{action.body}</p>
                <p className="mt-1 text-xs text-[#596466]">
                  Due: {action.dueDate ?? "None"} / Evidence:{" "}
                  {action.evidenceLocation || "Not set"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {actionStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => void handleActionStatus(action._id, status)}
                      className="rounded-md border border-[#d7dfda] bg-white px-2 py-1 text-xs hover:border-[#0f766e]"
                      type="button"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#d7dfda] p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Approvals</p>
            <span className="text-xs text-[#596466]">
              {
                approvals.filter(
                  (approval) =>
                    approval.status !== "Approved" &&
                    approval.status !== "Not Required",
                ).length
              }{" "}
              pending
            </span>
          </div>
          <form onSubmit={handleAddApproval} className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
              <Select
                label="Gate"
                value={approvalForm.gate}
                options={reviewGates}
                onChange={(value) =>
                  setApprovalForm({
                    ...approvalForm,
                    gate: value as ReviewGate,
                  })
                }
              />
              <Field
                label="Approver"
                value={approvalForm.approverName}
                onChange={(value) =>
                  setApprovalForm({ ...approvalForm, approverName: value })
                }
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field
                label="Role"
                value={approvalForm.role}
                onChange={(value) =>
                  setApprovalForm({ ...approvalForm, role: value })
                }
              />
              <Select
                label="Source"
                value={approvalForm.source}
                options={approvalSources}
                onChange={(value) =>
                  setApprovalForm({
                    ...approvalForm,
                    source: value as ApprovalSource,
                  })
                }
              />
            </div>
            <Field
              label="Evidence"
              value={approvalForm.evidenceLocation}
              onChange={(value) =>
                setApprovalForm({ ...approvalForm, evidenceLocation: value })
              }
              placeholder="Workflow image, email, or folder path"
            />
            <Button
              type="submit"
              size="sm"
              disabled={saving || !approvalForm.approverName.trim()}
            >
              <Plus className="h-4 w-4" />
              Add Approval
            </Button>
          </form>
          <div className="mt-3 space-y-2">
            {approvals.length === 0 ? (
              <p className="text-sm text-[#596466]">No approvals recorded.</p>
            ) : null}
            {approvals.map((approval) => (
              <div
                key={approval._id}
                className="rounded-md bg-[#f8faf9] p-3 text-sm"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge className="border-[#cbd5d1] bg-white text-[#33413e]">
                    {approval.gate}
                  </Badge>
                  <span className={taskStateTone(approval.status)}>
                    {approval.status}
                  </span>
                  <span className="text-xs text-[#596466]">
                    {approval.source}
                  </span>
                </div>
                <p className="font-medium">{approval.approverName}</p>
                <p className="text-xs text-[#596466]">
                  {approval.role} / Evidence: {approval.evidenceLocation || "Not set"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {approvalStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        void handleApprovalStatus(approval._id, status)
                      }
                      className="rounded-md border border-[#d7dfda] bg-white px-2 py-1 text-xs hover:border-[#0f766e]"
                      type="button"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistantPanel({ selectedCr }: { selectedCr: Cr | null }) {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "Ask about open CRs, blockers, due dates, owner load, or risk. I will answer from the local Convex data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const [model, setModel] = useState("qwen3:latest");

  async function ask(content: string) {
    const prompt = content.trim();
    if (!prompt || asking) {
      return;
    }
    const nextMessages: AssistantMessage[] = [
      ...messages,
      { role: "user", content: prompt },
    ];
    setMessages(nextMessages);
    setInput("");
    setAsking(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-10),
          selectedCrNumber: selectedCr?.crNumber ?? null,
        }),
      });
      const data = (await response.json()) as {
        answer?: string;
        error?: string;
        model?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "The local assistant could not answer.");
      }
      setModel(data.model ?? model);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.answer ?? "I did not receive an answer from Ollama.",
        },
      ]);
    } catch (caught) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            caught instanceof Error
              ? caught.message
              : "The local assistant could not answer.",
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  const quickPrompts = [
    "Which CRs are blocked or high risk?",
    "What should I review first today?",
    "Summarize CR ownership and due-date risk.",
  ];

  return (
    <aside className="flex max-h-[calc(100vh-112px)] min-h-[680px] flex-col rounded-lg border border-[#d7dfda] bg-white shadow-sm xl:sticky xl:top-4">
      <div className="border-b border-[#d7dfda] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0f766e] text-white">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Local Qwen Assistant</h2>
              <p className="text-xs text-[#596466]">Ollama model: {model}</p>
            </div>
          </div>
          {asking ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#0f766e]" />
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => void ask(prompt)}
              className="rounded-md border border-[#d7dfda] bg-[#f8faf9] px-2.5 py-1.5 text-left text-xs text-[#33413e] transition hover:border-[#0f766e] hover:text-[#0f766e]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={cn(
              "rounded-lg border p-3 text-sm leading-relaxed",
              message.role === "user"
                ? "ml-8 border-[#b9d8d3] bg-[#eef8f7]"
                : "mr-8 border-[#d7dfda] bg-[#f8faf9]",
            )}
          >
            <p className="mb-1 text-xs font-semibold uppercase text-[#596466]">
              {message.role === "user" ? "You" : "Qwen"}
            </p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-[#d7dfda] p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about these CRs"
          />
          <Button type="submit" disabled={!input.trim() || asking}>
            {asking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Ask
          </Button>
        </div>
      </form>
    </aside>
  );
}

function CrForm({
  form,
  setForm,
  error,
  saving,
  submitLabel,
  onSubmit,
}: {
  form: CrFormState;
  setForm: (form: CrFormState) => void;
  error: string;
  saving: boolean;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function updateField<Key extends keyof CrFormState>(
    key: Key,
    value: CrFormState[Key],
  ) {
    setForm({ ...form, [key]: value });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field
          label="CR Number"
          value={form.crNumber}
          onChange={(value) => updateField("crNumber", value)}
          required
        />
        <Field
          label="Title"
          value={form.title}
          onChange={(value) => updateField("title", value)}
          required
          className="xl:col-span-2"
        />
        <Field
          label="System"
          value={form.system}
          onChange={(value) => updateField("system", value)}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(value) => updateField("status", value as CrStatus)}
          options={statuses}
        />
        <Select
          label="Priority"
          value={form.priority}
          onChange={(value) => updateField("priority", value as Priority)}
          options={priorities}
        />
        <Select
          label="Risk"
          value={form.risk}
          onChange={(value) => updateField("risk", value as Risk)}
          options={risks}
        />
        <Field
          label="Category"
          value={form.category}
          onChange={(value) => updateField("category", value)}
        />
        <Field
          label="Owner"
          value={form.owner}
          onChange={(value) => updateField("owner", value)}
        />
        <Field
          label="Requester"
          value={form.requester}
          onChange={(value) => updateField("requester", value)}
        />
        <Field
          label="Submitted"
          type="date"
          value={form.submittedDate}
          onChange={(value) => updateField("submittedDate", value)}
        />
        <Field
          label="Target"
          type="date"
          value={form.targetDate}
          onChange={(value) => updateField("targetDate", value)}
        />
      </div>
      <div className="border-t border-[#e5ebe8] pt-4">
        <p className="mb-3 text-xs font-semibold uppercase text-[#596466]">
          ECC Routing
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Board"
            value={form.eccBoard}
            onChange={(value) => updateField("eccBoard", value as EccBoard)}
            options={eccBoards}
          />
          <Select
            label="Classification"
            value={form.classification}
            onChange={(value) =>
              updateField("classification", value as CrClassification)
            }
            options={classifications}
          />
          <Select
            label="Gate"
            value={form.currentGate}
            onChange={(value) => updateField("currentGate", value as ReviewGate)}
            options={reviewGates}
          />
          <Field
            label="Meeting Date/Time"
            value={form.meetingDate}
            onChange={(value) => updateField("meetingDate", value)}
            placeholder="YYYY-MM-DD HH:mm"
          />
          <Field
            label="Doc Deadline"
            type="date"
            value={form.documentationDeadline}
            onChange={(value) => updateField("documentationDeadline", value)}
          />
          <Field
            label="WBS Charge"
            value={form.wbsChargeNumber}
            onChange={(value) => updateField("wbsChargeNumber", value)}
          />
          <CheckboxField
            label="Charge Active"
            checked={form.chargeNumberActive}
            onChange={(value) => updateField("chargeNumberActive", value)}
          />
          <Field
            label="Design Authority"
            value={form.designAuthority}
            onChange={(value) => updateField("designAuthority", value)}
          />
          <Field
            label="CR Folder Path"
            value={form.crFolderPath}
            onChange={(value) => updateField("crFolderPath", value)}
            className="xl:col-span-2"
          />
          <Field
            label="Quorum / Approvers"
            value={form.quorumInput}
            onChange={(value) => updateField("quorumInput", value)}
            placeholder="comma separated"
            className="xl:col-span-2"
          />
          <Field
            label="Waiver Option"
            value={form.waiverOption}
            onChange={(value) => updateField("waiverOption", value)}
            className="xl:col-span-2"
          />
          <Field
            label="Disposition"
            value={form.disposition}
            onChange={(value) => updateField("disposition", value)}
            className="xl:col-span-2"
          />
        </div>
      </div>
      <div className="border-t border-[#e5ebe8] pt-4">
        <p className="mb-3 text-xs font-semibold uppercase text-[#596466]">
          ECC Milestones
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Select
            label="Doc Notify"
            value={form.documentationNotificationStatus}
            onChange={(value) =>
              updateField("documentationNotificationStatus", value as TaskState)
            }
            options={taskStates}
          />
          <Select
            label="Pre-Meeting"
            value={form.preMeetingReviewStatus}
            onChange={(value) =>
              updateField("preMeetingReviewStatus", value as TaskState)
            }
            options={taskStates}
          />
          <Select
            label="Attendance"
            value={form.meetingAttendanceStatus}
            onChange={(value) =>
              updateField("meetingAttendanceStatus", value as TaskState)
            }
            options={taskStates}
          />
          <Select
            label="PDFs"
            value={form.postMeetingPdfStatus}
            onChange={(value) =>
              updateField("postMeetingPdfStatus", value as TaskState)
            }
            options={taskStates}
          />
          <Select
            label="NCDOC"
            value={form.ncdocStatus}
            onChange={(value) => updateField("ncdocStatus", value as TaskState)}
            options={taskStates}
          />
          <Select
            label="xClass"
            value={form.xclassStatus}
            onChange={(value) => updateField("xclassStatus", value as TaskState)}
            options={taskStates}
          />
          <Select
            label="OOC"
            value={form.oocApprovalStatus}
            onChange={(value) =>
              updateField("oocApprovalStatus", value as TaskState)
            }
            options={taskStates}
          />
          <Select
            label="Chair"
            value={form.chairApprovalStatus}
            onChange={(value) =>
              updateField("chairApprovalStatus", value as TaskState)
            }
            options={taskStates}
          />
          <Select
            label="Closure"
            value={form.closureNotificationStatus}
            onChange={(value) =>
              updateField("closureNotificationStatus", value as TaskState)
            }
            options={taskStates}
          />
          <Select
            label="CM List"
            value={form.cmWorkingListStatus}
            onChange={(value) =>
              updateField("cmWorkingListStatus", value as TaskState)
            }
            options={taskStates}
          />
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-3">
        <Textarea
          label="Description"
          value={form.description}
          onChange={(value) => updateField("description", value)}
        />
        <Textarea
          label="Business Impact"
          value={form.businessImpact}
          onChange={(value) => updateField("businessImpact", value)}
        />
        <Textarea
          label="Technical Notes"
          value={form.technicalNotes}
          onChange={(value) => updateField("technicalNotes", value)}
        />
      </div>
      <Field
        label="Tags"
        value={form.tagsInput}
        onChange={(value) => updateField("tagsInput", value)}
        placeholder="comma separated"
      />
      {error ? <p className="text-sm text-[#b91c1c]">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-semibold uppercase text-[#596466]">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-[#596466]">
        {label}
      </span>
      <span className="flex h-9 items-center gap-2 rounded-md border border-input bg-white px-3 text-sm shadow-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-[#0f766e]"
        />
        <span>{checked ? "Yes" : "No"}</span>
      </span>
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-[#596466]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-[#596466]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 w-full resize-y rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </label>
  );
}

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Info({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-md border border-[#d7dfda] bg-[#f8faf9] p-3">
      <p className="text-xs font-semibold uppercase text-[#596466]">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-medium", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase text-[#596466]">
        {label}
      </p>
      <p className="rounded-md border border-[#d7dfda] bg-[#f8faf9] p-3 text-sm leading-relaxed">
        {value}
      </p>
    </div>
  );
}

function UpdateItem({ update }: { update: CrUpdate }) {
  return (
    <div className="rounded-md border border-[#d7dfda] bg-[#f8faf9] p-3 text-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[#596466]">
        <span className="font-semibold text-[#33413e]">{update.author}</span>
        <span>{formatTimestamp(update.createdAt)}</span>
        {update.kind === "status" ? (
          <span className="inline-flex items-center gap-1 text-[#0f766e]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            status
          </span>
        ) : null}
      </div>
      <p>{update.body}</p>
    </div>
  );
}

function buildStats(crs: Cr[]) {
  return {
    total: crs.length,
    open: crs.filter((cr) => !isTerminal(cr.status)).length,
    blocked: crs.filter((cr) => cr.status === "Blocked").length,
    dueSoon: crs.filter((cr) => isDueSoon(cr)).length,
    highRisk: crs.filter((cr) => cr.risk === "High").length,
  };
}

function isTerminal(status: CrStatus) {
  return status === "Implemented" || status === "Closed" || status === "Rejected";
}

function isDueSoon(cr: Cr) {
  const days = daysUntil(cr.targetDate);
  return days !== null && days <= 14 && !isTerminal(cr.status);
}

function dueLabel(cr: Cr) {
  const days = daysUntil(cr.targetDate);
  if (days === null) {
    return "No target";
  }
  if (days < 0) {
    return `${Math.abs(days)}d overdue`;
  }
  if (days === 0) {
    return "Due today";
  }
  return `${days}d left`;
}

function daysUntil(value: string | null) {
  if (!value) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function defaultCrForm(): CrFormState {
  const year = new Date().getFullYear();
  const suffix = Math.floor(100 + Math.random() * 900);
  return {
    crNumber: `CR-${year}-${suffix}`,
    title: "",
    status: "Intake",
    priority: "Medium",
    risk: "Low",
    category: "General",
    owner: "Unassigned",
    requester: "",
    system: "General",
    targetDate: "",
    submittedDate: todayInput(),
    description: "",
    businessImpact: "",
    technicalNotes: "",
    tagsInput: "",
    eccBoard: "Other",
    classification: "TBD",
    currentGate: "None",
    meetingDate: "",
    documentationDeadline: "",
    crFolderPath: "",
    wbsChargeNumber: "",
    chargeNumberActive: false,
    quorumInput: "",
    documentationNotificationStatus: "Not Started",
    preMeetingReviewStatus: "Not Started",
    meetingAttendanceStatus: "Not Started",
    postMeetingPdfStatus: "Not Started",
    ncdocStatus: "Not Started",
    xclassStatus: "Not Started",
    oocApprovalStatus: "Not Started",
    chairApprovalStatus: "Not Started",
    closureNotificationStatus: "Not Started",
    cmWorkingListStatus: "Not Started",
    waiverOption: "",
    designAuthority: "",
    disposition: "Documentation pending",
  };
}

function formFromCr(cr: Cr): CrFormState {
  return {
    crNumber: cr.crNumber,
    title: cr.title,
    status: cr.status,
    priority: cr.priority,
    risk: cr.risk,
    category: cr.category,
    owner: cr.owner,
    requester: cr.requester,
    system: cr.system,
    targetDate: cr.targetDate ?? "",
    submittedDate: cr.submittedDate,
    description: cr.description,
    businessImpact: cr.businessImpact,
    technicalNotes: cr.technicalNotes,
    tagsInput: cr.tags.join(", "),
    eccBoard: cr.eccBoard ?? "Other",
    classification: cr.classification ?? "TBD",
    currentGate: cr.currentGate ?? "None",
    meetingDate: cr.meetingDate ?? "",
    documentationDeadline: cr.documentationDeadline ?? "",
    crFolderPath: cr.crFolderPath ?? "",
    wbsChargeNumber: cr.wbsChargeNumber ?? "",
    chargeNumberActive: cr.chargeNumberActive ?? false,
    quorumInput: (cr.quorum ?? []).join(", "),
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
    waiverOption: cr.waiverOption ?? "",
    designAuthority: cr.designAuthority ?? "",
    disposition: cr.disposition ?? "",
  };
}

function formToCreateArgs(form: CrFormState) {
  return {
    crNumber: form.crNumber,
    title: form.title,
    status: form.status,
    priority: form.priority,
    risk: form.risk,
    category: form.category,
    owner: form.owner,
    requester: form.requester,
    system: form.system,
    targetDate: form.targetDate || null,
    submittedDate: form.submittedDate,
    description: form.description,
    businessImpact: form.businessImpact,
    technicalNotes: form.technicalNotes,
    tags: parseTags(form.tagsInput),
    ...formToWorkflowArgs(form),
    author: "Local user",
  };
}

function formToUpdateArgs(form: CrFormState) {
  return {
    crNumber: form.crNumber,
    title: form.title,
    status: form.status,
    priority: form.priority,
    risk: form.risk,
    category: form.category,
    owner: form.owner,
    requester: form.requester,
    system: form.system,
    targetDate: form.targetDate || null,
    submittedDate: form.submittedDate,
    description: form.description,
    businessImpact: form.businessImpact,
    technicalNotes: form.technicalNotes,
    tags: parseTags(form.tagsInput),
    ...formToWorkflowArgs(form),
    author: "Local user",
  };
}

function formToWorkflowArgs(form: CrFormState) {
  return {
    eccBoard: form.eccBoard,
    classification: form.classification,
    currentGate: form.currentGate,
    meetingDate: form.meetingDate || null,
    documentationDeadline: form.documentationDeadline || null,
    crFolderPath: form.crFolderPath,
    wbsChargeNumber: form.wbsChargeNumber,
    chargeNumberActive: form.chargeNumberActive,
    quorum: parseList(form.quorumInput),
    documentationNotificationStatus: form.documentationNotificationStatus,
    preMeetingReviewStatus: form.preMeetingReviewStatus,
    meetingAttendanceStatus: form.meetingAttendanceStatus,
    postMeetingPdfStatus: form.postMeetingPdfStatus,
    ncdocStatus: form.ncdocStatus,
    xclassStatus: form.xclassStatus,
    oocApprovalStatus: form.oocApprovalStatus,
    chairApprovalStatus: form.chairApprovalStatus,
    closureNotificationStatus: form.closureNotificationStatus,
    cmWorkingListStatus: form.cmWorkingListStatus,
    waiverOption: form.waiverOption || null,
    designAuthority: form.designAuthority,
    disposition: form.disposition,
  };
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function taskStateTone(state: string) {
  if (
    state === "Complete" ||
    state === "Closed" ||
    state === "Approved" ||
    state === "Not Holding"
  ) {
    return "text-[#15803d]";
  }
  if (state === "Blocked" || state === "Rejected") {
    return "text-[#b91c1c]";
  }
  if (state === "In Progress" || state === "Sent" || state === "Open") {
    return "text-[#0369a1]";
  }
  if (state === "Needed") {
    return "text-[#b45309]";
  }
  return "text-[#596466]";
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
