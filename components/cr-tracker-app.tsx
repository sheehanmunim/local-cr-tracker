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
type CrId = Id<"crs">;
type CrStatus = Cr["status"];
type Priority = Cr["priority"];
type Risk = Cr["risk"];
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
};

type AssistantMessage = {
  role: "assistant" | "user";
  content: string;
};

const statuses: CrStatus[] = [
  "Intake",
  "Review",
  "Approved",
  "In Progress",
  "Blocked",
  "Testing",
  "Implemented",
  "Rejected",
];

const priorities: Priority[] = ["Low", "Medium", "High", "Critical"];
const risks: Risk[] = ["Low", "Medium", "High"];

const statusTone: Record<CrStatus, string> = {
  Intake: "border-[#cbd5d1] bg-[#eef2f0] text-[#33413e]",
  Review: "border-[#a5b4fc] bg-[#eef2ff] text-[#3730a3]",
  Approved: "border-[#86efac] bg-[#ecfdf3] text-[#166534]",
  "In Progress": "border-[#67e8f9] bg-[#ecfeff] text-[#155e75]",
  Blocked: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
  Testing: "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
  Implemented: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
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
              <Badge className={priorityTone[cr.priority]}>{cr.priority}</Badge>
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
  const updates = useQuery(
    api.crs.listUpdates,
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
              <Info label="Target" value={cr.targetDate ?? "No date"} />
              <Info label="Risk" value={cr.risk} valueClassName={riskTone[cr.risk]} />
              <Info label="Submitted" value={cr.submittedDate} />
              <Info label="Updated" value={formatTimestamp(cr.lastUpdatedAt)} />
            </div>
            <TextBlock label="Description" value={cr.description} />
            <TextBlock label="Business Impact" value={cr.businessImpact} />
            <TextBlock label="Technical Notes" value={cr.technicalNotes} />
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
  return status === "Implemented" || status === "Rejected";
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
    author: "Local user",
  };
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
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
