"use client";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import {
  AlertTriangle,
  Archive,
  BarChart3,
  CalendarClock,
  ChevronDown,
  CheckCircle2,
  CircleDot,
  Download,
  FileSpreadsheet,
  GitBranch,
  GripVertical,
  Kanban,
  LayoutDashboard,
  List,
  Loader2,
  Maximize2,
  MessageSquarePlus,
  Mic,
  Minimize2,
  Move,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Square,
  StickyNote,
  Table2,
  Upload,
  UserRound,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { authClient } from "@/lib/auth-client";

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
type BoardFilter = EccBoard | "All";
type ClassificationFilter = CrClassification | "All";
type CrScope =
  | "mine"
  | "all"
  | "attention"
  | "dueSoon"
  | "actions"
  | "approvals"
  | "complete";
type ViewMode = "list" | "excel" | "kanban" | "whiteboard";
type DashboardSection =
  | "dashboard"
  | "workflow"
  | "allCrs"
  | "myCrs"
  | "analytics"
  | "settings";
type SidebarNavSection = Exclude<DashboardSection, "settings">;
type AuthUser = {
  name?: string | null;
  email?: string | null;
};

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
  meetingTimeEst: string;
  ncdocNumber: string;
  classGateMilitarySupplierEc: string;
  responsibleIptsInput: string;
  engineProgramsInput: string;
  componentModelsInput: string;
  supplier: string;
  far15: boolean;
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
  eccCoordinator: string;
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

type EccSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: EccSpeechRecognitionEvent) => void) | null;
};

type EccSpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type EccSpeechRecognitionConstructor = new () => EccSpeechRecognition;

type EccSpeechWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: EccSpeechRecognitionConstructor;
    webkitSpeechRecognition?: EccSpeechRecognitionConstructor;
  };

type IntakeImageState = {
  dataUrl: string;
  base64: string;
  mimeType: string;
  name: string;
};

type IntakeFields = Partial<{
  crNumber: string;
  ncdocNumber: string;
  meetingDate: string;
  meetingTimeEst: string;
  classGateMilitarySupplierEc: string;
  disposition: string;
  responsibleIpts: string[];
  enginePrograms: string[];
  componentModels: string[];
  supplier: string;
  description: string;
  wbsChargeNumber: string;
  far15: boolean | null;
  documentationDeadline: string;
  targetDate: string;
  designAuthority: string;
  eccCoordinator: string;
}>;

type WhiteboardPosition = {
  x: number;
  y: number;
};

type WhiteboardDragState = {
  crId: CrId;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  moved: boolean;
  expanded: boolean;
};

type WorkflowPhaseState = "complete" | "active" | "blocked" | "pending";

type TaskStateField =
  | "documentationNotificationStatus"
  | "preMeetingReviewStatus"
  | "meetingAttendanceStatus"
  | "postMeetingPdfStatus"
  | "ncdocStatus"
  | "xclassStatus"
  | "oocApprovalStatus"
  | "chairApprovalStatus"
  | "closureNotificationStatus"
  | "cmWorkingListStatus";

type WorkflowTask = {
  label: string;
  field: TaskStateField;
  state: TaskState;
};

type WorkflowPhase = {
  id: string;
  label: string;
  detail: string;
  state: WorkflowPhaseState;
  tasks: WorkflowTask[];
};

type AnalyticsBarRow = {
  label: string;
  value: number;
  detail?: string;
  tone?: string;
};

type AnalyticsMetric = {
  label: string;
  value: string;
  detail: string;
  tone: string;
  accent: string;
  icon: LucideIcon;
};

type OwnerLoadRow = {
  owner: string;
  total: number;
  open: number;
  attention: number;
  highRisk: number;
  critical: number;
  dueSoon: number;
  overdue: number;
  averageAgeDays: number;
};

type CouncilLoadRow = {
  board: EccBoard;
  total: number;
  open: number;
  blocked: number;
  highRisk: number;
  critical: number;
  dueSoon: number;
  overdue: number;
  meetings: number;
  completionRate: number;
};

type TaskReadinessRow = {
  label: string;
  complete: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
  notApplicable: number;
  completionRate: number;
};

type RiskWatchRow = {
  crNumber: string;
  title: string;
  owner: string;
  status: CrStatus;
  priority: Priority;
  risk: Risk;
  board: EccBoard;
  gate: ReviewGate;
  dueLabel: string;
  drivers: string;
  updated: string;
};

type AnalyticsModel = {
  total: number;
  openCount: number;
  closedCount: number;
  completionRate: number;
  attentionCount: number;
  assignedToMe: number;
  overdueCount: number;
  dueSoonCount: number;
  metrics: AnalyticsMetric[];
  statusRows: AnalyticsBarRow[];
  priorityRows: AnalyticsBarRow[];
  riskRows: AnalyticsBarRow[];
  phaseRows: AnalyticsBarRow[];
  dueRows: AnalyticsBarRow[];
  ownerRows: OwnerLoadRow[];
  councilRows: CouncilLoadRow[];
  taskRows: TaskReadinessRow[];
  riskWatchlist: RiskWatchRow[];
  completenessRows: AnalyticsBarRow[];
  monthlyRows: AnalyticsBarRow[];
};

type ExcelCell = string | number | boolean | null | undefined;

type ExcelSheet = {
  name: string;
  rows: ExcelCell[][];
};

const statuses: CrStatus[] = [
  "Intake",
  "Documentation Pending",
  "Ready for Review",
  "Meeting Scheduled",
  "Testing",
  "Review",
  "Approved",
  "Approved w/Actions",
  "In Progress",
  "Blocked",
  "Held for Actions",
  "Pending OOC Approvals",
  "Implemented",
  "Waiver Processing",
  "NCDOC/xClass",
  "CM Working List",
  "Closed",
  "Rejected",
];

const priorities: Priority[] = ["Low", "Medium", "High", "Critical"];
const risks: Risk[] = ["Low", "Medium", "High"];
const pageShell = "collins-dashboard min-h-screen bg-[#f6f6f1] text-gray-950";
const panelShell = "border border-gray-200 bg-white shadow-none";
const panelHeader = "border-b border-gray-200 px-4 py-3";
const sectionLabel =
  "text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500";
const neutralBadge = "border-gray-200 bg-white text-gray-700";
const maxProfilePhotoBytes = 2 * 1024 * 1024;
const maxIntakeImageBytes = 8 * 1024 * 1024;
const profilePhotoStorageEvent = "ecc-profile-photo-storage";
const sidebarNavOrderStorageEvent = "ecc-sidebar-nav-order-storage";
const sidebarNavOrderStorageKey = "ecc.sidebar.navOrder";
const defaultSidebarNavOrder: SidebarNavSection[] = [
  "dashboard",
  "workflow",
  "allCrs",
  "myCrs",
  "analytics",
];
const defaultSidebarNavOrderSnapshot = defaultSidebarNavOrder.join("|");
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
const whiteboardPadding = 24;
const whiteboardNoteWidth = 232;
const whiteboardExpandedNoteWidth = 344;
const whiteboardNoteHeight = 178;
const whiteboardExpandedNoteHeight = 360;
const whiteboardColumnGap = 268;
const whiteboardRowGap = 218;

const statusTone: Record<CrStatus, string> = {
  Intake: "border-gray-200 bg-gray-50 text-gray-700",
  "Documentation Pending": "border-amber-200 bg-amber-50 text-amber-800",
  "Ready for Review": "border-sky-200 bg-sky-50 text-sky-800",
  "Meeting Scheduled": "border-indigo-200 bg-indigo-50 text-indigo-800",
  Testing: "border-cyan-200 bg-cyan-50 text-cyan-800",
  Review: "border-blue-200 bg-blue-50 text-blue-800",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "Approved w/Actions": "border-lime-200 bg-lime-50 text-lime-800",
  "In Progress": "border-gray-300 bg-gray-50 text-gray-800",
  Blocked: "border-rose-200 bg-rose-50 text-rose-800",
  "Held for Actions": "border-orange-200 bg-orange-50 text-orange-800",
  "Pending OOC Approvals": "border-violet-200 bg-violet-50 text-violet-800",
  Implemented: "border-emerald-700 bg-emerald-700 text-white",
  "Waiver Processing": "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
  "NCDOC/xClass": "border-cyan-200 bg-cyan-50 text-cyan-800",
  "CM Working List": "border-stone-200 bg-stone-50 text-stone-800",
  Closed: "border-gray-700 bg-gray-900 text-white",
  Rejected: "border-red-200 bg-red-50 text-red-800",
};

const priorityTone: Record<Priority, string> = {
  Low: "border-gray-200 bg-white text-gray-600",
  Medium: "border-gray-300 bg-gray-50 text-gray-800",
  High: "border-amber-200 bg-amber-50 text-amber-800",
  Critical: "border-rose-700 bg-rose-700 text-white",
};

const riskTone: Record<Risk, string> = {
  Low: "text-emerald-700",
  Medium: "text-amber-700",
  High: "text-rose-700",
};

const analyticsBarTones = [
  "bg-slate-900",
  "bg-cyan-700",
  "bg-emerald-600",
  "bg-amber-500",
  "bg-rose-600",
  "bg-blue-700",
  "bg-fuchsia-600",
  "bg-stone-600",
];

const stickyNoteTone: Record<Priority, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-950",
  Medium: "border-yellow-200 bg-yellow-50 text-yellow-950",
  High: "border-amber-300 bg-amber-100 text-amber-950",
  Critical: "border-rose-300 bg-rose-100 text-rose-950",
};

const kanbanColumns: Array<{
  id: string;
  title: string;
  statuses: CrStatus[];
}> = [
  {
    id: "intake",
    title: "Intake",
    statuses: ["Intake", "Documentation Pending"],
  },
  {
    id: "review",
    title: "Review",
    statuses: ["Ready for Review", "Meeting Scheduled", "Testing", "Review"],
  },
  {
    id: "hold",
    title: "Actions / OOC",
    statuses: [
      "Approved w/Actions",
      "Held for Actions",
      "Pending OOC Approvals",
      "Waiver Processing",
      "NCDOC/xClass",
      "CM Working List",
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    statuses: ["Approved", "In Progress", "Implemented"],
  },
  {
    id: "closed",
    title: "Closed",
    statuses: ["Closed", "Rejected"],
  },
];

const workflowPhaseDefinitions: Array<{
  id: string;
  label: string;
  detail: (cr: Cr) => string;
  statuses: CrStatus[];
  tasks: Array<{ label: string; field: TaskStateField }>;
}> = [
  {
    id: "intake",
    label: "Intake",
    detail: (cr) =>
      `${cr.eccCoordinator || cr.owner || "Unassigned"} owns intake`,
    statuses: ["Intake"],
    tasks: [],
  },
  {
    id: "documentation",
    label: "Documentation",
    detail: (cr) => `Docs due ${cr.documentationDeadline ?? "No date"}`,
    statuses: ["Documentation Pending"],
    tasks: [
      {
        label: "Doc Notify",
        field: "documentationNotificationStatus",
      },
    ],
  },
  {
    id: "review-prep",
    label: "Review Prep",
    detail: (cr) =>
      `${cr.classification ?? "TBD"} / ${cr.currentGate ?? "None"}`,
    statuses: ["Ready for Review"],
    tasks: [
      {
        label: "Pre-Meeting",
        field: "preMeetingReviewStatus",
      },
    ],
  },
  {
    id: "ecc-review",
    label: "ECC Review",
    detail: (cr) =>
      [cr.meetingDate, cr.meetingTimeEst].filter(Boolean).join(" ") ||
      "No meeting date",
    statuses: ["Meeting Scheduled", "Testing", "Review"],
    tasks: [
      {
        label: "Attendance",
        field: "meetingAttendanceStatus",
      },
      {
        label: "PDFs",
        field: "postMeetingPdfStatus",
      },
    ],
  },
  {
    id: "actions-ooc",
    label: "Actions / OOC",
    detail: (cr) => `Gate ${cr.currentGate ?? "None"}`,
    statuses: [
      "Approved w/Actions",
      "Held for Actions",
      "Pending OOC Approvals",
      "Waiver Processing",
      "Blocked",
    ],
    tasks: [
      {
        label: "OOC",
        field: "oocApprovalStatus",
      },
      {
        label: "Chair",
        field: "chairApprovalStatus",
      },
    ],
  },
  {
    id: "implementation",
    label: "Implementation",
    detail: (cr) => `Need-by ${cr.targetDate ?? "No date"}`,
    statuses: ["Approved", "In Progress", "Implemented"],
    tasks: [],
  },
  {
    id: "records",
    label: "Records",
    detail: (cr) => `NCDOC ${cr.ncdocNumber || "Not set"}`,
    statuses: ["NCDOC/xClass", "CM Working List"],
    tasks: [
      {
        label: "NCDOC",
        field: "ncdocStatus",
      },
      {
        label: "xClass",
        field: "xclassStatus",
      },
      {
        label: "CM List",
        field: "cmWorkingListStatus",
      },
    ],
  },
  {
    id: "closure",
    label: "Closure",
    detail: (cr) => `Updated ${formatTimestamp(cr.lastUpdatedAt)}`,
    statuses: ["Closed", "Rejected"],
    tasks: [
      {
        label: "Closure",
        field: "closureNotificationStatus",
      },
    ],
  },
];

const analyticsTaskFields: Array<{
  label: string;
  state: (cr: Cr) => TaskState;
}> = [
  {
    label: "Doc Notification",
    state: (cr) => cr.documentationNotificationStatus ?? "Not Started",
  },
  {
    label: "Pre-Meeting Review",
    state: (cr) => cr.preMeetingReviewStatus ?? "Not Started",
  },
  {
    label: "Meeting Attendance",
    state: (cr) => cr.meetingAttendanceStatus ?? "Not Started",
  },
  {
    label: "Post-Meeting PDFs",
    state: (cr) => cr.postMeetingPdfStatus ?? "Not Started",
  },
  {
    label: "NCDOC",
    state: (cr) => cr.ncdocStatus ?? "Not Started",
  },
  {
    label: "xClass",
    state: (cr) => cr.xclassStatus ?? "Not Started",
  },
  {
    label: "OOC Approval",
    state: (cr) => cr.oocApprovalStatus ?? "Not Started",
  },
  {
    label: "Chair Approval",
    state: (cr) => cr.chairApprovalStatus ?? "Not Started",
  },
  {
    label: "Closure Notice",
    state: (cr) => cr.closureNotificationStatus ?? "Not Started",
  },
  {
    label: "CM Working List",
    state: (cr) => cr.cmWorkingListStatus ?? "Not Started",
  },
];

const workflowStatusPhaseIndex: Record<CrStatus, number> = {
  Intake: 0,
  "Documentation Pending": 1,
  "Ready for Review": 2,
  "Meeting Scheduled": 3,
  Testing: 3,
  Review: 3,
  Approved: 5,
  "Approved w/Actions": 4,
  "In Progress": 5,
  Blocked: 4,
  "Held for Actions": 4,
  "Pending OOC Approvals": 4,
  Implemented: 5,
  "Waiver Processing": 4,
  "NCDOC/xClass": 6,
  "CM Working List": 6,
  Closed: 7,
  Rejected: 7,
};

const workflowPhaseTone: Record<WorkflowPhaseState, string> = {
  complete: "border-emerald-200 bg-emerald-50",
  active: "border-blue-300 bg-blue-50",
  blocked: "border-rose-300 bg-rose-50",
  pending: "border-gray-200 bg-white",
};

const workflowPhaseBadgeTone: Record<WorkflowPhaseState, string> = {
  complete: "border-emerald-200 bg-white text-emerald-700",
  active: "border-blue-200 bg-white text-blue-700",
  blocked: "border-rose-200 bg-white text-rose-700",
  pending: "border-gray-200 bg-gray-50 text-gray-500",
};

const workflowPhaseDotTone: Record<WorkflowPhaseState, string> = {
  complete: "border-emerald-600 bg-emerald-600 text-white",
  active: "border-blue-600 bg-white text-blue-700",
  blocked: "border-rose-600 bg-rose-600 text-white",
  pending: "border-gray-300 bg-white text-gray-400",
};

export function CrTrackerApp() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <AuthLoadingScreen />;
  }

  if (!session?.user) {
    return <LoginScreen />;
  }

  return (
    <CrTrackerDashboard
      key={session.user.email ?? session.user.name ?? "collins-user"}
      user={session.user}
    />
  );
}

function CrTrackerDashboard({ user }: { user: AuthUser }) {
  const appShellRef = useRef<HTMLDivElement>(null);
  const {
    fullscreenSupported: isAppFullscreenSupported,
    isFullscreen: isAppFullscreen,
    toggleFullscreen: toggleAppFullscreen,
  } = useFullscreenTarget(appShellRef);
  const signedInName = user.name || user.email || "Collins user";
  const signedInEmail = user.email ?? null;
  const profilePhotoKey = useMemo(
    () => getProfilePhotoStorageKey(signedInName, signedInEmail),
    [signedInEmail, signedInName],
  );
  const subscribeToCurrentProfilePhoto = useCallback(
    (onStoreChange: () => void) =>
      subscribeToProfilePhotoStorage(profilePhotoKey, onStoreChange),
    [profilePhotoKey],
  );
  const getCurrentProfilePhoto = useCallback(
    () => readStoredProfilePhoto(profilePhotoKey),
    [profilePhotoKey],
  );
  const profilePhotoUrl = useSyncExternalStore(
    subscribeToCurrentProfilePhoto,
    getCurrentProfilePhoto,
    getEmptyProfilePhotoSnapshot,
  );
  const crs = useQuery(api.crs.list, { status: "All" });
  const createCr = useMutation(api.crs.create);
  const updateCr = useMutation(api.crs.update);
  const [selectedId, setSelectedId] = useState<CrId | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [scope, setScope] = useState<CrScope>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [localOwner, setLocalOwner] = useState(signedInName);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [riskFilter, setRiskFilter] = useState<Risk | "All">("All");
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("All");
  const [classificationFilter, setClassificationFilter] =
    useState<ClassificationFilter>("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [movingId, setMovingId] = useState<CrId | null>(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(true);
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("dashboard");

  useEffect(() => {
    function syncSidebarForViewport() {
      setIsSidebarOpen(window.innerWidth >= 768);
    }

    syncSidebarForViewport();
    window.addEventListener("resize", syncSidebarForViewport);
    return () => window.removeEventListener("resize", syncSidebarForViewport);
  }, []);

  useEffect(() => {
    if (!isCreating) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCreating(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreating]);

  function handleProfilePhotoChange(nextPhotoUrl: string | null) {
    try {
      if (nextPhotoUrl) {
        window.localStorage.setItem(profilePhotoKey, nextPhotoUrl);
      } else {
        window.localStorage.removeItem(profilePhotoKey);
      }
      notifyProfilePhotoStorageChange();
    } catch {
      notifyProfilePhotoStorageChange();
    }
  }

  const owners = useMemo(() => {
    const source = crs ?? [];
    return Array.from(new Set(source.map((cr) => cr.owner))).sort();
  }, [crs]);

  const filteredCrs = useMemo(() => {
    const source = crs ?? [];
    const term = search.trim().toLowerCase();
    return source.filter((cr) => {
      const matchesScope = crMatchesScope(cr, scope, localOwner);
      const matchesStatus =
        statusFilter === "All" || cr.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || cr.priority === priorityFilter;
      const matchesRisk = riskFilter === "All" || cr.risk === riskFilter;
      const matchesOwner = ownerFilter === "All" || cr.owner === ownerFilter;
      const matchesBoard =
        boardFilter === "All" || (cr.eccBoard ?? "Other") === boardFilter;
      const matchesClassification =
        classificationFilter === "All" ||
        (cr.classification ?? "TBD") === classificationFilter;
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
        matchesScope &&
        matchesStatus &&
        matchesPriority &&
        matchesRisk &&
        matchesOwner &&
        matchesBoard &&
        matchesClassification &&
        (!term || haystack.includes(term))
      );
    });
  }, [
    boardFilter,
    classificationFilter,
    crs,
    localOwner,
    ownerFilter,
    priorityFilter,
    riskFilter,
    scope,
    search,
    statusFilter,
  ]);

  const selectedCr =
    (selectedId && filteredCrs.find((cr) => cr._id === selectedId)) ??
    filteredCrs[0] ??
    null;

  const stats = useMemo(() => buildStats(crs ?? []), [crs]);

  function handleSectionChange(section: DashboardSection) {
    setActiveSection(section);

    if (
      section === "allCrs" ||
      section === "dashboard" ||
      section === "workflow" ||
      section === "analytics"
    ) {
      setScope("all");
    }

    if (section === "myCrs") {
      setScope("mine");
    }
  }

  async function handleKanbanStatusChange(cr: Cr, status: CrStatus) {
    if (cr.status === status) {
      return;
    }
    setMovingId(cr._id);
    setNotice("");
    try {
      await updateCr({ id: cr._id, status, author: "Collins user" });
      setNotice(`${cr.crNumber} moved to ${status}.`);
    } catch (caught) {
      setNotice(
        caught instanceof Error ? caught.message : "Unable to update status.",
      );
    } finally {
      setMovingId(null);
    }
  }

  return (
    <div
      ref={appShellRef}
      className={cn(pageShell, "h-screen overflow-hidden")}
    >
      <div className="flex h-full overflow-hidden bg-gray-50">
        <TrackerSidebar
          isOpen={isSidebarOpen}
          boardFilter={boardFilter}
          activeSection={activeSection}
          signedInName={signedInName}
          signedInEmail={signedInEmail}
          profilePhotoUrl={profilePhotoUrl}
          onBoardFilterChange={(nextBoard) => {
            setBoardFilter(nextBoard);
            setScope("all");
            setActiveSection("allCrs");
          }}
          onSectionChange={handleSectionChange}
          onToggle={() => setIsSidebarOpen((value) => !value)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <WorkspaceRibbon
            onCreate={() => setIsCreating(true)}
            onAssistantToggle={() => setIsAssistantOpen((value) => !value)}
            onSettings={() => handleSectionChange("settings")}
            isAssistantOpen={isAssistantOpen}
            isFullscreen={isAppFullscreen}
            fullscreenSupported={isAppFullscreenSupported}
            onFullscreenToggle={() => void toggleAppFullscreen()}
          />

          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
            {activeSection === "settings" ? (
              <div className="mx-auto max-w-[1400px] p-5">
                <SettingsPage
                  signedInName={signedInName}
                  signedInEmail={signedInEmail}
                  profilePhotoUrl={profilePhotoUrl}
                  localOwner={localOwner}
                  viewMode={viewMode}
                  boardFilter={boardFilter}
                  onLocalOwnerChange={setLocalOwner}
                  onProfilePhotoChange={handleProfilePhotoChange}
                  onViewModeChange={setViewMode}
                  onBoardFilterChange={setBoardFilter}
                  onSignOut={() => void authClient.signOut()}
                />
              </div>
            ) : (
              <div
                className={cn(
                  "mx-auto grid max-w-[1800px] gap-5 p-5",
                  isAssistantOpen && "2xl:grid-cols-[minmax(0,1fr)_400px]",
                )}
              >
                <div className="min-w-0 space-y-5">
                  {activeSection === "dashboard" ? (
                    <DashboardHome
                      crs={crs ?? []}
                      localOwner={localOwner}
                      notice={notice}
                      stats={stats}
                    />
                  ) : activeSection === "workflow" ? (
                    <>
                      <FilterBar
                        owners={owners}
                        statusFilter={statusFilter}
                        priorityFilter={priorityFilter}
                        riskFilter={riskFilter}
                        boardFilter={boardFilter}
                        classificationFilter={classificationFilter}
                        ownerFilter={ownerFilter}
                        search={search}
                        onStatusFilterChange={setStatusFilter}
                        onPriorityFilterChange={setPriorityFilter}
                        onRiskFilterChange={setRiskFilter}
                        onBoardFilterChange={setBoardFilter}
                        onClassificationFilterChange={setClassificationFilter}
                        onOwnerFilterChange={setOwnerFilter}
                        onSearchChange={setSearch}
                      />
                      <WorkflowWorkspace
                        crs={filteredCrs}
                        loading={!crs}
                        selectedCr={selectedCr}
                        selectedId={selectedCr?._id ?? null}
                        scope={scope}
                        onSelect={setSelectedId}
                      />
                    </>
                  ) : activeSection === "analytics" ? (
                    <AnalyticsHome crs={crs ?? []} localOwner={localOwner} />
                  ) : (
                    <RequestWorkspace
                      crs={filteredCrs}
                      loading={!crs}
                      selectedId={selectedId}
                      selectedCr={selectedCr}
                      scope={scope}
                      viewMode={viewMode}
                      owners={owners}
                      statusFilter={statusFilter}
                      priorityFilter={priorityFilter}
                      riskFilter={riskFilter}
                      boardFilter={boardFilter}
                      classificationFilter={classificationFilter}
                      ownerFilter={ownerFilter}
                      search={search}
                      movingId={movingId}
                      onSelect={setSelectedId}
                      onViewModeChange={setViewMode}
                      onStatusFilterChange={setStatusFilter}
                      onPriorityFilterChange={setPriorityFilter}
                      onRiskFilterChange={setRiskFilter}
                      onBoardFilterChange={setBoardFilter}
                      onClassificationFilterChange={setClassificationFilter}
                      onOwnerFilterChange={setOwnerFilter}
                      onSearchChange={setSearch}
                      onKanbanStatusChange={(cr, status) =>
                        void handleKanbanStatusChange(cr, status)
                      }
                    />
                  )}
                </div>

                {isAssistantOpen ? (
                  <AssistantPanel
                    selectedCr={selectedCr}
                    onClose={() => setIsAssistantOpen(false)}
                  />
                ) : null}
              </div>
            )}
          </main>
        </div>
      </div>

      {isCreating ? (
        <NewCrModal
          createCr={createCr}
          onCreated={(id) => {
            setIsCreating(false);
            setSelectedId(id);
            setScope("all");
            setActiveSection("allCrs");
            setNotice("CR created.");
          }}
          onCancel={() => setIsCreating(false)}
        />
      ) : null}
    </div>
  );
}

function DashboardHome({
  crs,
  localOwner,
  notice,
  stats,
}: {
  crs: Cr[];
  localOwner: string;
  notice: string;
  stats: ReturnType<typeof buildStats>;
}) {
  const attentionCount = crs.filter((cr) => needsAttention(cr)).length;
  const actionCount = crs.filter((cr) => hasActionWork(cr)).length;
  const approvalCount = crs.filter((cr) => hasApprovalWork(cr)).length;
  const recentlyUpdated = [...crs]
    .sort((first, second) => second.lastUpdatedAt - first.lastUpdatedAt)
    .slice(0, 5);

  return (
    <section id="dashboard" className="space-y-5">
      <section className={cn(panelShell, "p-6")}>
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className={sectionLabel}>
              Collins Aerospace / Engineering Change Council
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-950">
              ECC Dashboard
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">
              Operational dashboard for engineering change request health, owner
              accountability, review readiness, and escalation risk.
            </p>
          </div>
          <div className="space-y-3 2xl:min-w-[520px]">
            {notice ? (
              <div className="flex justify-start 2xl:justify-end">
                <span className="border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                  {notice}
                </span>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              <Info label="Open" value={`${stats.open}`} />
              <Info label="Attention" value={`${attentionCount}`} />
              <Info label="Actions" value={`${actionCount}`} />
              <Info label="Approvals" value={`${approvalCount}`} />
              <Info label="Owner" value={localOwner || "Not set"} />
            </div>
          </div>
        </div>
      </section>

      <MetricStrip stats={stats} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className={cn(panelShell, "overflow-hidden")}>
          <div className={panelHeader}>
            <p className={sectionLabel}>Council Load</p>
            <h2 className="mt-1 text-base font-semibold text-slate-950">
              Open CRs by ECC council
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead className="bg-gray-50 text-left">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Council
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Open
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Blocked
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    High Risk
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Due Soon
                  </th>
                </tr>
              </thead>
              <tbody>
                {eccBoards.map((board) => {
                  const boardCrs = crs.filter(
                    (cr) => (cr.eccBoard ?? "Other") === board,
                  );
                  return (
                    <tr key={board} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-semibold text-gray-950">
                        {board}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {boardCrs.filter((cr) => !isTerminal(cr.status)).length}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {
                          boardCrs.filter((cr) => cr.status === "Blocked")
                            .length
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {boardCrs.filter((cr) => cr.risk === "High").length}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {boardCrs.filter((cr) => isDueSoon(cr)).length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className={cn(panelShell, "overflow-hidden")}>
          <div className={panelHeader}>
            <p className={sectionLabel}>Recent Activity</p>
            <h2 className="mt-1 text-base font-semibold text-slate-950">
              Latest CR updates
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentlyUpdated.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                No Collins Aerospace requests yet.
              </p>
            ) : null}
            {recentlyUpdated.map((cr) => (
              <div key={cr._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-slate-700">
                      {cr.crNumber}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950">
                      {cr.title}
                    </h3>
                  </div>
                  <Badge className={statusTone[cr.status]}>{cr.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {cr.owner} / {formatTimestamp(cr.lastUpdatedAt)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function AnalyticsHome({ crs, localOwner }: { crs: Cr[]; localOwner: string }) {
  const analytics = useMemo(
    () => buildAnalyticsModel(crs, localOwner),
    [crs, localOwner],
  );

  return (
    <section id="analytics" className="space-y-5">
      <section className={cn(panelShell, "p-6")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className={sectionLabel}>Engineering Change Council</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-950">
              ECC Analytics
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">
              Council health, owner load, risk pressure, workflow readiness,
              due-date exposure, and register quality across the full CR
              portfolio.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="border-slate-200 bg-white text-slate-700">
                {analytics.total} total CRs
              </Badge>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
                {analytics.completionRate}% complete
              </Badge>
              <Badge className="border-rose-200 bg-rose-50 text-rose-800">
                {analytics.attentionCount} attention
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[360px]">
              <Info label="Open" value={`${analytics.openCount}`} />
              <Info
                label="Assigned to Me"
                value={`${analytics.assignedToMe}`}
              />
              <Info label="Overdue" value={`${analytics.overdueCount}`} />
              <Info label="Due Soon" value={`${analytics.dueSoonCount}`} />
            </div>
            <Button
              type="button"
              onClick={() =>
                downloadAnalyticsWorkbook(crs, localOwner, "ecc-analytics")
              }
              disabled={crs.length === 0}
              className="h-11 self-start px-4 sm:self-end"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {analytics.metrics.map((metric) => (
          <AnalyticsKpiCard key={metric.label} metric={metric} />
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <AnalyticsPanel
          title="Status Mix"
          subtitle={`${analytics.openCount} active / ${analytics.closedCount} terminal`}
          rows={analytics.statusRows}
          total={analytics.total}
        />
        <AnalyticsPanel
          title="Due Date Pressure"
          subtitle="Open CRs by target-date bucket"
          rows={analytics.dueRows}
          total={Math.max(analytics.openCount, 1)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <AnalyticsPanel
          title="Priority"
          subtitle="Priority distribution"
          rows={analytics.priorityRows}
          total={analytics.total}
        />
        <AnalyticsPanel
          title="Risk"
          subtitle="Risk distribution"
          rows={analytics.riskRows}
          total={analytics.total}
        />
        <AnalyticsPanel
          title="Workflow Phase"
          subtitle="Current phase for each CR"
          rows={analytics.phaseRows}
          total={analytics.total}
        />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <OwnerLoadTable rows={analytics.ownerRows} />
        <CouncilLoadTable rows={analytics.councilRows} />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <TaskReadinessTable rows={analytics.taskRows} total={analytics.total} />
        <RiskWatchlist rows={analytics.riskWatchlist} />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <AnalyticsPanel
          title="Register Completeness"
          subtitle="Key fields populated across the CR register"
          rows={analytics.completenessRows}
          total={analytics.total}
        />
        <AnalyticsPanel
          title="Monthly Intake"
          subtitle="Submitted CR volume by month"
          rows={analytics.monthlyRows}
          total={analytics.total}
        />
      </div>
    </section>
  );
}

function AnalyticsKpiCard({ metric }: { metric: AnalyticsMetric }) {
  const Icon = metric.icon;

  return (
    <div className={cn(panelShell, "overflow-hidden p-4")}>
      <div className={cn("-mx-4 -mt-4 mb-4 h-1", metric.accent)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={sectionLabel}>{metric.label}</p>
          <p className="mt-2 truncate text-3xl font-semibold tracking-normal text-slate-950">
            {metric.value}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {metric.detail}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center",
            metric.tone,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function AnalyticsPanel({
  title,
  subtitle,
  rows,
  total,
}: {
  title: string;
  subtitle?: string;
  rows: AnalyticsBarRow[];
  total: number;
}) {
  const maxValue = Math.max(...rows.map((row) => row.value), 1);

  return (
    <section className={cn(panelShell, "overflow-hidden")}>
      <div className={panelHeader}>
        <p className={sectionLabel}>Analytics</p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No CRs to analyze yet.</p>
        ) : null}
        {rows.map((row) => {
          const percent = total > 0 ? Math.round((row.value / total) * 100) : 0;
          const width = `${Math.max((row.value / maxValue) * 100, row.value > 0 ? 6 : 0)}%`;

          return (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-700">
                    {row.label}
                  </span>
                  {row.detail ? (
                    <span className="block truncate text-slate-500">
                      {row.detail}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 font-medium text-slate-600">
                  {row.value} / {percent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden bg-slate-100">
                <div
                  className={cn("h-full", row.tone ?? "bg-slate-900")}
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OwnerLoadTable({ rows }: { rows: OwnerLoadRow[] }) {
  return (
    <section className={cn(panelShell, "overflow-hidden")}>
      <div className={panelHeader}>
        <p className={sectionLabel}>Ownership</p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">
          Owner Workload
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Ranked by open work, attention items, and overdue pressure.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="border-b border-slate-200">
              {[
                "Owner",
                "Open",
                "Attention",
                "High Risk",
                "Critical",
                "Overdue",
                "Avg Age",
              ].map((header) => (
                <th key={header} className="px-4 py-2 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={7}>
                  No owner workload yet.
                </td>
              </tr>
            ) : null}
            {rows.slice(0, 10).map((row) => (
              <tr key={row.owner} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-950">
                  {row.owner}
                </td>
                <td className="px-4 py-3 text-slate-700">{row.open}</td>
                <td className="px-4 py-3 text-slate-700">{row.attention}</td>
                <td className="px-4 py-3 text-slate-700">{row.highRisk}</td>
                <td className="px-4 py-3 text-slate-700">{row.critical}</td>
                <td className="px-4 py-3 text-slate-700">{row.overdue}</td>
                <td className="px-4 py-3 text-slate-700">
                  {row.averageAgeDays}d
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CouncilLoadTable({ rows }: { rows: CouncilLoadRow[] }) {
  return (
    <section className={cn(panelShell, "overflow-hidden")}>
      <div className={panelHeader}>
        <p className={sectionLabel}>Councils</p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">
          ECC Council Load
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Open work, risk concentration, reviews, and closure progress.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="border-b border-slate-200">
              {[
                "Council",
                "Total",
                "Open",
                "Blocked",
                "High Risk",
                "Due Soon",
                "Meetings",
                "Complete",
              ].map((header) => (
                <th key={header} className="px-4 py-2 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.board} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-950">
                  {row.board}
                </td>
                <td className="px-4 py-3 text-slate-700">{row.total}</td>
                <td className="px-4 py-3 text-slate-700">{row.open}</td>
                <td className="px-4 py-3 text-slate-700">{row.blocked}</td>
                <td className="px-4 py-3 text-slate-700">{row.highRisk}</td>
                <td className="px-4 py-3 text-slate-700">{row.dueSoon}</td>
                <td className="px-4 py-3 text-slate-700">{row.meetings}</td>
                <td className="px-4 py-3 text-slate-700">
                  {row.completionRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TaskReadinessTable({
  rows,
  total,
}: {
  rows: TaskReadinessRow[];
  total: number;
}) {
  return (
    <section className={cn(panelShell, "overflow-hidden")}>
      <div className={panelHeader}>
        <p className={sectionLabel}>Readiness</p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">
          Workflow Task Health
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Completion and blockage by operational task state.
        </p>
      </div>
      <div className="space-y-3 p-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-700">{row.label}</span>
              <span className="text-slate-500">
                {row.complete}/{total} complete / {row.blocked} blocked
              </span>
            </div>
            <div className="h-2 overflow-hidden bg-slate-100">
              <div
                className="h-full bg-emerald-600"
                style={{ width: `${row.completionRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RiskWatchlist({ rows }: { rows: RiskWatchRow[] }) {
  return (
    <section className={cn(panelShell, "overflow-hidden")}>
      <div className={panelHeader}>
        <p className={sectionLabel}>Escalation</p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">
          Risk Watchlist
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Highest-priority active CRs based on risk, blockage, and due dates.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr className="border-b border-slate-200">
              {[
                "CR",
                "Title",
                "Owner",
                "Status",
                "Priority",
                "Due",
                "Drivers",
                "Updated",
              ].map((header) => (
                <th key={header} className="px-4 py-2 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-slate-500" colSpan={8}>
                  No active risk watch items.
                </td>
              </tr>
            ) : null}
            {rows.map((row) => (
              <tr key={row.crNumber} className="border-b border-slate-100">
                <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                  {row.crNumber}
                </td>
                <td className="max-w-[280px] px-4 py-3">
                  <p className="truncate font-medium text-slate-950">
                    {row.title}
                  </p>
                  <p className="mt-1 truncate text-slate-500">
                    {row.board} / {row.gate}
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-700">{row.owner}</td>
                <td className="px-4 py-3">
                  <Badge className={statusTone[row.status]}>{row.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={priorityTone[row.priority]}>
                    {row.priority}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-700">{row.dueLabel}</td>
                <td className="max-w-[260px] px-4 py-3 text-slate-700">
                  <span className="line-clamp-2">{row.drivers}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{row.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RequestWorkspace({
  crs,
  loading,
  selectedId: explicitSelectedId,
  selectedCr,
  scope,
  viewMode,
  owners,
  statusFilter,
  priorityFilter,
  riskFilter,
  boardFilter,
  classificationFilter,
  ownerFilter,
  search,
  movingId,
  onSelect,
  onViewModeChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onRiskFilterChange,
  onBoardFilterChange,
  onClassificationFilterChange,
  onOwnerFilterChange,
  onSearchChange,
  onKanbanStatusChange,
}: {
  crs: Cr[];
  loading: boolean;
  selectedId: CrId | null;
  selectedCr: Cr | null;
  scope: CrScope;
  viewMode: ViewMode;
  owners: string[];
  statusFilter: StatusFilter;
  priorityFilter: Priority | "All";
  riskFilter: Risk | "All";
  boardFilter: BoardFilter;
  classificationFilter: ClassificationFilter;
  ownerFilter: string;
  search: string;
  movingId: CrId | null;
  onSelect: (id: CrId) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onPriorityFilterChange: (value: Priority | "All") => void;
  onRiskFilterChange: (value: Risk | "All") => void;
  onBoardFilterChange: (value: BoardFilter) => void;
  onClassificationFilterChange: (value: ClassificationFilter) => void;
  onOwnerFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onKanbanStatusChange: (cr: Cr, status: CrStatus) => void;
}) {
  const selectedId = selectedCr?._id ?? null;
  const whiteboardSelectedId =
    explicitSelectedId && crs.some((cr) => cr._id === explicitSelectedId)
      ? explicitSelectedId
      : null;

  return (
    <>
      <ViewControls
        scope={scope}
        viewMode={viewMode}
        count={crs.length}
        onViewModeChange={onViewModeChange}
      />
      <FilterBar
        owners={owners}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        riskFilter={riskFilter}
        boardFilter={boardFilter}
        classificationFilter={classificationFilter}
        ownerFilter={ownerFilter}
        search={search}
        onStatusFilterChange={onStatusFilterChange}
        onPriorityFilterChange={onPriorityFilterChange}
        onRiskFilterChange={onRiskFilterChange}
        onBoardFilterChange={onBoardFilterChange}
        onClassificationFilterChange={onClassificationFilterChange}
        onOwnerFilterChange={onOwnerFilterChange}
        onSearchChange={onSearchChange}
      />

      {viewMode === "list" ? (
        <section
          id="requests"
          className="grid gap-5 min-[1180px]:grid-cols-[430px_minmax(0,1fr)]"
        >
          <CrList
            crs={crs}
            loading={loading}
            selectedId={selectedId}
            title={scopeTitle(scope)}
            onSelect={onSelect}
          />
          <CrDetails key={selectedId ?? "empty"} cr={selectedCr} />
        </section>
      ) : viewMode === "excel" ? (
        <section
          id="requests"
          className="grid gap-5 min-[1280px]:grid-cols-[minmax(0,1fr)_430px]"
        >
          <CrSharePointList
            crs={crs}
            loading={loading}
            selectedId={selectedId}
            onSelect={onSelect}
          />
          <CrDetails key={selectedId ?? "empty"} cr={selectedCr} />
        </section>
      ) : viewMode === "kanban" ? (
        <section
          id="requests"
          className="grid gap-5 min-[1180px]:grid-cols-[minmax(0,1fr)_430px]"
        >
          <KanbanBoard
            crs={crs}
            loading={loading}
            selectedId={selectedId}
            movingId={movingId}
            onSelect={onSelect}
            onStatusChange={onKanbanStatusChange}
          />
          <CrDetails key={selectedId ?? "empty"} cr={selectedCr} />
        </section>
      ) : (
        <section id="requests">
          <CrWhiteboard
            crs={crs}
            loading={loading}
            selectedId={whiteboardSelectedId}
            onSelect={onSelect}
          />
        </section>
      )}
    </>
  );
}

function WorkspaceRibbon({
  onCreate,
  onAssistantToggle,
  onSettings,
  isAssistantOpen,
  isFullscreen,
  fullscreenSupported,
  onFullscreenToggle,
}: {
  onCreate: () => void;
  onAssistantToggle: () => void;
  onSettings: () => void;
  isAssistantOpen: boolean;
  isFullscreen: boolean;
  fullscreenSupported: boolean;
  onFullscreenToggle: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-end border-b border-gray-200 bg-white px-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCreate}
          className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
          aria-label="New CR"
          title="New CR"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onAssistantToggle}
          className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
          aria-label={
            isAssistantOpen ? "Hide AI assistant" : "Show AI assistant"
          }
          title={isAssistantOpen ? "Hide AI assistant" : "Show AI assistant"}
        >
          {isAssistantOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onFullscreenToggle}
          disabled={!fullscreenSupported}
          className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={isFullscreen ? "Exit app fullscreen" : "Fullscreen app"}
          title={
            fullscreenSupported
              ? isFullscreen
                ? "Exit app fullscreen"
                : "Fullscreen app"
              : "Fullscreen is unavailable"
          }
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onSettings}
          className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
          aria-label="Dashboard settings"
          title="Dashboard settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function SettingsPage({
  signedInName,
  signedInEmail,
  profilePhotoUrl,
  localOwner,
  viewMode,
  boardFilter,
  onLocalOwnerChange,
  onProfilePhotoChange,
  onViewModeChange,
  onBoardFilterChange,
  onSignOut,
}: {
  signedInName: string;
  signedInEmail: string | null;
  profilePhotoUrl: string | null;
  localOwner: string;
  viewMode: ViewMode;
  boardFilter: BoardFilter;
  onLocalOwnerChange: (owner: string) => void;
  onProfilePhotoChange: (photoUrl: string | null) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onBoardFilterChange: (board: BoardFilter) => void;
  onSignOut: () => void;
}) {
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const [profilePhotoMessage, setProfilePhotoMessage] = useState("");

  function handleProfilePhotoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfilePhotoMessage("Choose an image file.");
      return;
    }

    if (file.size > maxProfilePhotoBytes) {
      setProfilePhotoMessage("Choose an image under 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setProfilePhotoMessage("Unable to load that image.");
        return;
      }
      onProfilePhotoChange(reader.result);
      setProfilePhotoMessage("Profile photo updated.");
    };
    reader.onerror = () => {
      setProfilePhotoMessage("Unable to load that image.");
    };
    reader.readAsDataURL(file);
  }

  function handleDefaultProfilePhoto() {
    onProfilePhotoChange(null);
    setProfilePhotoMessage("Default photo restored.");
  }

  return (
    <section className="space-y-5">
      <div
        className={cn(
          panelShell,
          "flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between",
        )}
      >
        <div>
          <p className={sectionLabel}>Collins Aerospace</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-950">
            Settings
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Manage profile details and ECC dashboard defaults.
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-3 border border-gray-200 bg-gray-50 px-4 py-3">
          <ProfileAvatar
            name={signedInName}
            email={signedInEmail}
            photoUrl={profilePhotoUrl}
            size="lg"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-gray-950">
              {signedInName}
            </p>
            {signedInEmail ? (
              <p className="truncate text-sm text-gray-500">{signedInEmail}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className={cn(panelShell, "p-5")}>
          <div>
            <p className={sectionLabel}>Profile</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">
              Account details
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Your profile is used for owner-focused queues and ECC activity
              history.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
            <ProfileAvatar
              name={signedInName}
              email={signedInEmail}
              photoUrl={profilePhotoUrl}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className={cn("mb-2", sectionLabel)}>Profile photo</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="inline-flex h-9 items-center gap-2 border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
                >
                  <Upload className="h-4 w-4" />
                  Change photo
                </button>
                <button
                  type="button"
                  onClick={handleDefaultProfilePhoto}
                  disabled={!profilePhotoUrl}
                  className="inline-flex h-9 items-center gap-2 border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Use default
                </button>
              </div>
              {profilePhotoMessage ? (
                <p className="mt-2 text-xs font-medium text-gray-500">
                  {profilePhotoMessage}
                </p>
              ) : null}
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoFile}
                className="sr-only"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className={cn("mb-1 block", sectionLabel)}>
                First name last name
              </span>
              <Input
                value={localOwner}
                onChange={(event) => onLocalOwnerChange(event.target.value)}
                placeholder="Owner name"
                className="bg-white"
              />
            </label>
            <label className="block">
              <span className={cn("mb-1 block", sectionLabel)}>Email</span>
              <Input
                value={signedInEmail ?? ""}
                readOnly
                className="bg-gray-50 text-gray-500"
              />
            </label>
          </div>
        </section>

        <aside className={cn(panelShell, "p-5")}>
          <p className={sectionLabel}>Session</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-950">
            Account access
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <dt className="text-gray-500">Workspace</dt>
              <dd className="font-semibold text-gray-950">ECC</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">Role</dt>
              <dd className="font-semibold text-gray-950">Member</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-6 w-full border border-gray-950 bg-gray-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Sign out
          </button>
        </aside>
      </div>

      <section className={cn(panelShell, "p-5")}>
        <p className={sectionLabel}>Dashboard</p>
        <h2 className="mt-1 text-xl font-semibold text-gray-950">
          Dashboard defaults
        </h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <p className={cn("mb-2", sectionLabel)}>Default view</p>
            <div className="inline-flex border border-gray-200 bg-gray-50 p-1">
              {(["list", "excel", "kanban", "whiteboard"] as const).map(
                (mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onViewModeChange(mode)}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold capitalize transition",
                      viewMode === mode
                        ? "bg-white text-gray-950"
                        : "text-gray-500 hover:text-gray-950",
                    )}
                  >
                    {mode === "excel" ? "Excel List" : mode}
                  </button>
                ),
              )}
            </div>
          </div>
          <Select
            label="ECC council filter"
            value={boardFilter}
            onChange={(value) => onBoardFilterChange(value as BoardFilter)}
            options={["All", ...eccBoards]}
          />
        </div>
      </section>
    </section>
  );
}

function ProfileAvatar({
  name,
  email,
  photoUrl,
  size = "md",
}: {
  name: string;
  email: string | null;
  photoUrl?: string | null;
  size?: "md" | "lg";
}) {
  const initials = getProfileInitials(name, email);
  const sizeClass = size === "lg" ? "h-16 w-16 text-lg" : "h-10 w-10 text-sm";
  if (photoUrl) {
    return (
      <span
        className={cn(
          "block shrink-0 rounded-full border border-gray-300 bg-cover bg-center bg-no-repeat",
          sizeClass,
        )}
        style={{ backgroundImage: `url(${photoUrl})` }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-950 font-semibold text-white",
        sizeClass,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function AuthLoadingScreen() {
  return (
    <main className="collins-dashboard flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-950">
      <section className="w-full max-w-md border border-gray-200 bg-white p-6">
        <Image
          src="/collins-aerospace-logo.svg"
          alt="Collins Aerospace"
          width={190}
          height={47}
          className="h-11 w-auto"
          priority
        />
        <div className="mt-8 flex items-center gap-3 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking secure session
        </div>
      </section>
    </main>
  );
}

function LoginScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email,
        });
        if (result.error) {
          throw new Error(result.error.message ?? "Unable to create account.");
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });
        if (result.error) {
          throw new Error(result.error.message ?? "Unable to sign in.");
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="collins-dashboard flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-950">
      <section className="grid w-full max-w-5xl overflow-hidden border border-gray-200 bg-white lg:grid-cols-[minmax(0,1fr)_430px]">
        <div className="flex min-h-[540px] flex-col border-b border-gray-200 p-8 pt-20 lg:border-b-0 lg:border-r">
          <div>
            <Image
              src="/collins-aerospace-logo.svg"
              alt="Collins Aerospace"
              width={220}
              height={55}
              className="h-12 w-auto"
              priority
            />
            <p className={cn("mt-10", sectionLabel)}>
              Engineering Change Council
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-normal text-gray-950">
              ECC Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-600">
              Sign in to access Collins Aerospace ECC requests, approvals,
              actions, and review queue.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center p-6"
        >
          <div className="mb-6 inline-flex border border-gray-200 bg-gray-50 p-1">
            {(["signin", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setError("");
                }}
                className={cn(
                  "px-4 py-2 text-sm font-semibold transition",
                  mode === item
                    ? "bg-white text-gray-950"
                    : "text-gray-500 hover:text-gray-950",
                )}
              >
                {item === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div>
            <p className={sectionLabel}>Secure access</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-950">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            {mode === "signup" ? (
              <label className="block">
                <span className={cn("mb-1 block", sectionLabel)}>Name</span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
            ) : null}

            <label className="block">
              <span className={cn("mb-1 block", sectionLabel)}>Email</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@collins.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className={cn("mb-1 block", sectionLabel)}>Password</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8 characters minimum"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                minLength={8}
                required
              />
            </label>
          </div>

          {error ? (
            <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
      </section>
    </main>
  );
}

function MetricStrip({ stats }: { stats: ReturnType<typeof buildStats> }) {
  const metrics = [
    {
      label: "Active CRs",
      value: stats.open,
      detail: `${stats.total} total at Collins`,
      tone: "bg-gray-950 text-white",
      accent: "bg-gray-950",
      icon: CircleDot,
    },
    {
      label: "Blocked",
      value: stats.blocked,
      detail: "Needs executive attention",
      tone: "bg-rose-50 text-rose-700",
      accent: "bg-red-600",
      icon: AlertTriangle,
    },
    {
      label: "Due Soon",
      value: stats.dueSoon,
      detail: "Target date in 14 days",
      tone: "bg-gray-100 text-gray-800",
      accent: "bg-gray-500",
      icon: CalendarClock,
    },
    {
      label: "High Risk",
      value: stats.highRisk,
      detail: "Escalation watchlist",
      tone: "bg-red-50 text-red-700",
      accent: "bg-red-600",
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
            className={cn(panelShell, "overflow-hidden p-4")}
          >
            <div className={cn("-mx-4 -mt-4 mb-4 h-1", metric.accent)} />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={sectionLabel}>{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
              </div>
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center",
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

function TrackerSidebar({
  isOpen,
  boardFilter,
  activeSection,
  signedInName,
  signedInEmail,
  profilePhotoUrl,
  onBoardFilterChange,
  onSectionChange,
  onToggle,
}: {
  isOpen: boolean;
  boardFilter: BoardFilter;
  activeSection: DashboardSection;
  signedInName: string;
  signedInEmail: string | null;
  profilePhotoUrl: string | null;
  onBoardFilterChange: (board: BoardFilter) => void;
  onSectionChange: (section: DashboardSection) => void;
  onToggle: () => void;
}) {
  const navItemBySection: Record<
    SidebarNavSection,
    {
      section: SidebarNavSection;
      label: string;
      icon: LucideIcon;
    }
  > = {
    dashboard: {
      section: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    workflow: {
      section: "workflow" as const,
      label: "Workflow",
      icon: GitBranch,
    },
    allCrs: {
      section: "allCrs" as const,
      label: "All CRs",
      icon: CircleDot,
    },
    myCrs: {
      section: "myCrs" as const,
      label: "My CRs",
      icon: UserRound,
    },
    analytics: {
      section: "analytics" as const,
      label: "Analytics",
      icon: BarChart3,
    },
  };
  const navOrderSnapshot = useSyncExternalStore(
    subscribeToSidebarNavOrderStorage,
    readSidebarNavOrderSnapshot,
    getDefaultSidebarNavOrderSnapshot,
  );
  const navOrder = useMemo(
    () => parseSidebarNavOrderSnapshot(navOrderSnapshot),
    [navOrderSnapshot],
  );
  const navItems = navOrder.map((section) => navItemBySection[section]);
  const [draggingNavSection, setDraggingNavSection] =
    useState<SidebarNavSection | null>(null);
  const [dragOverNavSection, setDragOverNavSection] =
    useState<SidebarNavSection | null>(null);

  function handleNavDragStart(
    event: DragEvent<HTMLElement>,
    section: SidebarNavSection,
  ) {
    setDraggingNavSection(section);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", section);
    const navItem = event.currentTarget.closest("[data-sidebar-nav-item]");
    if (navItem instanceof HTMLElement) {
      event.dataTransfer.setDragImage(navItem, 12, navItem.offsetHeight / 2);
    }
  }

  function handleNavDragOver(
    event: DragEvent<HTMLElement>,
    section: SidebarNavSection,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverNavSection(section);
  }

  function handleNavDrop(
    event: DragEvent<HTMLElement>,
    targetSection: SidebarNavSection,
  ) {
    event.preventDefault();
    const sourceSection =
      normalizeSidebarNavSection(event.dataTransfer.getData("text/plain")) ??
      draggingNavSection;

    if (sourceSection && sourceSection !== targetSection) {
      writeSidebarNavOrder(
        reorderSidebarNavOrder(navOrder, sourceSection, targetSection),
      );
      notifySidebarNavOrderStorageChange();
    }

    setDraggingNavSection(null);
    setDragOverNavSection(null);
  }

  function handleNavDragEnd() {
    setDraggingNavSection(null);
    setDragOverNavSection(null);
  }

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white transition-all duration-200",
        isOpen ? "w-64" : "w-16",
      )}
    >
      <div
        className={cn(
          "flex min-h-[68px] shrink-0 items-center border-b border-gray-200 p-3",
          isOpen ? "justify-between gap-3" : "justify-center",
        )}
      >
        {isOpen ? (
          <a
            href="#dashboard"
            onClick={() => onSectionChange("dashboard")}
            className="block min-w-0 shrink"
            aria-label="Collins Aerospace"
          >
            <Image
              src="/collins-aerospace-logo.svg"
              alt="Collins Aerospace"
              width={184}
              height={46}
              className="h-10 w-auto max-w-[170px]"
              priority
            />
          </a>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "p-1.5 text-gray-600 transition hover:bg-gray-100 hover:text-gray-950",
            isOpen && "ml-auto",
          )}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          title={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 pt-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.section;
            const dragging = draggingNavSection === item.section;
            const dragOver =
              dragOverNavSection === item.section &&
              draggingNavSection !== item.section;

            return isOpen ? (
              <div
                key={item.label}
                data-sidebar-nav-item
                onDragOver={(event) => handleNavDragOver(event, item.section)}
                onDragLeave={() => setDragOverNavSection(null)}
                onDrop={(event) => handleNavDrop(event, item.section)}
                className={cn(
                  "group flex w-full items-center justify-between gap-2 border-l-2 text-sm transition",
                  active
                    ? "border-gray-950 bg-gray-100 text-gray-950"
                    : "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950",
                  dragging && "opacity-50",
                  dragOver && "border-gray-950 bg-gray-100",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSectionChange(item.section)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left font-semibold outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
                <button
                  type="button"
                  draggable
                  onDragStart={(event) =>
                    handleNavDragStart(event, item.section)
                  }
                  onDragEnd={handleNavDragEnd}
                  className="mr-1 flex h-8 w-8 shrink-0 cursor-grab items-center justify-center text-gray-400 opacity-0 transition hover:text-gray-700 group-hover:opacity-100 active:cursor-grabbing focus-visible:outline-none focus-visible:text-gray-700 focus-visible:opacity-100"
                  aria-label={`${item.label}. Drag to reorder.`}
                  title="Drag to reorder"
                >
                  <GripVertical aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                key={item.label}
                type="button"
                onDragOver={(event) => handleNavDragOver(event, item.section)}
                onDragLeave={() => setDragOverNavSection(null)}
                onDrop={(event) => handleNavDrop(event, item.section)}
                onClick={() => onSectionChange(item.section)}
                className={cn(
                  "flex h-10 w-full items-center justify-center border-l-2 text-sm font-semibold transition outline-none focus-visible:ring-1 focus-visible:ring-gray-950",
                  active
                    ? "border-gray-950 bg-gray-100 text-gray-950"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950",
                  dragging && "opacity-50",
                  dragOver && "border-gray-950 bg-gray-100",
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {isOpen ? (
          <div className="mt-3 space-y-4">
            <div className="border-t border-gray-200 pt-3">
              <p className={cn("mb-2", sectionLabel)}>ECC Councils</p>
              <div className="space-y-1">
                {eccBoards.map((board) => (
                  <button
                    key={board}
                    type="button"
                    onClick={() => onBoardFilterChange(board)}
                    className={cn(
                      "flex w-full items-center border-l-2 px-3 py-2 text-left text-sm transition outline-none focus-visible:ring-1 focus-visible:ring-gray-950",
                      boardFilter === board
                        ? "border-gray-950 bg-gray-100 text-gray-950"
                        : "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950",
                    )}
                  >
                    <span className="truncate">{board}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </nav>

      {isOpen ? (
        <div className="border-t border-gray-200 p-3">
          <button
            type="button"
            onClick={() => onSectionChange("settings")}
            className={cn(
              "flex w-full min-w-0 items-center gap-3 border-l-2 border-transparent px-3 py-2 text-left transition hover:border-gray-300 hover:bg-gray-100",
              activeSection === "settings" && "border-gray-950 bg-gray-100",
            )}
            aria-label="Open settings"
            title="Open settings"
          >
            <ProfileAvatar
              name={signedInName}
              email={signedInEmail}
              photoUrl={profilePhotoUrl}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-950">
                {signedInName}
              </p>
              {signedInEmail ? (
                <p className="truncate text-xs text-gray-500">
                  {signedInEmail}
                </p>
              ) : null}
            </div>
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function ViewControls({
  scope,
  viewMode,
  count,
  onViewModeChange,
}: {
  scope: CrScope;
  viewMode: ViewMode;
  count: number;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  const viewItems: Array<{
    id: ViewMode;
    label: string;
    icon: typeof List;
  }> = [
    { id: "list", label: "List", icon: List },
    { id: "excel", label: "Excel List", icon: Table2 },
    { id: "kanban", label: "Kanban", icon: Kanban },
    { id: "whiteboard", label: "Whiteboard", icon: StickyNote },
  ];

  return (
    <section
      className={cn(
        panelShell,
        "flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <div>
        <p className={sectionLabel}>{scopeTitle(scope)}</p>
        <p className="text-sm text-slate-600">{count} requests shown</p>
      </div>
      <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-1">
        {viewItems.map((item) => {
          const Icon = item.icon;
          const active = viewMode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewModeChange(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm transition",
                active
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-950",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FilterBar({
  owners,
  statusFilter,
  priorityFilter,
  riskFilter,
  boardFilter,
  classificationFilter,
  ownerFilter,
  search,
  onStatusFilterChange,
  onPriorityFilterChange,
  onRiskFilterChange,
  onBoardFilterChange,
  onClassificationFilterChange,
  onOwnerFilterChange,
  onSearchChange,
}: {
  owners: string[];
  statusFilter: StatusFilter;
  priorityFilter: Priority | "All";
  riskFilter: Risk | "All";
  boardFilter: BoardFilter;
  classificationFilter: ClassificationFilter;
  ownerFilter: string;
  search: string;
  onStatusFilterChange: (value: StatusFilter) => void;
  onPriorityFilterChange: (value: Priority | "All") => void;
  onRiskFilterChange: (value: Risk | "All") => void;
  onBoardFilterChange: (value: BoardFilter) => void;
  onClassificationFilterChange: (value: ClassificationFilter) => void;
  onOwnerFilterChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}) {
  return (
    <section id="filters" className={cn(panelShell, "p-3")}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={sectionLabel}>Filters</p>
          <p className="text-sm text-slate-600">
            Segment the Collins Aerospace request queue.
          </p>
        </div>
        <SlidersHorizontal className="h-4 w-4 text-slate-400" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(6,minmax(120px,170px))]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="bg-white pl-9"
            placeholder="Search CRs, systems, owners, tags..."
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
          onChange={(value) =>
            onPriorityFilterChange(value as Priority | "All")
          }
          options={["All", ...priorities]}
        />
        <Select
          label="Risk"
          value={riskFilter}
          onChange={(value) => onRiskFilterChange(value as Risk | "All")}
          options={["All", ...risks]}
        />
        <Select
          label="Board"
          value={boardFilter}
          onChange={(value) => onBoardFilterChange(value as BoardFilter)}
          options={["All", ...eccBoards]}
        />
        <Select
          label="Class"
          value={classificationFilter}
          onChange={(value) =>
            onClassificationFilterChange(value as ClassificationFilter)
          }
          options={["All", ...classifications]}
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

function NewCrModal({
  createCr,
  onCreated,
  onCancel,
}: {
  createCr: ReturnType<typeof useMutation<typeof api.crs.create>>;
  onCreated: (id: CrId) => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-950/45 px-4 py-8 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-cr-dialog-title"
        className="w-full max-w-7xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <NewCrPanel
          createCr={createCr}
          onCreated={onCreated}
          onCancel={onCancel}
        />
      </div>
    </div>
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
  const [isIntakeAssistantOpen, setIsIntakeAssistantOpen] = useState(true);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const id = await createCr(formToCreateArgs(form));
      onCreated(id);
      setForm(defaultCrForm());
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create CR.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={cn(panelShell, "p-4")}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className={sectionLabel}>Create request</p>
          <h2
            id="new-cr-dialog-title"
            className="mt-1 text-base font-semibold text-slate-950"
          >
            New PWES Military ECC CR
          </h2>
          <p className="text-sm text-slate-500">
            Capture the CR intake fields for council review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsIntakeAssistantOpen((value) => !value)}
            className={cn(
              "flex h-9 w-9 items-center justify-center border transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950",
              isIntakeAssistantOpen
                ? "border-gray-950 bg-gray-950 text-white hover:bg-gray-900 hover:text-white"
                : "border-gray-200 text-gray-700",
            )}
            aria-label={
              isIntakeAssistantOpen ? "Hide AI intake" : "Show AI intake"
            }
            title={isIntakeAssistantOpen ? "Hide AI intake" : "Show AI intake"}
          >
            {isIntakeAssistantOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            title="Close form"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        className={cn(
          "grid gap-5",
          isIntakeAssistantOpen && "xl:grid-cols-[minmax(0,1fr)_340px]",
        )}
      >
        <CrForm
          form={form}
          setForm={setForm}
          error={error}
          saving={saving}
          submitLabel="Create CR"
          onSubmit={handleSubmit}
          variant="create"
        />
        {isIntakeAssistantOpen ? (
          <CrIntakeAssistant
            onApply={(fields) =>
              setForm((currentForm) => applyIntakeFields(currentForm, fields))
            }
          />
        ) : null}
      </div>
    </section>
  );
}

function CrIntakeAssistant({
  onApply,
}: {
  onApply: (fields: IntakeFields) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<IntakeImageState | null>(null);
  const [prompt, setPrompt] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function handleImageFile(file: File) {
    setError("");
    setStatus("");

    try {
      setImage(await readScreenshotFile(file));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to read screenshot.",
      );
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) =>
      item.type.startsWith("image/"),
    );
    const pastedText = event.clipboardData.getData("text");

    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        event.preventDefault();
        void handleImageFile(file);
      }
      return;
    }

    if (pastedText && !prompt.trim()) {
      setPrompt(pastedText);
    }
  }

  async function handleExtract() {
    setError("");
    setStatus("");

    if (!prompt.trim() && !image) {
      setError("Add a screenshot or notes.");
      return;
    }

    setExtracting(true);
    try {
      const response = await fetch("/api/cr-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image: image
            ? {
                mimeType: image.mimeType,
                base64: image.base64,
              }
            : null,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        fields?: IntakeFields;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error || "Unable to fill the CR fields.");
      }

      onApply(data?.fields ?? {});
      setStatus("Fields filled. Review before creating.");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to fill the CR fields.",
      );
    } finally {
      setExtracting(false);
    }
  }

  return (
    <aside className="border-t border-gray-200 pt-4 xl:border-l xl:border-t-0 xl:pl-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={sectionLabel}>AI intake</p>
          <h3 className="mt-1 text-sm font-semibold text-gray-950">
            Screenshot or notes
          </h3>
        </div>
        {image ? (
          <button
            type="button"
            onClick={() => {
              setImage(null);
              setStatus("");
              setError("");
            }}
            className="border border-gray-200 bg-white p-2 text-gray-500 transition hover:border-gray-300 hover:text-gray-950"
            title="Remove screenshot"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div
        className="mt-4 border border-dashed border-gray-300 bg-gray-50 p-3"
        onPaste={handlePaste}
        tabIndex={0}
      >
        {image ? (
          <div className="space-y-2">
            <Image
              src={image.dataUrl}
              alt=""
              width={320}
              height={180}
              unoptimized
              className="max-h-44 w-full border border-gray-200 bg-white object-contain"
            />
            <p className="truncate text-xs font-medium text-gray-500">
              {image.name}
            </p>
          </div>
        ) : (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
            <Upload className="h-5 w-5 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700">Screenshot</p>
            <p className="text-xs text-gray-500">Paste or upload</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImageFile(file);
          }
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-950"
      >
        <Upload className="h-4 w-4" />
        Upload screenshot
      </button>

      <label className="mt-4 block">
        <span className={cn("mb-1 block", sectionLabel)}>Chat / notes</span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onPaste={handlePaste}
          placeholder="Paste CR notes or type what to create."
          className="min-h-28 w-full resize-y border border-input bg-white px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </label>

      {error ? (
        <p className="mt-2 text-sm font-medium text-rose-700">{error}</p>
      ) : null}
      {status ? (
        <p className="mt-2 text-sm font-medium text-emerald-700">{status}</p>
      ) : null}

      <Button
        type="button"
        className="mt-3 w-full"
        disabled={extracting || (!prompt.trim() && !image)}
        onClick={() => void handleExtract()}
      >
        {extracting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Fill fields
      </Button>
    </aside>
  );
}

function CrList({
  crs,
  loading,
  selectedId,
  title,
  onSelect,
}: {
  crs: Cr[];
  loading: boolean;
  selectedId: CrId | null;
  title: string;
  onSelect: (id: CrId) => void;
}) {
  return (
    <section className={cn(panelShell, "min-h-[520px] overflow-hidden")}>
      <div className={cn(panelHeader, "flex items-center justify-between")}>
        <div>
          <p className={sectionLabel}>Request queue</p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">
            {title}
          </h2>
          <p className="text-xs text-slate-500">{crs.length} requests shown</p>
        </div>
        <RefreshCw
          className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")}
        />
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading CRs
          </div>
        ) : null}
        {!loading && crs.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No Collins Aerospace requests match the current filters.
          </div>
        ) : null}
        {crs.map((cr) => (
          <button
            key={cr._id}
            onClick={() => onSelect(cr._id)}
            className={cn(
              "block w-full px-4 py-3 text-left transition hover:bg-slate-50",
              selectedId === cr._id &&
                "border-l-4 border-l-red-600 bg-red-50/70 pl-3",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-slate-700">
                    {cr.crNumber}
                  </span>
                  <Badge className={statusTone[cr.status]}>{cr.status}</Badge>
                </div>
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950">
                  {cr.title}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={priorityTone[cr.priority]}>
                  {cr.priority}
                </Badge>
                <span className="text-xs text-slate-500">
                  {cr.currentGate ?? "No gate"}
                </span>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{cr.owner}</span>
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{dueLabel(cr)}</span>
              </span>
              <span className="truncate sm:col-span-2">
                {(cr.eccBoard ?? "Other") +
                  " / " +
                  (cr.classification ?? "TBD")}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function CrSharePointList({
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
  const columns = [
    "CR #",
    "Title",
    "Status",
    "Priority",
    "Risk",
    "Owner",
    "Board",
    "Class",
    "Gate",
    "Meeting",
    "Need-by",
    "NCDOC",
    "Supplier",
    "Charge #",
    "Updated",
  ];

  return (
    <section
      className={cn(
        panelShell,
        "min-h-[620px] overflow-hidden border-t-2 border-t-emerald-600",
      )}
    >
      <div className={cn(panelHeader, "flex items-center justify-between")}>
        <div>
          <p className={sectionLabel}>Excel list</p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">
            SharePoint-style CR register
          </h2>
          <p className="text-xs text-slate-500">{crs.length} rows shown</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              downloadAnalyticsWorkbook(crs, "Filtered register", "ecc-crs")
            }
            disabled={crs.length === 0}
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Table2 className="h-4 w-4 text-slate-400" />
          <RefreshCw
            className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading CRs
        </div>
      ) : null}

      {!loading && crs.length === 0 ? (
        <div className="p-6 text-sm text-slate-500">
          No Collins Aerospace requests match the current filters.
        </div>
      ) : null}

      {!loading && crs.length > 0 ? (
        <div className="max-h-[720px] overflow-auto bg-white">
          <table className="w-full min-w-[1520px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[#f3f7f5] text-slate-600">
              <tr className="border-b border-slate-300">
                {columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="border-r border-slate-200 px-3 py-2 font-semibold"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crs.map((cr) => {
                const selected = selectedId === cr._id;
                return (
                  <tr
                    key={cr._id}
                    className={cn(
                      "border-b border-slate-100 hover:bg-slate-50",
                      selected && "bg-emerald-50/80 hover:bg-emerald-50",
                    )}
                  >
                    <td className="border-r border-slate-100 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => onSelect(cr._id)}
                        className="font-mono font-semibold text-slate-800 underline-offset-2 hover:text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                      >
                        {cr.crNumber}
                      </button>
                    </td>
                    <td className="max-w-[320px] border-r border-slate-100 px-3 py-2">
                      <p className="truncate font-medium text-slate-950">
                        {cr.title}
                      </p>
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      <Badge className={statusTone[cr.status]}>
                        {cr.status}
                      </Badge>
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      <Badge className={priorityTone[cr.priority]}>
                        {cr.priority}
                      </Badge>
                    </td>
                    <td
                      className={cn(
                        "border-r border-slate-100 px-3 py-2 font-semibold",
                        riskTone[cr.risk],
                      )}
                    >
                      {cr.risk}
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      {cr.owner}
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      {cr.eccBoard ?? "Other"}
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      {cr.classification ?? "TBD"}
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      {cr.currentGate ?? "None"}
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      {[cr.meetingDate, cr.meetingTimeEst]
                        .filter(Boolean)
                        .join(" ") || "No date"}
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      {cr.targetDate ? dueLabel(cr) : "No target"}
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      {cr.ncdocNumber ?? "Not set"}
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      {cr.supplier ?? "Not set"}
                    </td>
                    <td className="border-r border-slate-100 px-3 py-2">
                      {cr.wbsChargeNumber ?? "Not set"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-slate-500">
                        {formatTimestamp(cr.lastUpdatedAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function WorkflowWorkspace({
  crs,
  loading,
  selectedCr,
  selectedId,
  scope,
  onSelect,
}: {
  crs: Cr[];
  loading: boolean;
  selectedCr: Cr | null;
  selectedId: CrId | null;
  scope: CrScope;
  onSelect: (id: CrId) => void;
}) {
  const currentPhase = selectedCr
    ? getWorkflowCurrentPhase(selectedCr)
    : "None";

  return (
    <section id="workflow" className="space-y-5">
      <div className={cn(panelShell, "p-6")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className={sectionLabel}>Engineering Change Council</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-950">
              Workflow
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-gray-600">
              Phase flow for each CR from intake through council review,
              approvals, records, and closure.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 xl:min-w-[620px]">
            <Info label="Scope" value={scopeTitle(scope)} />
            <Info label="Requests" value={`${crs.length}`} />
            <Info label="Current Phase" value={currentPhase} />
            <Info label="Selected" value={selectedCr?.crNumber ?? "None"} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <WorkflowCrPicker
          crs={crs}
          loading={loading}
          selectedId={selectedId}
          onSelect={onSelect}
        />
        <WorkflowChart cr={selectedCr} loading={loading} />
      </div>
    </section>
  );
}

function WorkflowCrPicker({
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
    <section className={cn(panelShell, "min-h-[580px] overflow-hidden")}>
      <div className={cn(panelHeader, "flex items-center justify-between")}>
        <div>
          <p className={sectionLabel}>CR Queue</p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">
            Workflow CRs
          </h2>
          <p className="text-xs text-slate-500">{crs.length} requests shown</p>
        </div>
        <RefreshCw
          className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")}
        />
      </div>

      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading CRs
          </div>
        ) : null}
        {!loading && crs.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No Collins Aerospace requests match the current filters.
          </div>
        ) : null}
        {crs.map((cr) => {
          const phase = getWorkflowCurrentPhase(cr);
          return (
            <button
              key={cr._id}
              onClick={() => onSelect(cr._id)}
              className={cn(
                "block w-full px-4 py-3 text-left transition hover:bg-slate-50",
                selectedId === cr._id &&
                  "border-l-4 border-l-red-600 bg-red-50/70 pl-3",
              )}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-mono text-sm font-semibold text-slate-700">
                    {cr.crNumber}
                  </span>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950">
                    {cr.title}
                  </h3>
                </div>
                <Badge className={priorityTone[cr.priority]}>
                  {cr.priority}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className={statusTone[cr.status]}>{cr.status}</Badge>
                <Badge className={neutralBadge}>{phase}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
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
          );
        })}
      </div>
    </section>
  );
}

function WorkflowChart({ cr, loading }: { cr: Cr | null; loading: boolean }) {
  const updateCr = useMutation(api.crs.update);
  const [savingTaskField, setSavingTaskField] =
    useState<TaskStateField | null>(null);
  const [taskError, setTaskError] = useState("");

  async function handleTaskStateChange(task: WorkflowTask, state: TaskState) {
    if (!cr || task.state === state || savingTaskField) {
      return;
    }

    setSavingTaskField(task.field);
    setTaskError("");
    try {
      await updateCr({
        id: cr._id,
        author: "Collins user",
        [task.field]: state,
      });
    } catch (caught) {
      setTaskError(
        caught instanceof Error
          ? caught.message
          : "Unable to update checklist.",
      );
    } finally {
      setSavingTaskField(null);
    }
  }

  if (loading) {
    return (
      <section className={cn(panelShell, "min-h-[580px] p-6")}>
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading workflow
        </div>
      </section>
    );
  }

  if (!cr) {
    return (
      <section className={cn(panelShell, "min-h-[580px] p-6")}>
        <p className={sectionLabel}>Workflow Chart</p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">
          No CR selected
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Select a Collins Aerospace request to view its phase flow.
        </p>
      </section>
    );
  }

  const phases = buildWorkflowPhases(cr);
  const currentPhase = getWorkflowCurrentPhase(cr);

  return (
    <section className={cn(panelShell, "min-h-[580px] overflow-hidden")}>
      <div className={panelHeader}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-700">
                {cr.crNumber}
              </span>
              <Badge className={statusTone[cr.status]}>{cr.status}</Badge>
              <Badge className={priorityTone[cr.priority]}>{cr.priority}</Badge>
              <Badge className={neutralBadge}>{currentPhase}</Badge>
            </div>
            <h2 className="text-lg font-semibold text-slate-950">{cr.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {cr.eccBoard ?? "Other"} / {cr.classification ?? "TBD"} /{" "}
              {cr.currentGate ?? "None"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:min-w-[520px]">
            <Info label="Owner" value={cr.owner} />
            <Info label="Meeting" value={cr.meetingDate ?? "No date"} />
            <Info label="Need-by" value={cr.targetDate ?? "No date"} />
            <Info label="Updated" value={formatTimestamp(cr.lastUpdatedAt)} />
          </div>
        </div>
      </div>

      <div className="p-5">
        {taskError ? (
          <p className="mb-4 border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {taskError}
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <div className="relative min-w-[1120px] pb-2 pt-8">
            <div className="absolute left-12 right-12 top-12 h-px bg-slate-200" />
            <div
              className="relative grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${phases.length}, minmax(128px, 1fr))`,
              }}
            >
              {phases.map((phase, index) => (
                <WorkflowPhaseCard
                  key={phase.id}
                  phase={phase}
                  position={index + 1}
                  savingTaskField={savingTaskField}
                  onTaskStateChange={(task, state) =>
                    void handleTaskStateChange(task, state)
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Info label="NCDOC Number" value={cr.ncdocNumber ?? "Not set"} />
          <Info label="Disposition" value={cr.disposition ?? "Not set"} />
          <Info
            label="Design Authority"
            value={cr.designAuthority ?? "Not set"}
          />
          <Info label="Charge Number" value={cr.wbsChargeNumber ?? "Not set"} />
        </div>
      </div>
    </section>
  );
}

function WorkflowPhaseCard({
  phase,
  position,
  savingTaskField,
  onTaskStateChange,
}: {
  phase: WorkflowPhase;
  position: number;
  savingTaskField: TaskStateField | null;
  onTaskStateChange: (task: WorkflowTask, state: TaskState) => void;
}) {
  const checklistSummary = workflowChecklistSummary(phase.tasks);
  const [isChecklistOpen, setIsChecklistOpen] = useState(
    phase.state === "active" || phase.state === "blocked",
  );

  return (
    <div className="relative">
      <div className="mb-3 flex justify-center">
        <span
          className={cn(
            "z-10 flex h-8 w-8 items-center justify-center border-2 text-xs font-semibold",
            workflowPhaseDotTone[phase.state],
          )}
        >
          {phase.state === "complete" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : phase.state === "blocked" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            String(position).padStart(2, "0")
          )}
        </span>
      </div>
      <div
        className={cn(
          "min-h-[230px] border p-3 shadow-sm",
          workflowPhaseTone[phase.state],
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={sectionLabel}>Phase {position}</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-950">
              {phase.label}
            </h3>
          </div>
          <Badge className={workflowPhaseBadgeTone[phase.state]}>
            {workflowPhaseStateLabel(phase.state)}
          </Badge>
        </div>
        <p className="mt-3 min-h-10 text-xs leading-5 text-slate-600">
          {phase.detail}
        </p>
        <details
          className="group mt-3 border border-slate-200 bg-white"
          open={isChecklistOpen}
          onToggle={(event) => setIsChecklistOpen(event.currentTarget.open)}
        >
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-2 py-2 text-xs">
            <span className="min-w-0">
              <span className="block font-semibold text-slate-800">
                Checklist
              </span>
              <span
                className={cn(
                  "block truncate font-medium",
                  checklistSummary.tone,
                )}
              >
                {checklistSummary.label}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
          </summary>
          <div className="space-y-2 border-t border-slate-100 p-2">
            {phase.tasks.length > 0 ? (
              phase.tasks.map((task) => (
                <WorkflowTaskChecklistRow
                  key={task.field}
                  task={task}
                  saving={savingTaskField === task.field}
                  disabled={Boolean(savingTaskField)}
                  onStateChange={(state) => onTaskStateChange(task, state)}
                />
              ))
            ) : (
              <div className="border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-500">
                Lifecycle status: {workflowPhaseStateLabel(phase.state)}
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}

function WorkflowTaskChecklistRow({
  task,
  saving,
  disabled,
  onStateChange,
}: {
  task: WorkflowTask;
  saving: boolean;
  disabled: boolean;
  onStateChange: (state: TaskState) => void;
}) {
  return (
    <div className="grid gap-2 border border-slate-200 bg-white px-2 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-slate-700">
          {task.label}
        </span>
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-red-600" />
        ) : (
          <span
            className={cn("shrink-0 font-semibold", taskStateTone(task.state))}
          >
            {task.state}
          </span>
        )}
      </div>
      <select
        aria-label={`${task.label} checklist status`}
        value={task.state}
        disabled={disabled}
        onChange={(event) => onStateChange(event.target.value as TaskState)}
        className="h-8 w-full border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-700 outline-none transition focus:border-gray-950 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {taskStates.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </select>
    </div>
  );
}

function KanbanBoard({
  crs,
  loading,
  selectedId,
  movingId,
  onSelect,
  onStatusChange,
}: {
  crs: Cr[];
  loading: boolean;
  selectedId: CrId | null;
  movingId: CrId | null;
  onSelect: (id: CrId) => void;
  onStatusChange: (cr: Cr, status: CrStatus) => void;
}) {
  return (
    <section className={cn(panelShell, "min-h-[620px] overflow-hidden")}>
      <div className={cn(panelHeader, "flex items-center justify-between")}>
        <div>
          <p className={sectionLabel}>Board view</p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">
            Gate Kanban
          </h2>
          <p className="text-xs text-slate-500">{crs.length} requests shown</p>
        </div>
        <RefreshCw
          className={cn("h-4 w-4 text-slate-400", loading && "animate-spin")}
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading CRs
        </div>
      ) : null}

      {!loading && crs.length === 0 ? (
        <div className="p-6 text-sm text-slate-500">
          No Collins Aerospace requests match the current filters.
        </div>
      ) : null}

      {!loading && crs.length > 0 ? (
        <div className="grid gap-3 overflow-x-auto p-3 min-[1180px]:grid-cols-5">
          {kanbanColumns.map((column) => {
            const columnCrs = crs.filter((cr) =>
              column.statuses.includes(cr.status),
            );
            return (
              <div
                key={column.id}
                className="min-w-[240px] rounded-md border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {column.title}
                  </h3>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs text-slate-500 shadow-sm">
                    {columnCrs.length}
                  </span>
                </div>
                <div className="space-y-2 p-2">
                  {columnCrs.length === 0 ? (
                    <p className="rounded-md border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-500">
                      Empty
                    </p>
                  ) : null}
                  {columnCrs.map((cr) => (
                    <div
                      key={cr._id}
                      className={cn(
                        "rounded-md border bg-white p-3 shadow-sm transition hover:-translate-y-px hover:shadow-md",
                        selectedId === cr._id
                          ? "border-red-600 shadow-[0_0_0_1px_#dc2626]"
                          : "border-slate-200",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(cr._id)}
                        className="block w-full text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-700">
                            {cr.crNumber}
                          </span>
                          <Badge className={priorityTone[cr.priority]}>
                            {cr.priority}
                          </Badge>
                        </div>
                        <h4 className="mt-2 line-clamp-2 text-sm font-semibold text-slate-950">
                          {cr.title}
                        </h4>
                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          <p>{cr.owner}</p>
                          <p>{dueLabel(cr)}</p>
                          <p>
                            {(cr.eccBoard ?? "Other") +
                              " / " +
                              (cr.currentGate ?? "None")}
                          </p>
                        </div>
                      </button>
                      <label className="mt-3 block">
                        <span className="sr-only">Move status</span>
                        <select
                          value={cr.status}
                          disabled={movingId === cr._id}
                          onChange={(event) =>
                            onStatusChange(cr, event.target.value as CrStatus)
                          }
                          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function CrWhiteboard({
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
  const savedPositions = useQuery(api.crs.listWhiteboardPositions, {});
  const updateWhiteboardPosition = useMutation(
    api.crs.updateWhiteboardPosition,
  );
  const whiteboardRef = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const {
    fullscreenSupported: isWhiteboardFullscreenSupported,
    isFullscreen: isWhiteboardFullscreen,
    toggleFullscreen: toggleWhiteboardFullscreen,
  } = useFullscreenTarget(whiteboardRef);
  const dragStateRef = useRef<WhiteboardDragState | null>(null);
  const [localPositions, setLocalPositions] = useState<
    Partial<Record<CrId, WhiteboardPosition>>
  >({});
  const [savingIds, setSavingIds] = useState<Partial<Record<CrId, boolean>>>(
    {},
  );
  const [error, setError] = useState("");
  const [collapsedSelectedId, setCollapsedSelectedId] = useState<CrId | null>(
    null,
  );

  const savedPositionByCrId = useMemo(() => {
    const next: Partial<Record<CrId, WhiteboardPosition>> = {};
    for (const position of savedPositions ?? []) {
      next[position.crId] = { x: position.x, y: position.y };
    }
    return next;
  }, [savedPositions]);

  const placedCrs = useMemo(
    () =>
      crs.map((cr, index) => ({
        cr,
        position:
          localPositions[cr._id] ??
          savedPositionByCrId[cr._id] ??
          defaultWhiteboardPosition(index),
      })),
    [crs, localPositions, savedPositionByCrId],
  );

  const boardSize = useMemo(
    () => getWhiteboardCanvasSize(placedCrs),
    [placedCrs],
  );

  async function persistPosition(crId: CrId, position: WhiteboardPosition) {
    setSavingIds((current) => ({ ...current, [crId]: true }));
    setError("");
    try {
      await updateWhiteboardPosition({
        crId,
        x: position.x,
        y: position.y,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save whiteboard position.",
      );
    } finally {
      setSavingIds((current) => {
        const next = { ...current };
        delete next[crId];
        return next;
      });
    }
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    crId: CrId,
    position: WhiteboardPosition,
    expanded: boolean,
  ) {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.focus();
    const pointerId = event.pointerId;
    dragStateRef.current = {
      crId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: position.x,
      startY: position.y,
      currentX: position.x,
      currentY: position.y,
      moved: false,
      expanded,
    };

    function handlePointerMove(pointerEvent: PointerEvent) {
      if (pointerEvent.pointerId !== pointerId) {
        return;
      }
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      const deltaX = pointerEvent.clientX - dragState.startClientX;
      const deltaY = pointerEvent.clientY - dragState.startClientY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        dragState.moved = true;
      }
      if (dragState.moved) {
        pointerEvent.preventDefault();
      }

      const nextPosition = clampWhiteboardPosition(
        {
          x: dragState.startX + deltaX,
          y: dragState.startY + deltaY,
        },
        boardSize,
        dragState.expanded,
      );
      dragState.currentX = nextPosition.x;
      dragState.currentY = nextPosition.y;
      setLocalPositions((current) => ({
        ...current,
        [dragState.crId]: nextPosition,
      }));
    }

    function handlePointerUp(pointerEvent: PointerEvent) {
      if (pointerEvent.pointerId !== pointerId) {
        return;
      }

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      const dragState = dragStateRef.current;
      dragStateRef.current = null;
      if (!dragState?.moved) {
        return;
      }

      const finalPosition = {
        x: dragState.currentX,
        y: dragState.currentY,
      };
      void persistPosition(dragState.crId, finalPosition);
    }

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  function handleNoteToggle(crId: CrId) {
    if (selectedId === crId && collapsedSelectedId !== crId) {
      setCollapsedSelectedId(crId);
      return;
    }

    setCollapsedSelectedId(null);
    onSelect(crId);
  }

  return (
    <section
      ref={whiteboardRef}
      className={cn(
        panelShell,
        "flex min-h-[700px] flex-col overflow-hidden bg-white",
        isWhiteboardFullscreen && "h-screen min-h-0 border-0",
      )}
    >
      <div className={cn(panelHeader, "flex items-center justify-between")}>
        <div>
          <p className={sectionLabel}>Whiteboard</p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">
            Sticky Notes
          </h2>
          <p className="text-xs text-slate-500">{crs.length} requests shown</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw
            className={cn(
              "h-4 w-4 text-slate-400",
              (loading || !savedPositions) && "animate-spin",
            )}
          />
          <button
            type="button"
            onClick={() => void toggleWhiteboardFullscreen()}
            disabled={!isWhiteboardFullscreenSupported}
            className={cn(
              "flex h-9 w-9 items-center justify-center border transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-40",
              isWhiteboardFullscreen
                ? "border-gray-950 bg-gray-950 text-white hover:bg-gray-900 hover:text-white"
                : "border-gray-200 text-gray-700",
            )}
            aria-label={
              isWhiteboardFullscreen
                ? "Exit whiteboard fullscreen"
                : "Fullscreen whiteboard"
            }
            title={
              isWhiteboardFullscreenSupported
                ? isWhiteboardFullscreen
                  ? "Exit whiteboard fullscreen"
                  : "Fullscreen whiteboard"
                : "Fullscreen is unavailable"
            }
          >
            {isWhiteboardFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "min-h-[620px] flex-1 overflow-auto bg-white",
          isWhiteboardFullscreen && "min-h-0",
        )}
      >
        {loading ? (
          <div className="flex h-full min-h-40 items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading CRs
          </div>
        ) : null}

        {!loading && crs.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No Collins Aerospace requests match the current filters.
          </div>
        ) : null}

        {!loading && crs.length > 0 ? (
          <div
            ref={boardRef}
            className="relative min-h-full min-w-full"
            style={{
              width: isWhiteboardFullscreen
                ? `max(100vw, ${boardSize.width}px)`
                : boardSize.width,
              height: isWhiteboardFullscreen
                ? `max(calc(100vh - 73px), ${boardSize.height}px)`
                : boardSize.height,
              minWidth: "100%",
              minHeight: "100%",
              backgroundColor: "#ffffff",
              backgroundImage:
                "radial-gradient(circle at center, #d4dae3 1.35px, transparent 1.45px)",
              backgroundPosition: "12px 12px",
              backgroundSize: "24px 24px",
            }}
          >
            {placedCrs.map(({ cr, position }) => {
              const expanded =
                selectedId === cr._id && collapsedSelectedId !== cr._id;
              const saving = savingIds[cr._id];
              return (
                <div
                  key={cr._id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={expanded}
                  onPointerDown={(event) =>
                    handlePointerDown(event, cr._id, position, expanded)
                  }
                  onDoubleClick={() => handleNoteToggle(cr._id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleNoteToggle(cr._id);
                    }
                  }}
                  className={cn(
                    "absolute left-0 top-0 touch-none select-none border p-3 text-left shadow-sm outline-none transition-[box-shadow,width] duration-150 hover:shadow-md focus-visible:ring-2 focus-visible:ring-gray-950",
                    stickyNoteTone[cr.priority],
                    expanded ? "z-20 w-[344px] shadow-lg" : "z-10 w-[232px]",
                  )}
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold">
                          {cr.crNumber}
                        </span>
                        <Badge className={priorityTone[cr.priority]}>
                          {cr.priority}
                        </Badge>
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-sm font-semibold">
                        {cr.title}
                      </h3>
                    </div>
                    <span
                      className="mt-0.5 shrink-0 text-current opacity-45"
                      title="Drag"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Move className="h-4 w-4" />
                      )}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={statusTone[cr.status]}>{cr.status}</Badge>
                    <Badge className={neutralBadge}>
                      {cr.currentGate ?? "None"}
                    </Badge>
                  </div>

                  <div className="mt-3 grid gap-1.5 text-xs">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{cr.owner}</span>
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{dueLabel(cr)}</span>
                    </span>
                  </div>

                  {expanded ? (
                    <div className="mt-3 space-y-3 border-t border-black/10 pt-3 text-xs leading-5">
                      <div className="grid grid-cols-2 gap-2">
                        <NoteFact
                          label="Board"
                          value={cr.eccBoard ?? "Other"}
                        />
                        <NoteFact
                          label="Class"
                          value={cr.classification ?? "TBD"}
                        />
                        <NoteFact
                          label="NCDOC"
                          value={cr.ncdocNumber ?? "Not set"}
                        />
                        <NoteFact
                          label="Disposition"
                          value={cr.disposition ?? "Not set"}
                        />
                      </div>
                      <div>
                        <p className={sectionLabel}>Description</p>
                        <p className="mt-1 line-clamp-4">{cr.description}</p>
                      </div>
                      <div>
                        <p className={sectionLabel}>Impact</p>
                        <p className="mt-1 line-clamp-3">{cr.businessImpact}</p>
                      </div>
                      {cr.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cr.tags.slice(0, 5).map((tag) => (
                            <span
                              key={tag}
                              className="border border-black/10 bg-white/60 px-1.5 py-0.5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 opacity-80">
                      {cr.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="border-t border-rose-100 p-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function NoteFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-black/10 bg-white/50 p-2">
      <p className={sectionLabel}>{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
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
  const updates = useQuery(api.crs.listUpdates, cr ? { crId: cr._id } : "skip");
  const actions = useQuery(api.crs.listActions, cr ? { crId: cr._id } : "skip");
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
      <section className={cn(panelShell, "p-6")}>
        <p className={sectionLabel}>Request detail</p>
        <h2 className="mt-1 text-base font-semibold text-slate-950">
          No CR selected
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Select a Collins Aerospace request or create a new one.
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
        ...formToUpdateArgs(form, cr.crNumber),
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
      await addUpdate({ crId: cr._id, author: "Collins user", body: note });
      setNote("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to add note.",
      );
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
      await archiveCr({ id: cr._id, author: "Collins user" });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to archive CR.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={cn(panelShell, "overflow-hidden")}>
      <div className={panelHeader}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-700">
                {cr.crNumber}
              </span>
              <Badge className={statusTone[cr.status]}>{cr.status}</Badge>
              <Badge className={priorityTone[cr.priority]}>{cr.priority}</Badge>
              <Badge className={neutralBadge}>{cr.eccBoard ?? "Other"}</Badge>
              <Badge className={neutralBadge}>
                {cr.classification ?? "TBD"} / {cr.currentGate ?? "None"}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold text-slate-950">{cr.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
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
              <Info
                label="ECC Coordinator"
                value={cr.eccCoordinator || cr.owner || "Not set"}
              />
              <Info
                label="Responsible IPT(s)"
                value={(cr.responsibleIpts ?? []).join(", ") || "Not set"}
              />
              <Info label="Requester" value={cr.requester} />
              <Info
                label="Meeting"
                value={
                  [cr.meetingDate, cr.meetingTimeEst]
                    .filter(Boolean)
                    .join(" ") || "No date"
                }
              />
              <Info label="NCDOC Number" value={cr.ncdocNumber ?? "Not set"} />
              <Info
                label="Documentation Due"
                value={cr.documentationDeadline ?? "No date"}
              />
              <Info
                label="CO Need-by / Completion"
                value={cr.targetDate ?? "No date"}
              />
              <Info
                label="Risk"
                value={cr.risk}
                valueClassName={riskTone[cr.risk]}
              />
              <Info
                label="Charge Number"
                value={cr.wbsChargeNumber ?? "Not set"}
              />
              <Info label="FAR15?" value={cr.far15 ? "Yes" : "No"} />
              <Info label="Disposition" value={cr.disposition ?? "Not set"} />
              <Info label="Supplier" value={cr.supplier ?? "Not set"} />
              <Info
                label="Engine Program(s)"
                value={(cr.enginePrograms ?? []).join(", ") || "Not set"}
              />
              <Info
                label="Component Model(s)"
                value={(cr.componentModels ?? []).join(", ") || "Not set"}
              />
              <Info
                label="Class/Gate/Military Supplier EC"
                value={cr.classGateMilitarySupplierEc ?? "Not set"}
              />
            </div>
            <WorkflowSummary cr={cr} />
            <TextBlock label="Description" value={cr.description} />
            <TextBlock label="Business Impact" value={cr.businessImpact} />
            <TextBlock label="Technical Notes" value={cr.technicalNotes} />
            <TextBlock
              label="CR Folder Path"
              value={cr.crFolderPath ?? "Not set"}
            />
            <TextBlock
              label="Quorum / Approvers"
              value={(cr.quorum ?? []).join(", ") || "Not set"}
            />
            <div>
              <p className={cn("mb-2", sectionLabel)}>Tags</p>
              <div className="flex flex-wrap gap-2">
                {cr.tags.length > 0 ? (
                  cr.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No tags</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-slate-200 pt-4">
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

        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className={sectionLabel}>Activity</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-950">
                Update Notes
              </h3>
            </div>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
            ) : null}
          </div>
          <div className="flex gap-2">
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a note, blocker, decision, or handoff..."
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
          {error ? (
            <p className="mt-2 text-sm font-medium text-rose-700">{error}</p>
          ) : null}
          <div className="mt-4 space-y-3">
            {!updates ? (
              <p className="text-sm text-slate-500">Loading updates...</p>
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
      <p className={cn("mb-2", sectionLabel)}>ECC Workflow</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {milestones.map(([label, state]) => (
          <div
            key={label}
            className="rounded-md border border-slate-200 bg-slate-50 p-2"
          >
            <p className={sectionLabel}>{label}</p>
            <p className={cn("mt-1 text-xs font-medium", taskStateTone(state))}>
              {state}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Info label="Charge Number" value={cr.wbsChargeNumber ?? "Not set"} />
        <Info
          label="Design Authority Group"
          value={cr.designAuthority ?? "Not set"}
        />
        <Info
          label="Waiver Option"
          value={cr.waiverOption ?? "Not applicable"}
        />
        <Info label="Updated" value={formatTimestamp(cr.lastUpdatedAt)} />
      </div>
    </div>
  );
}

function buildWorkflowPhases(cr: Cr): WorkflowPhase[] {
  const currentIndex = getWorkflowPhaseIndex(cr);
  const blockedIndex = getBlockedWorkflowPhaseIndex(cr, currentIndex);

  return workflowPhaseDefinitions.map((definition, index) => {
    const tasks = definition.tasks.map((task) => ({
      label: task.label,
      field: task.field,
      state: getWorkflowTaskState(cr, task.field),
    }));
    const blocked =
      (cr.status === "Blocked" && index === currentIndex) ||
      blockedIndex === index ||
      tasks.some((task) => task.state === "Blocked");
    let state: WorkflowPhaseState = "pending";

    if (blocked) {
      state = "blocked";
    } else if (index < currentIndex || cr.status === "Closed") {
      state = "complete";
    } else if (index === currentIndex) {
      state = cr.status === "Rejected" ? "blocked" : "active";
    }

    return {
      id: definition.id,
      label: definition.label,
      detail: definition.detail(cr),
      state,
      tasks,
    };
  });
}

function getWorkflowCurrentPhase(cr: Cr) {
  return (
    workflowPhaseDefinitions[getWorkflowPhaseIndex(cr)]?.label ?? "Workflow"
  );
}

function getWorkflowPhaseIndex(cr: Cr) {
  return workflowStatusPhaseIndex[cr.status] ?? 0;
}

function getBlockedWorkflowPhaseIndex(cr: Cr, currentIndex: number) {
  for (let index = 0; index < workflowPhaseDefinitions.length; index += 1) {
    const definition = workflowPhaseDefinitions[index];
    if (
      definition.tasks.some(
        (task) => getWorkflowTaskState(cr, task.field) === "Blocked",
      )
    ) {
      return index;
    }
  }

  return cr.status === "Blocked" ? currentIndex : null;
}

function getWorkflowTaskState(cr: Cr, field: TaskStateField): TaskState {
  return cr[field] ?? "Not Started";
}

function workflowChecklistSummary(tasks: WorkflowTask[]) {
  if (tasks.length === 0) {
    return {
      label: "Lifecycle status",
      tone: "text-slate-500",
    };
  }

  const completed = tasks.filter(isChecklistTaskComplete).length;
  const blocked = tasks.some((task) => task.state === "Blocked");
  const inProgress = tasks.some((task) => task.state === "In Progress");

  if (blocked) {
    return {
      label: `${completed}/${tasks.length} complete, blocked`,
      tone: "text-rose-700",
    };
  }

  if (completed === tasks.length) {
    return {
      label: `${completed}/${tasks.length} complete`,
      tone: "text-emerald-700",
    };
  }

  if (inProgress) {
    return {
      label: `${completed}/${tasks.length} complete, in progress`,
      tone: "text-blue-700",
    };
  }

  return {
    label: `${completed}/${tasks.length} complete`,
    tone: "text-slate-500",
  };
}

function isChecklistTaskComplete(task: WorkflowTask) {
  return task.state === "Complete" || task.state === "Not Applicable";
}

function workflowPhaseStateLabel(state: WorkflowPhaseState) {
  const labels: Record<WorkflowPhaseState, string> = {
    complete: "Done",
    active: "Current",
    blocked: "Blocked",
    pending: "Pending",
  };
  return labels[state];
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
        author: "Collins user",
      });
      setActionForm({
        gate: cr.currentGate ?? "None",
        owner: "IPT",
        body: "",
        dueDate: "",
        evidenceLocation: "",
      });
    } catch (caught) {
      onError(
        caught instanceof Error ? caught.message : "Unable to add action.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleActionStatus(id: CrActionId, status: ActionStatus) {
    setSaving(true);
    onError("");
    try {
      await updateActionStatus({ id, status, author: "Collins user" });
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
        author: "Collins user",
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
      await updateApprovalStatus({ id, status, author: "Collins user" });
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
        <div>
          <p className={sectionLabel}>Controls</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-950">
            Actions and OOC Approvals
          </h3>
        </div>
        {loading || saving ? (
          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-950">Open Actions</p>
            <span className="rounded-md bg-white px-2 py-1 text-xs text-slate-500 shadow-sm">
              {actions.filter((action) => action.status !== "Closed").length}{" "}
              open
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
              onChange={(value) =>
                setActionForm({ ...actionForm, body: value })
              }
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
            <Button
              type="submit"
              size="sm"
              disabled={saving || !actionForm.body.trim()}
            >
              <Plus className="h-4 w-4" />
              Add Action
            </Button>
          </form>
          <div className="mt-3 space-y-2">
            {actions.length === 0 ? (
              <p className="text-sm text-slate-500">No actions recorded.</p>
            ) : null}
            {actions.map((action) => (
              <div
                key={action._id}
                className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge className={neutralBadge}>{action.gate}</Badge>
                  <span className={taskStateTone(action.status)}>
                    {action.status}
                  </span>
                  <span className="text-xs text-slate-500">{action.owner}</span>
                </div>
                <p>{action.body}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Due: {action.dueDate ?? "None"} / Evidence:{" "}
                  {action.evidenceLocation || "Not set"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {actionStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        void handleActionStatus(action._id, status)
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-gray-950 hover:text-gray-950"
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

        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-950">Approvals</p>
            <span className="rounded-md bg-white px-2 py-1 text-xs text-slate-500 shadow-sm">
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
              <p className="text-sm text-slate-500">No approvals recorded.</p>
            ) : null}
            {approvals.map((approval) => (
              <div
                key={approval._id}
                className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-sm"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge className={neutralBadge}>{approval.gate}</Badge>
                  <span className={taskStateTone(approval.status)}>
                    {approval.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {approval.source}
                  </span>
                </div>
                <p className="font-medium">{approval.approverName}</p>
                <p className="text-xs text-slate-500">
                  {approval.role} / Evidence:{" "}
                  {approval.evidenceLocation || "Not set"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {approvalStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        void handleApprovalStatus(approval._id, status)
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-gray-950 hover:text-gray-950"
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

function AssistantPanel({
  selectedCr,
  onClose,
}: {
  selectedCr: Cr | null;
  onClose: () => void;
}) {
  const assistantFileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<EccSpeechRecognition | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content:
        "Ready to triage blockers, due dates, ownership load, or risk across the Collins Aerospace CR queue.",
    },
  ]);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<IntakeImageState | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [talkBackEnabled, setTalkBackEnabled] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [asking, setAsking] = useState(false);
  const voiceSupported = useSyncExternalStore(
    subscribeToStaticStore,
    getVoiceSupportSnapshot,
    getFalseSnapshot,
  );

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  async function ask(content: string, image = attachment) {
    const prompt =
      content.trim() ||
      (image
        ? "Read the attached screenshot and extract the PWES Military ECC CR intake details."
        : "");
    if (!prompt || asking) {
      return;
    }
    const displayedPrompt = image
      ? `${prompt}\n\n[Screenshot attached]`
      : prompt;
    const nextMessages: AssistantMessage[] = [
      ...messages,
      { role: "user", content: displayedPrompt },
    ];
    setMessages(nextMessages);
    setInput("");
    setAttachment(null);
    setAttachmentError("");
    setVoiceStatus("");
    setAsking(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.slice(-10),
          selectedCrNumber: selectedCr?.crNumber ?? null,
          image: image
            ? {
                mimeType: image.mimeType,
                base64: image.base64,
              }
            : null,
        }),
      });
      const data = (await response.json()) as {
        answer?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "The ECC assistant could not answer.");
      }
      const answer =
        data.answer ??
        "The ECC assistant did not return a response. Please try again.";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: answer,
        },
      ]);
      if (talkBackEnabled) {
        speakText(answer);
      }
    } catch (caught) {
      const answer =
        caught instanceof Error
          ? caught.message
          : "The ECC assistant could not answer.";
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: answer,
        },
      ]);
      if (talkBackEnabled) {
        speakText(answer);
      }
    } finally {
      setAsking(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  function stopVoiceInput(status = "") {
    recognitionRef.current?.stop();
    setIsListening(false);
    setVoiceStatus(status);
  }

  async function handleAssistantImageFile(file: File) {
    setAttachmentError("");
    try {
      setAttachment(await readScreenshotFile(file));
    } catch (caught) {
      setAttachmentError(
        caught instanceof Error ? caught.message : "Unable to read screenshot.",
      );
    }
  }

  function handleAssistantPaste(event: ClipboardEvent<HTMLElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) =>
      item.type.startsWith("image/"),
    );
    const pastedText = event.clipboardData.getData("text");

    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        event.preventDefault();
        void handleAssistantImageFile(file);
      }
      return;
    }

    if (pastedText && !input.trim()) {
      setInput(pastedText);
    }
  }

  function handleVoiceToggle() {
    if (isListening) {
      stopVoiceInput("Dictation stopped.");
      return;
    }

    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      setVoiceStatus("Voice input is not available in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus("Listening...");
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      setVoiceStatus(
        event.error === "not-allowed"
          ? "Microphone access is blocked."
          : "Voice input did not catch that.",
      );
    };
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const transcript = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal) {
          finalTranscript += ` ${transcript}`;
        } else {
          interimTranscript += ` ${transcript}`;
        }
      }

      const transcript = (finalTranscript || interimTranscript).trim();
      if (transcript) {
        setInput(transcript);
      }

      const finalPrompt = finalTranscript.trim();
      if (finalPrompt) {
        setVoiceStatus("Dictation ready.");
        recognition.stop();
      }
    };

    try {
      recognition.start();
    } catch {
      setVoiceStatus("Voice input could not start.");
      recognitionRef.current = null;
      setIsListening(false);
    }
  }

  function handleTalkBackToggle() {
    setTalkBackEnabled((enabled) => {
      const nextEnabled = !enabled;
      if (!nextEnabled) {
        window.speechSynthesis?.cancel();
      }
      return nextEnabled;
    });
  }

  const quickPrompts = [
    "Show blocked and high-risk CRs.",
    "What needs review today?",
    "Summarize owner load and due-date risk.",
  ];

  return (
    <aside
      id="assistant-panel"
      className={cn(
        panelShell,
        "flex max-h-[calc(100vh-112px)] min-h-[680px] flex-col overflow-hidden 2xl:sticky 2xl:top-5",
      )}
    >
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-32 items-center justify-center border border-gray-200 bg-white px-3 py-2">
              <Image
                src="/collins-aerospace-logo.svg"
                alt=""
                width={116}
                height={29}
                className="h-auto max-h-6 w-full object-contain"
              />
            </span>
            <div>
              <p className={sectionLabel}>Collins AI</p>
              <h2 className="text-base font-semibold text-slate-950">
                ECC Assistant
              </h2>
              <p className="text-xs text-slate-500">
                Engineering review intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {asking ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
              aria-label="Hide AI assistant"
              title="Hide AI assistant"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => void ask(prompt)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left text-xs text-slate-600 transition hover:border-gray-950 hover:text-gray-950"
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
                ? "ml-8 border-red-200 bg-red-50"
                : "mr-8 border-slate-200 bg-slate-50",
            )}
          >
            <p className={cn("mb-1", sectionLabel)}>
              {message.role === "user" ? "You" : "Collins"}
            </p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSubmit}
        onPaste={handleAssistantPaste}
        className="border-t border-slate-200 p-3"
      >
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={handleTalkBackToggle}
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 border px-3 text-xs font-semibold transition",
              talkBackEnabled
                ? "border-gray-950 bg-gray-950 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-gray-300 hover:text-gray-950",
            )}
          >
            {talkBackEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            Talk back
          </button>
        </div>
        {voiceStatus ? (
          <p className="mb-2 text-xs font-medium text-slate-500">
            {voiceStatus}
          </p>
        ) : null}
        {!attachment ? (
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => assistantFileInputRef.current?.click()}
              className="inline-flex h-9 items-center justify-center gap-2 border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-gray-300 hover:text-gray-950"
            >
              <Paperclip className="h-4 w-4" />
              Add attachment
            </button>
            <div
              tabIndex={0}
              onPaste={handleAssistantPaste}
              className="inline-flex h-9 items-center justify-center gap-2 border border-dashed border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-slate-600 outline-none transition focus:border-gray-950 focus:bg-white"
            >
              <Upload className="h-4 w-4" />
              Paste screenshot
            </div>
          </div>
        ) : null}
        {attachment ? (
          <div className="mb-2 flex items-center gap-2 border border-slate-200 bg-slate-50 p-2">
            <Image
              src={attachment.dataUrl}
              alt=""
              width={48}
              height={32}
              unoptimized
              className="h-8 w-12 border border-slate-200 bg-white object-contain"
            />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">
              {attachment.name}
            </span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-gray-300 hover:text-gray-950"
              title="Remove screenshot"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
        {attachmentError ? (
          <p className="mb-2 text-xs font-medium text-rose-700">
            {attachmentError}
          </p>
        ) : null}
        <input
          ref={assistantFileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleAssistantImageFile(file);
            }
            event.target.value = "";
          }}
        />
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Message Collins AI or paste a CR screenshot..."
            className="bg-white"
          />
          <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={!voiceSupported || asking || isListening}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center border transition disabled:cursor-not-allowed disabled:opacity-50",
              "border-slate-200 bg-white text-slate-600 hover:border-gray-300 hover:text-gray-950",
            )}
            title={
              voiceSupported
                ? isListening
                  ? "Dictating"
                  : "Click to dictate"
                : "Voice input is not available in this browser"
            }
            aria-label="Start dictation"
          >
            <Mic className="h-4 w-4" />
          </button>
          <Button
            type={isListening ? "button" : "submit"}
            size="icon"
            onClick={
              isListening
                ? () => stopVoiceInput("Dictation stopped.")
                : undefined
            }
            disabled={
              isListening ? false : (!input.trim() && !attachment) || asking
            }
            title={isListening ? "Stop dictation" : "Send message"}
            aria-label={isListening ? "Stop dictation" : "Send message"}
            className="shrink-0"
          >
            {isListening ? (
              <Square className="h-4 w-4 fill-current" />
            ) : asking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
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
  variant = "full",
}: {
  form: CrFormState;
  setForm: (form: CrFormState) => void;
  error: string;
  saving: boolean;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  variant?: "create" | "full";
}) {
  function updateField<Key extends keyof CrFormState>(
    key: Key,
    value: CrFormState[Key],
  ) {
    setForm({ ...form, [key]: value });
  }

  if (variant === "create") {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Collins CR # / PW REA #"
            value={form.crNumber}
            onChange={(value) => updateField("crNumber", value)}
            placeholder="CR-0222162"
            required
          />
          <Field
            label="NCDOC Number"
            value={form.ncdocNumber}
            onChange={(value) => updateField("ncdocNumber", value)}
          />
          <Field
            label="Meeting Date"
            type="date"
            value={form.meetingDate}
            onChange={(value) => updateField("meetingDate", value)}
          />
          <Field
            label="Time (EST)"
            type="time"
            value={form.meetingTimeEst}
            onChange={(value) => updateField("meetingTimeEst", value)}
          />
          <Field
            label="Class/Gate/Military Supplier EC"
            value={form.classGateMilitarySupplierEc}
            onChange={(value) =>
              updateField("classGateMilitarySupplierEc", value)
            }
          />
          <Field
            label="Disposition"
            value={form.disposition}
            onChange={(value) => updateField("disposition", value)}
          />
          <Field
            label="Responsible IPT(s)"
            value={form.responsibleIptsInput}
            onChange={(value) => updateField("responsibleIptsInput", value)}
            placeholder="comma separated"
          />
          <Field
            label="Engine Program(s)"
            value={form.engineProgramsInput}
            onChange={(value) => updateField("engineProgramsInput", value)}
            placeholder="comma separated"
          />
          <Field
            label="Component Model(s)"
            value={form.componentModelsInput}
            onChange={(value) => updateField("componentModelsInput", value)}
            placeholder="comma separated"
          />
          <Field
            label="Supplier"
            value={form.supplier}
            onChange={(value) => updateField("supplier", value)}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(value) => updateField("description", value)}
            className="md:col-span-2 xl:col-span-3"
          />
          <Field
            label="Charge Number"
            value={form.wbsChargeNumber}
            onChange={(value) => updateField("wbsChargeNumber", value)}
          />
          <CheckboxField
            label="FAR15?"
            checked={form.far15}
            onChange={(value) => updateField("far15", value)}
          />
          <Field
            label="Documentation Due"
            type="date"
            value={form.documentationDeadline}
            onChange={(value) => updateField("documentationDeadline", value)}
          />
          <Field
            label="CO Need-by / Completion Date"
            type="date"
            value={form.targetDate}
            onChange={(value) => updateField("targetDate", value)}
          />
          <Field
            label="Design Authority Group"
            value={form.designAuthority}
            onChange={(value) => updateField("designAuthority", value)}
          />
          <Field
            label="ECC Coordinator"
            value={form.eccCoordinator}
            onChange={(value) => updateField("eccCoordinator", value)}
          />
        </div>
        {error ? (
          <p className="text-sm font-medium text-rose-700">{error}</p>
        ) : null}
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field
          label="Collins CR # / PW REA #"
          value={form.crNumber}
          onChange={(value) => updateField("crNumber", value)}
          placeholder="CR-0222162"
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
          label="CO Need-by / Completion Date"
          type="date"
          value={form.targetDate}
          onChange={(value) => updateField("targetDate", value)}
        />
      </div>
      <div className="border-t border-slate-200 pt-4">
        <p className={cn("mb-3", sectionLabel)}>ECC Routing</p>
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
            onChange={(value) =>
              updateField("currentGate", value as ReviewGate)
            }
            options={reviewGates}
          />
          <Field
            label="Meeting Date"
            type="date"
            value={form.meetingDate}
            onChange={(value) => updateField("meetingDate", value)}
          />
          <Field
            label="Time (EST)"
            type="time"
            value={form.meetingTimeEst}
            onChange={(value) => updateField("meetingTimeEst", value)}
          />
          <Field
            label="NCDOC Number"
            value={form.ncdocNumber}
            onChange={(value) => updateField("ncdocNumber", value)}
          />
          <Field
            label="Class/Gate/Military Supplier EC"
            value={form.classGateMilitarySupplierEc}
            onChange={(value) =>
              updateField("classGateMilitarySupplierEc", value)
            }
            className="xl:col-span-2"
          />
          <Field
            label="Responsible IPT(s)"
            value={form.responsibleIptsInput}
            onChange={(value) => updateField("responsibleIptsInput", value)}
            placeholder="comma separated"
          />
          <Field
            label="Engine Program(s)"
            value={form.engineProgramsInput}
            onChange={(value) => updateField("engineProgramsInput", value)}
            placeholder="comma separated"
          />
          <Field
            label="Component Model(s)"
            value={form.componentModelsInput}
            onChange={(value) => updateField("componentModelsInput", value)}
            placeholder="comma separated"
          />
          <Field
            label="Supplier"
            value={form.supplier}
            onChange={(value) => updateField("supplier", value)}
          />
          <Field
            label="Documentation Due"
            type="date"
            value={form.documentationDeadline}
            onChange={(value) => updateField("documentationDeadline", value)}
          />
          <Field
            label="Charge Number"
            value={form.wbsChargeNumber}
            onChange={(value) => updateField("wbsChargeNumber", value)}
          />
          <CheckboxField
            label="FAR15?"
            checked={form.far15}
            onChange={(value) => updateField("far15", value)}
          />
          <CheckboxField
            label="Charge Active"
            checked={form.chargeNumberActive}
            onChange={(value) => updateField("chargeNumberActive", value)}
          />
          <Field
            label="Design Authority Group"
            value={form.designAuthority}
            onChange={(value) => updateField("designAuthority", value)}
          />
          <Field
            label="ECC Coordinator"
            value={form.eccCoordinator}
            onChange={(value) => updateField("eccCoordinator", value)}
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
      <div className="border-t border-slate-200 pt-4">
        <p className={cn("mb-3", sectionLabel)}>ECC Milestones</p>
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
            onChange={(value) =>
              updateField("xclassStatus", value as TaskState)
            }
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
      {error ? (
        <p className="text-sm font-medium text-rose-700">{error}</p>
      ) : null}
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
      <span className={cn("mb-1 block", sectionLabel)}>{label}</span>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="bg-white"
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
      <span className={cn("mb-1 block", sectionLabel)}>{label}</span>
      <span className="flex h-9 items-center gap-2 rounded-md border border-input bg-white px-3 text-sm shadow-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4 accent-red-600"
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
      <span className={cn("mb-1 block", sectionLabel)}>{label}</span>
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
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className={cn("mb-1 block", sectionLabel)}>{label}</span>
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
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className={sectionLabel}>{label}</p>
      <p
        className={cn(
          "mt-1 truncate text-sm font-medium text-slate-800",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={cn("mb-1", sectionLabel)}>{label}</p>
      <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
        {value}
      </p>
    </div>
  );
}

function UpdateItem({ update }: { update: CrUpdate }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-700">{update.author}</span>
        <span>{formatTimestamp(update.createdAt)}</span>
        {update.kind === "status" ? (
          <span className="inline-flex items-center gap-1 text-red-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            status
          </span>
        ) : null}
      </div>
      <p>{update.body}</p>
    </div>
  );
}

function useFullscreenTarget<T extends HTMLElement>(targetRef: {
  current: T | null;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  useEffect(() => {
    function syncFullscreenState() {
      const target = targetRef.current;
      setIsFullscreen(Boolean(target && document.fullscreenElement === target));
      setFullscreenSupported(Boolean(document.fullscreenEnabled));
    }

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [targetRef]);

  const toggleFullscreen = useCallback(async () => {
    const target = targetRef.current;
    if (!target || !document.fullscreenEnabled) {
      return;
    }

    try {
      if (document.fullscreenElement === target) {
        await document.exitFullscreen();
        return;
      }

      await target.requestFullscreen();
    } catch {
      setFullscreenSupported(Boolean(document.fullscreenEnabled));
    }
  }, [targetRef]);

  return {
    fullscreenSupported,
    isFullscreen,
    toggleFullscreen,
  };
}

function defaultWhiteboardPosition(index: number): WhiteboardPosition {
  return {
    x: whiteboardPadding + (index % 4) * whiteboardColumnGap,
    y: whiteboardPadding + Math.floor(index / 4) * whiteboardRowGap,
  };
}

function getWhiteboardCanvasSize(
  placedCrs: Array<{ position: WhiteboardPosition }>,
) {
  const maxX = placedCrs.reduce(
    (currentMax, item) => Math.max(currentMax, item.position.x),
    0,
  );
  const maxY = placedCrs.reduce(
    (currentMax, item) => Math.max(currentMax, item.position.y),
    0,
  );

  return {
    width: Math.max(
      1_080,
      maxX + whiteboardExpandedNoteWidth + whiteboardPadding,
    ),
    height: Math.max(
      680,
      maxY + whiteboardExpandedNoteHeight + whiteboardPadding,
    ),
  };
}

function clampWhiteboardPosition(
  position: WhiteboardPosition,
  boardSize: { width: number; height: number },
  expanded: boolean,
) {
  const noteWidth = expanded
    ? whiteboardExpandedNoteWidth
    : whiteboardNoteWidth;
  const noteHeight = expanded
    ? whiteboardExpandedNoteHeight
    : whiteboardNoteHeight;

  return {
    x: Math.max(
      whiteboardPadding,
      Math.min(position.x, boardSize.width - noteWidth - whiteboardPadding),
    ),
    y: Math.max(
      whiteboardPadding,
      Math.min(position.y, boardSize.height - noteHeight - whiteboardPadding),
    ),
  };
}

function scopeTitle(scope: CrScope) {
  const titles: Record<CrScope, string> = {
    mine: "My CRs",
    all: "All CRs",
    attention: "Needs Attention",
    dueSoon: "Due Soon",
    actions: "Actions",
    approvals: "Approvals",
    complete: "Complete",
  };
  return titles[scope];
}

function crMatchesScope(cr: Cr, scope: CrScope, localOwner: string) {
  if (scope === "mine") {
    return belongsToLocalOwner(cr, localOwner);
  }
  if (scope === "attention") {
    return needsAttention(cr);
  }
  if (scope === "dueSoon") {
    return isDueSoon(cr);
  }
  if (scope === "actions") {
    return hasActionWork(cr);
  }
  if (scope === "approvals") {
    return hasApprovalWork(cr);
  }
  if (scope === "complete") {
    return isTerminal(cr.status);
  }
  return true;
}

function belongsToLocalOwner(cr: Cr, localOwner: string) {
  const normalized = localOwner.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return cr.owner.trim().toLowerCase() === normalized;
}

function getProfilePhotoStorageKey(name: string, email: string | null) {
  const identity =
    email?.trim().toLowerCase() || name.trim().toLowerCase() || "collins-user";
  return `ecc.profilePhoto:${identity}`;
}

function readStoredProfilePhoto(storageKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function getEmptyProfilePhotoSnapshot() {
  return null;
}

function subscribeToProfilePhotoStorage(
  storageKey: string,
  onStoreChange: () => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(profilePhotoStorageEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(profilePhotoStorageEvent, onStoreChange);
  };
}

function notifyProfilePhotoStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(profilePhotoStorageEvent));
  }
}

function readSidebarNavOrderSnapshot() {
  if (typeof window === "undefined") {
    return defaultSidebarNavOrderSnapshot;
  }

  try {
    return serializeSidebarNavOrder(
      normalizeSidebarNavOrder(
        JSON.parse(
          window.localStorage.getItem(sidebarNavOrderStorageKey) ?? "null",
        ),
      ),
    );
  } catch {
    return defaultSidebarNavOrderSnapshot;
  }
}

function getDefaultSidebarNavOrderSnapshot() {
  return defaultSidebarNavOrderSnapshot;
}

function subscribeToSidebarNavOrderStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === sidebarNavOrderStorageKey) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(sidebarNavOrderStorageEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(sidebarNavOrderStorageEvent, onStoreChange);
  };
}

function notifySidebarNavOrderStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(sidebarNavOrderStorageEvent));
  }
}

function writeSidebarNavOrder(order: SidebarNavSection[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      sidebarNavOrderStorageKey,
      JSON.stringify(normalizeSidebarNavOrder(order)),
    );
  } catch {
    // Local preference only; ignore storage failures.
  }
}

function normalizeSidebarNavOrder(value: unknown): SidebarNavSection[] {
  if (!Array.isArray(value)) {
    return [...defaultSidebarNavOrder];
  }

  const orderedSections = value.filter(
    (item): item is SidebarNavSection =>
      item === "dashboard" ||
      item === "workflow" ||
      item === "allCrs" ||
      item === "myCrs" ||
      item === "analytics",
  );
  return [
    ...orderedSections.filter(
      (section, index) => orderedSections.indexOf(section) === index,
    ),
    ...defaultSidebarNavOrder.filter(
      (section) => !orderedSections.includes(section),
    ),
  ];
}

function parseSidebarNavOrderSnapshot(value: string) {
  return normalizeSidebarNavOrder(value.split("|"));
}

function serializeSidebarNavOrder(order: SidebarNavSection[]) {
  return normalizeSidebarNavOrder(order).join("|");
}

function normalizeSidebarNavSection(
  value: string | null,
): SidebarNavSection | null {
  if (
    value === "dashboard" ||
    value === "workflow" ||
    value === "allCrs" ||
    value === "myCrs" ||
    value === "analytics"
  ) {
    return value;
  }
  return null;
}

function reorderSidebarNavOrder(
  order: SidebarNavSection[],
  sourceSection: SidebarNavSection,
  targetSection: SidebarNavSection,
) {
  const normalizedOrder = normalizeSidebarNavOrder(order);
  const nextOrder = normalizedOrder.filter(
    (section) => section !== sourceSection,
  );
  const targetIndex = nextOrder.indexOf(targetSection);

  if (targetIndex === -1) {
    return normalizedOrder;
  }

  nextOrder.splice(targetIndex, 0, sourceSection);
  return nextOrder;
}

function getProfileInitials(name: string, email: string | null) {
  const source = name.trim() || email?.split("@")[0] || "Collins user";
  const parts = source
    .replace(/[^a-zA-Z0-9\s._-]/g, " ")
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "CU";
  }

  const first = parts[0]?.[0] ?? "C";
  const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? "U"}`.toUpperCase();
}

function needsAttention(cr: Cr) {
  const days = daysUntil(cr.targetDate);
  return (
    cr.status === "Blocked" ||
    cr.status === "Held for Actions" ||
    cr.risk === "High" ||
    cr.oocApprovalStatus === "Blocked" ||
    cr.preMeetingReviewStatus === "Blocked" ||
    cr.documentationNotificationStatus === "Blocked" ||
    (days !== null && days < 0 && !isTerminal(cr.status))
  );
}

function hasActionWork(cr: Cr) {
  return (
    cr.status === "Held for Actions" ||
    cr.status === "Approved w/Actions" ||
    cr.preMeetingReviewStatus === "Blocked" ||
    cr.oocApprovalStatus === "Blocked"
  );
}

function hasApprovalWork(cr: Cr) {
  return (
    cr.status === "Pending OOC Approvals" ||
    cr.oocApprovalStatus === "In Progress" ||
    cr.oocApprovalStatus === "Blocked" ||
    cr.chairApprovalStatus === "In Progress" ||
    cr.chairApprovalStatus === "Blocked"
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

function buildAnalyticsModel(crs: Cr[], localOwner: string): AnalyticsModel {
  const total = crs.length;
  const openCrs = crs.filter((cr) => !isTerminal(cr.status));
  const openCount = openCrs.length;
  const closedCount = total - openCount;
  const completionRate = percentOf(closedCount, total);
  const attentionCount = crs.filter((cr) => needsAttention(cr)).length;
  const assignedToMe = crs.filter((cr) =>
    belongsToLocalOwner(cr, localOwner),
  ).length;
  const overdueCount = openCrs.filter((cr) => {
    const days = daysUntil(cr.targetDate);
    return days !== null && days < 0;
  }).length;
  const dueSoonCount = openCrs.filter((cr) => isDueSoon(cr)).length;

  const ownerRows = buildOwnerLoadRows(crs);
  const councilRows = buildCouncilLoadRows(crs);
  const taskRows = buildTaskReadinessRows(crs);
  const riskWatchlist = buildRiskWatchlist(crs);
  const completenessRows = buildCompletenessRows(crs);
  const monthlyRows = buildMonthlyIntakeRows(crs);
  const busiestOwner = ownerRows.find((row) => row.open > 0) ?? ownerRows[0];
  const reviewQueueCount = crs.filter((cr) =>
    ["Ready for Review", "Meeting Scheduled", "Testing", "Review"].includes(
      cr.status,
    ),
  ).length;

  const statusRows = statuses
    .map((status, index) => ({
      label: status,
      value: crs.filter((cr) => cr.status === status).length,
      detail:
        workflowPhaseDefinitions[workflowStatusPhaseIndex[status]]?.label ??
        "Workflow",
      tone: analyticsBarTones[index % analyticsBarTones.length],
    }))
    .filter((row) => row.value > 0)
    .sort((first, second) => second.value - first.value);
  const priorityRows = priorities.map((priority, index) => ({
    label: priority,
    value: crs.filter((cr) => cr.priority === priority).length,
    detail:
      priority === "Critical"
        ? "Immediate escalation"
        : priority === "High"
          ? "High management focus"
          : "Standard handling",
    tone: analyticsBarTones[(index + 2) % analyticsBarTones.length],
  }));
  const riskRows = risks.map((risk, index) => ({
    label: risk,
    value: crs.filter((cr) => cr.risk === risk).length,
    detail:
      risk === "High"
        ? "Escalation watch"
        : risk === "Medium"
          ? "Monitor"
          : "Stable",
    tone: analyticsBarTones[(index + 3) % analyticsBarTones.length],
  }));
  const phaseRows = workflowPhaseDefinitions.map((phase, index) => ({
    label: phase.label,
    value: crs.filter((cr) => getWorkflowPhaseIndex(cr) === index).length,
    detail: `${phase.statuses.length} status${phase.statuses.length === 1 ? "" : "es"}`,
    tone: analyticsBarTones[(index + 1) % analyticsBarTones.length],
  }));
  const dueRows = buildDueBucketRows(openCrs);

  const metrics: AnalyticsMetric[] = [
    {
      label: "Total CRs",
      value: `${total}`,
      detail: `${openCount} open / ${closedCount} terminal`,
      tone: "bg-slate-950 text-white",
      accent: "bg-slate-950",
      icon: BarChart3,
    },
    {
      label: "Open Work",
      value: `${openCount}`,
      detail: `${percentOf(openCount, total)}% of the register is active`,
      tone: "bg-blue-50 text-blue-700",
      accent: "bg-blue-700",
      icon: CircleDot,
    },
    {
      label: "Completion",
      value: `${completionRate}%`,
      detail: `${closedCount} implemented, closed, or rejected`,
      tone: "bg-emerald-50 text-emerald-700",
      accent: "bg-emerald-600",
      icon: CheckCircle2,
    },
    {
      label: "Attention",
      value: `${attentionCount}`,
      detail: "Blocked, high risk, overdue, or task-blocked",
      tone: "bg-rose-50 text-rose-700",
      accent: "bg-rose-600",
      icon: AlertTriangle,
    },
    {
      label: "Due Pressure",
      value: `${overdueCount}/${dueSoonCount}`,
      detail: "Overdue / due within 14 days",
      tone: "bg-amber-50 text-amber-800",
      accent: "bg-amber-500",
      icon: CalendarClock,
    },
    {
      label: "Assigned to Me",
      value: `${assignedToMe}`,
      detail: localOwner || "No local owner selected",
      tone: "bg-slate-100 text-slate-700",
      accent: "bg-slate-500",
      icon: UserRound,
    },
    {
      label: "Top Owner",
      value: busiestOwner?.owner ?? "None",
      detail: busiestOwner
        ? `${busiestOwner.open} open / ${busiestOwner.attention} attention`
        : "No ownership load yet",
      tone: "bg-cyan-50 text-cyan-800",
      accent: "bg-cyan-700",
      icon: SlidersHorizontal,
    },
    {
      label: "Review Queue",
      value: `${reviewQueueCount}`,
      detail: "Ready, scheduled, testing, or in review",
      tone: "bg-fuchsia-50 text-fuchsia-800",
      accent: "bg-fuchsia-600",
      icon: FileSpreadsheet,
    },
  ];

  return {
    total,
    openCount,
    closedCount,
    completionRate,
    attentionCount,
    assignedToMe,
    overdueCount,
    dueSoonCount,
    metrics,
    statusRows,
    priorityRows,
    riskRows,
    phaseRows,
    dueRows,
    ownerRows,
    councilRows,
    taskRows,
    riskWatchlist,
    completenessRows,
    monthlyRows,
  };
}

function buildOwnerLoadRows(crs: Cr[]): OwnerLoadRow[] {
  const ownerMap = new Map<string, Cr[]>();

  for (const cr of crs) {
    const owner = cr.owner.trim() || "Unassigned";
    ownerMap.set(owner, [...(ownerMap.get(owner) ?? []), cr]);
  }

  return Array.from(ownerMap.entries())
    .map(([owner, ownerCrs]) => {
      const ages = ownerCrs.map((cr) => crAgeDays(cr));
      return {
        owner,
        total: ownerCrs.length,
        open: ownerCrs.filter((cr) => !isTerminal(cr.status)).length,
        attention: ownerCrs.filter((cr) => needsAttention(cr)).length,
        highRisk: ownerCrs.filter((cr) => cr.risk === "High").length,
        critical: ownerCrs.filter((cr) => cr.priority === "Critical").length,
        dueSoon: ownerCrs.filter((cr) => isDueSoon(cr)).length,
        overdue: ownerCrs.filter((cr) => {
          const days = daysUntil(cr.targetDate);
          return days !== null && days < 0 && !isTerminal(cr.status);
        }).length,
        averageAgeDays: averageRounded(ages),
      };
    })
    .sort(
      (first, second) =>
        second.open - first.open ||
        second.attention - first.attention ||
        second.overdue - first.overdue ||
        first.owner.localeCompare(second.owner),
    );
}

function buildCouncilLoadRows(crs: Cr[]): CouncilLoadRow[] {
  return eccBoards.map((board) => {
    const boardCrs = crs.filter((cr) => (cr.eccBoard ?? "Other") === board);
    const terminal = boardCrs.filter((cr) => isTerminal(cr.status)).length;

    return {
      board,
      total: boardCrs.length,
      open: boardCrs.filter((cr) => !isTerminal(cr.status)).length,
      blocked: boardCrs.filter((cr) => cr.status === "Blocked").length,
      highRisk: boardCrs.filter((cr) => cr.risk === "High").length,
      critical: boardCrs.filter((cr) => cr.priority === "Critical").length,
      dueSoon: boardCrs.filter((cr) => isDueSoon(cr)).length,
      overdue: boardCrs.filter((cr) => {
        const days = daysUntil(cr.targetDate);
        return days !== null && days < 0 && !isTerminal(cr.status);
      }).length,
      meetings: boardCrs.filter((cr) => Boolean(cr.meetingDate)).length,
      completionRate: percentOf(terminal, boardCrs.length),
    };
  });
}

function buildTaskReadinessRows(crs: Cr[]): TaskReadinessRow[] {
  return analyticsTaskFields.map((field) => {
    const counts = taskStates.reduce(
      (current, state) => ({ ...current, [state]: 0 }),
      {} as Record<TaskState, number>,
    );

    for (const cr of crs) {
      counts[field.state(cr)] += 1;
    }

    const applicableTotal = Math.max(crs.length - counts["Not Applicable"], 0);

    return {
      label: field.label,
      complete: counts.Complete,
      inProgress: counts["In Progress"],
      blocked: counts.Blocked,
      notStarted: counts["Not Started"],
      notApplicable: counts["Not Applicable"],
      completionRate: percentOf(counts.Complete, applicableTotal),
    };
  });
}

function buildDueBucketRows(openCrs: Cr[]): AnalyticsBarRow[] {
  const buckets = [
    {
      label: "Overdue",
      detail: "Target date passed",
      tone: "bg-rose-600",
      match: (days: number | null) => days !== null && days < 0,
    },
    {
      label: "Due Today",
      detail: "Due now",
      tone: "bg-red-600",
      match: (days: number | null) => days === 0,
    },
    {
      label: "1-7 Days",
      detail: "This week",
      tone: "bg-amber-500",
      match: (days: number | null) => days !== null && days >= 1 && days <= 7,
    },
    {
      label: "8-14 Days",
      detail: "Next two weeks",
      tone: "bg-yellow-500",
      match: (days: number | null) => days !== null && days >= 8 && days <= 14,
    },
    {
      label: "15-30 Days",
      detail: "Next month",
      tone: "bg-cyan-700",
      match: (days: number | null) => days !== null && days >= 15 && days <= 30,
    },
    {
      label: "Later",
      detail: "More than 30 days out",
      tone: "bg-emerald-600",
      match: (days: number | null) => days !== null && days > 30,
    },
    {
      label: "No Target",
      detail: "Missing target date",
      tone: "bg-slate-500",
      match: (days: number | null) => days === null,
    },
  ];

  return buckets.map((bucket) => ({
    label: bucket.label,
    detail: bucket.detail,
    tone: bucket.tone,
    value: openCrs.filter((cr) => bucket.match(daysUntil(cr.targetDate)))
      .length,
  }));
}

function buildCompletenessRows(crs: Cr[]): AnalyticsBarRow[] {
  const fields: Array<{
    label: string;
    hasValue: (cr: Cr) => boolean;
  }> = [
    { label: "Target Date", hasValue: (cr) => Boolean(cr.targetDate) },
    { label: "Meeting Date", hasValue: (cr) => Boolean(cr.meetingDate) },
    { label: "NCDOC", hasValue: (cr) => Boolean(cr.ncdocNumber?.trim()) },
    { label: "Supplier", hasValue: (cr) => Boolean(cr.supplier?.trim()) },
    {
      label: "Charge Number",
      hasValue: (cr) => Boolean(cr.wbsChargeNumber?.trim()),
    },
    {
      label: "Responsible IPTs",
      hasValue: (cr) => (cr.responsibleIpts ?? []).length > 0,
    },
    {
      label: "Engine Programs",
      hasValue: (cr) => (cr.enginePrograms ?? []).length > 0,
    },
    {
      label: "Component Models",
      hasValue: (cr) => (cr.componentModels ?? []).length > 0,
    },
    {
      label: "CR Folder",
      hasValue: (cr) => Boolean(cr.crFolderPath?.trim()),
    },
    {
      label: "Design Authority",
      hasValue: (cr) => Boolean(cr.designAuthority?.trim()),
    },
  ];

  return fields.map((field, index) => {
    const value = crs.filter((cr) => field.hasValue(cr)).length;
    return {
      label: field.label,
      value,
      detail: `${percentOf(value, crs.length)}% populated`,
      tone: analyticsBarTones[(index + 4) % analyticsBarTones.length],
    };
  });
}

function buildMonthlyIntakeRows(crs: Cr[]): AnalyticsBarRow[] {
  const monthMap = new Map<string, number>();

  for (const cr of crs) {
    const month = monthBucket(cr.submittedDate);
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  }

  return Array.from(monthMap.entries())
    .sort(([first], [second]) => first.localeCompare(second))
    .slice(-12)
    .map(([label, value], index) => ({
      label,
      value,
      detail: `${percentOf(value, crs.length)}% of register`,
      tone: analyticsBarTones[(index + 5) % analyticsBarTones.length],
    }));
}

function buildRiskWatchlist(crs: Cr[]): RiskWatchRow[] {
  return crs
    .filter((cr) => !isTerminal(cr.status))
    .map((cr) => ({
      cr,
      score: riskScore(cr),
    }))
    .filter((item) => item.score > 0)
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.cr.targetDate?.localeCompare(second.cr.targetDate ?? "") ||
        second.cr.lastUpdatedAt - first.cr.lastUpdatedAt,
    )
    .slice(0, 10)
    .map(({ cr }) => ({
      crNumber: cr.crNumber,
      title: cr.title,
      owner: cr.owner,
      status: cr.status,
      priority: cr.priority,
      risk: cr.risk,
      board: cr.eccBoard ?? "Other",
      gate: cr.currentGate ?? "None",
      dueLabel: dueLabel(cr),
      drivers: riskDrivers(cr),
      updated: formatTimestamp(cr.lastUpdatedAt),
    }));
}

function riskScore(cr: Cr) {
  const days = daysUntil(cr.targetDate);
  let score = 0;

  if (cr.status === "Blocked") score += 110;
  if (cr.status === "Held for Actions") score += 70;
  if (cr.status === "Pending OOC Approvals") score += 45;
  if (cr.risk === "High") score += 85;
  if (cr.risk === "Medium") score += 25;
  if (cr.priority === "Critical") score += 70;
  if (cr.priority === "High") score += 35;
  if (days !== null && days < 0) score += 65 + Math.min(Math.abs(days), 45);
  if (days !== null && days >= 0 && days <= 14) score += 25;
  if (hasBlockedWorkflowTask(cr)) score += 40;
  if (!cr.targetDate) score += 10;

  return score;
}

function riskDrivers(cr: Cr) {
  const days = daysUntil(cr.targetDate);
  const drivers: string[] = [];

  if (cr.status === "Blocked") drivers.push("blocked");
  if (cr.status === "Held for Actions") drivers.push("held for actions");
  if (cr.status === "Pending OOC Approvals") drivers.push("pending approvals");
  if (cr.risk === "High") drivers.push("high risk");
  if (cr.priority === "Critical") drivers.push("critical priority");
  if (days !== null && days < 0) drivers.push(`${Math.abs(days)}d overdue`);
  if (days !== null && days >= 0 && days <= 14) {
    drivers.push(days === 0 ? "due today" : `due in ${days}d`);
  }
  const blockedTasks = blockedWorkflowTaskLabels(cr);
  if (blockedTasks.length > 0) {
    drivers.push(`${blockedTasks.join(", ")} blocked`);
  }
  if (!cr.targetDate) drivers.push("no target date");

  return drivers.join(", ") || "Active CR";
}

function hasBlockedWorkflowTask(cr: Cr) {
  return blockedWorkflowTaskLabels(cr).length > 0;
}

function blockedWorkflowTaskLabels(cr: Cr) {
  return analyticsTaskFields
    .filter((field) => field.state(cr) === "Blocked")
    .map((field) => field.label);
}

function averageRounded(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

function crAgeDays(cr: Cr) {
  const submitted = dateOnlyToTime(cr.submittedDate);
  const start = submitted ?? cr._creationTime;
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000));
}

function dateOnlyToTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function monthBucket(value: string | null | undefined) {
  if (!value) {
    return "No submitted date";
  }
  return /^\d{4}-\d{2}/.test(value) ? value.slice(0, 7) : "Invalid date";
}

function percentOf(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

function downloadAnalyticsWorkbook(
  crs: Cr[],
  localOwner: string,
  filenamePrefix: string,
) {
  const generatedAt = new Date();
  const sheets = buildAnalyticsWorkbookSheets(crs, localOwner, generatedAt);
  downloadExcelWorkbook(
    `${filenamePrefix}-${excelDateStamp(generatedAt)}.xls`,
    sheets,
  );
}

function buildAnalyticsWorkbookSheets(
  crs: Cr[],
  localOwner: string,
  generatedAt: Date,
): ExcelSheet[] {
  const analytics = buildAnalyticsModel(crs, localOwner);

  return [
    {
      name: "Summary",
      rows: [
        ["Generated At", generatedAt.toLocaleString()],
        ["Local Owner", localOwner || "Not set"],
        ["Source Rows", analytics.total],
        [null],
        ["Metric", "Value", "Detail"],
        ...analytics.metrics.map((metric) => [
          metric.label,
          metric.value,
          metric.detail,
        ]),
        [null],
        ["Workbook Sheet", "Rows", "Notes"],
        ["CR Register", crs.length, "Full exported CR fields"],
        ["Status Mix", analytics.statusRows.length, "Status distribution"],
        ["Owner Load", analytics.ownerRows.length, "Owner workload rollup"],
        ["Council Load", analytics.councilRows.length, "ECC board rollup"],
        ["Risk Watchlist", analytics.riskWatchlist.length, "Top active risks"],
      ],
    },
    {
      name: "CR Register",
      rows: buildCrRegisterExcelRows(crs),
    },
    analyticsBarSheet("Status Mix", analytics.statusRows, analytics.total),
    analyticsBarSheet("Due Buckets", analytics.dueRows, analytics.openCount),
    analyticsBarSheet("Priority", analytics.priorityRows, analytics.total),
    analyticsBarSheet("Risk", analytics.riskRows, analytics.total),
    analyticsBarSheet("Workflow Phase", analytics.phaseRows, analytics.total),
    {
      name: "Owner Load",
      rows: [
        [
          "Owner",
          "Total",
          "Open",
          "Attention",
          "High Risk",
          "Critical Priority",
          "Due Soon",
          "Overdue",
          "Average Age Days",
        ],
        ...analytics.ownerRows.map((row) => [
          row.owner,
          row.total,
          row.open,
          row.attention,
          row.highRisk,
          row.critical,
          row.dueSoon,
          row.overdue,
          row.averageAgeDays,
        ]),
      ],
    },
    {
      name: "Council Load",
      rows: [
        [
          "Council",
          "Total",
          "Open",
          "Blocked",
          "High Risk",
          "Critical Priority",
          "Due Soon",
          "Overdue",
          "Meetings",
          "Completion %",
        ],
        ...analytics.councilRows.map((row) => [
          row.board,
          row.total,
          row.open,
          row.blocked,
          row.highRisk,
          row.critical,
          row.dueSoon,
          row.overdue,
          row.meetings,
          row.completionRate,
        ]),
      ],
    },
    {
      name: "Task Readiness",
      rows: [
        [
          "Task",
          "Complete",
          "In Progress",
          "Blocked",
          "Not Started",
          "Not Applicable",
          "Completion %",
        ],
        ...analytics.taskRows.map((row) => [
          row.label,
          row.complete,
          row.inProgress,
          row.blocked,
          row.notStarted,
          row.notApplicable,
          row.completionRate,
        ]),
      ],
    },
    {
      name: "Risk Watchlist",
      rows: [
        [
          "CR #",
          "Title",
          "Owner",
          "Status",
          "Priority",
          "Risk",
          "Board",
          "Gate",
          "Due",
          "Drivers",
          "Updated",
        ],
        ...analytics.riskWatchlist.map((row) => [
          row.crNumber,
          row.title,
          row.owner,
          row.status,
          row.priority,
          row.risk,
          row.board,
          row.gate,
          row.dueLabel,
          row.drivers,
          row.updated,
        ]),
      ],
    },
    analyticsBarSheet(
      "Register Completeness",
      analytics.completenessRows,
      analytics.total,
    ),
    analyticsBarSheet("Monthly Intake", analytics.monthlyRows, analytics.total),
  ];
}

function analyticsBarSheet(
  name: string,
  rows: AnalyticsBarRow[],
  total: number,
): ExcelSheet {
  return {
    name,
    rows: [
      ["Label", "Value", "Percent", "Detail"],
      ...rows.map((row) => [
        row.label,
        row.value,
        percentOf(row.value, total),
        row.detail ?? "",
      ]),
    ],
  };
}

function buildCrRegisterExcelRows(crs: Cr[]): ExcelCell[][] {
  return [
    [
      "CR #",
      "Title",
      "Status",
      "Priority",
      "Risk",
      "Lifecycle",
      "Category",
      "Owner",
      "Requester",
      "System",
      "ECC Board",
      "Classification",
      "Current Gate",
      "Meeting Date",
      "Meeting Time EST",
      "Target Date",
      "Due Label",
      "Submitted Date",
      "Age Days",
      "Documentation Deadline",
      "NCDOC",
      "Class/Gate/Military Supplier EC",
      "Responsible IPTs",
      "Engine Programs",
      "Component Models",
      "Supplier",
      "FAR 15",
      "CR Folder Path",
      "WBS/Charge Number",
      "Charge Number Active",
      "Quorum",
      "Documentation Notification",
      "Pre-Meeting Review",
      "Meeting Attendance",
      "Post-Meeting PDF",
      "NCDOC Status",
      "xClass Status",
      "OOC Approval",
      "Chair Approval",
      "Closure Notification",
      "CM Working List",
      "Waiver Option",
      "Design Authority",
      "Disposition",
      "Business Impact",
      "Technical Notes",
      "Description",
      "Tags",
      "Last Updated",
    ],
    ...crs.map((cr) => [
      cr.crNumber,
      cr.title,
      cr.status,
      cr.priority,
      cr.risk,
      isTerminal(cr.status) ? "Terminal" : "Open",
      cr.category,
      cr.owner,
      cr.requester,
      cr.system,
      cr.eccBoard ?? "Other",
      cr.classification ?? "TBD",
      cr.currentGate ?? "None",
      cr.meetingDate ?? "",
      cr.meetingTimeEst ?? "",
      cr.targetDate ?? "",
      dueLabel(cr),
      cr.submittedDate,
      crAgeDays(cr),
      cr.documentationDeadline ?? "",
      cr.ncdocNumber ?? "",
      cr.classGateMilitarySupplierEc ?? "",
      formatExcelList(cr.responsibleIpts),
      formatExcelList(cr.enginePrograms),
      formatExcelList(cr.componentModels),
      cr.supplier ?? "",
      cr.far15 ?? false,
      cr.crFolderPath ?? "",
      cr.wbsChargeNumber ?? "",
      cr.chargeNumberActive ?? false,
      formatExcelList(cr.quorum),
      cr.documentationNotificationStatus ?? "Not Started",
      cr.preMeetingReviewStatus ?? "Not Started",
      cr.meetingAttendanceStatus ?? "Not Started",
      cr.postMeetingPdfStatus ?? "Not Started",
      cr.ncdocStatus ?? "Not Started",
      cr.xclassStatus ?? "Not Started",
      cr.oocApprovalStatus ?? "Not Started",
      cr.chairApprovalStatus ?? "Not Started",
      cr.closureNotificationStatus ?? "Not Started",
      cr.cmWorkingListStatus ?? "Not Started",
      cr.waiverOption ?? "",
      cr.designAuthority ?? "",
      cr.disposition ?? "",
      cr.businessImpact,
      cr.technicalNotes,
      cr.description,
      formatExcelList(cr.tags),
      formatExcelDateTime(cr.lastUpdatedAt),
    ]),
  ];
}

function downloadExcelWorkbook(filename: string, sheets: ExcelSheet[]) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const workbook = buildExcelWorkbookXml(sheets);
  const blob = new Blob([workbook], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function buildExcelWorkbookXml(sheets: ExcelSheet[]) {
  const worksheets = sheets
    .map(
      (sheet) => `
  <Worksheet ss:Name="${escapeXmlAttribute(safeWorksheetName(sheet.name))}">
    <Table>
${sheet.rows
  .map(
    (row, rowIndex) =>
      `      <Row>${row
        .map((cell) => excelCellXml(cell, rowIndex === 0))
        .join("")}</Row>`,
  )
  .join("\n")}
    </Table>
  </Worksheet>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#EAF2F8" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
  </Styles>
${worksheets}
</Workbook>`;
}

function excelCellXml(cell: ExcelCell, isHeader: boolean) {
  const normalized = normalizeExcelCell(cell);
  const style = isHeader ? ' ss:StyleID="Header"' : "";

  if (typeof normalized === "number" && Number.isFinite(normalized)) {
    return `<Cell${style}><Data ss:Type="Number">${normalized}</Data></Cell>`;
  }

  return `<Cell${style}><Data ss:Type="String">${escapeXmlText(
    String(normalized),
  )}</Data></Cell>`;
}

function normalizeExcelCell(cell: ExcelCell) {
  if (cell === null || cell === undefined) {
    return "";
  }
  if (typeof cell === "boolean") {
    return cell ? "Yes" : "No";
  }
  return cell;
}

function formatExcelList(value: string[] | undefined) {
  return (value ?? []).join("; ");
}

function formatExcelDateTime(value: number) {
  return new Date(value).toLocaleString();
}

function excelDateStamp(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("");
}

function safeWorksheetName(name: string) {
  return (
    name
      .replace(/[:\\/?*\[\]]/g, " ")
      .trim()
      .slice(0, 31) || "Sheet"
  );
}

function escapeXmlText(value: string) {
  return cleanExcelText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXmlAttribute(value: string) {
  return escapeXmlText(value).replace(/"/g, "&quot;");
}

function cleanExcelText(value: string) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function isTerminal(status: CrStatus) {
  return (
    status === "Implemented" || status === "Closed" || status === "Rejected"
  );
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
  const suffix = Math.floor(10_000 + Math.random() * 90_000);
  return {
    crNumber: `CR-02${suffix}`,
    title: "",
    status: "Intake",
    priority: "Medium",
    risk: "Low",
    category: "PWES Military ECC",
    owner: "Unassigned",
    requester: "",
    system: "PWES Military ECC",
    targetDate: "",
    submittedDate: todayInput(),
    description: "",
    businessImpact: "",
    technicalNotes: "",
    tagsInput: "",
    eccBoard: "PWES Military",
    classification: "TBD",
    currentGate: "None",
    meetingDate: "",
    meetingTimeEst: "",
    ncdocNumber: "",
    classGateMilitarySupplierEc: "",
    responsibleIptsInput: "",
    engineProgramsInput: "",
    componentModelsInput: "",
    supplier: "",
    far15: false,
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
    disposition: "",
    eccCoordinator: "",
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
    meetingTimeEst: cr.meetingTimeEst ?? "",
    ncdocNumber: cr.ncdocNumber ?? "",
    classGateMilitarySupplierEc: cr.classGateMilitarySupplierEc ?? "",
    responsibleIptsInput: (cr.responsibleIpts ?? []).join(", "),
    engineProgramsInput: (cr.enginePrograms ?? []).join(", "),
    componentModelsInput: (cr.componentModels ?? []).join(", "),
    supplier: cr.supplier ?? "",
    far15: cr.far15 ?? false,
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
    eccCoordinator: cr.eccCoordinator ?? "",
  };
}

function applyIntakeFields(
  form: CrFormState,
  fields: IntakeFields,
): CrFormState {
  const next = { ...form };

  setIfPresent(next, "crNumber", fields.crNumber, normalizeCrNumber);
  setIfPresent(next, "ncdocNumber", fields.ncdocNumber);
  setIfPresent(next, "meetingDate", fields.meetingDate);
  setIfPresent(next, "meetingTimeEst", fields.meetingTimeEst);
  setIfPresent(
    next,
    "classGateMilitarySupplierEc",
    fields.classGateMilitarySupplierEc,
  );
  setIfPresent(next, "disposition", fields.disposition);
  setIfPresent(next, "supplier", fields.supplier);
  setIfPresent(next, "description", fields.description);
  setIfPresent(next, "wbsChargeNumber", fields.wbsChargeNumber);
  setIfPresent(next, "documentationDeadline", fields.documentationDeadline);
  setIfPresent(next, "targetDate", fields.targetDate);
  setIfPresent(next, "designAuthority", fields.designAuthority);
  setIfPresent(next, "eccCoordinator", fields.eccCoordinator);

  const responsibleIpts = listToInput(fields.responsibleIpts);
  if (responsibleIpts) {
    next.responsibleIptsInput = responsibleIpts;
  }

  const enginePrograms = listToInput(fields.enginePrograms);
  if (enginePrograms) {
    next.engineProgramsInput = enginePrograms;
  }

  const componentModels = listToInput(fields.componentModels);
  if (componentModels) {
    next.componentModelsInput = componentModels;
  }

  if (typeof fields.far15 === "boolean") {
    next.far15 = fields.far15;
  }

  return next;
}

function setIfPresent<Key extends keyof CrFormState>(
  form: CrFormState,
  key: Key,
  value: string | undefined,
  transform: (value: string) => string = (currentValue) => currentValue,
) {
  const trimmed = value?.trim();
  if (trimmed) {
    form[key] = transform(trimmed) as CrFormState[Key];
  }
}

function listToInput(value: string[] | undefined) {
  return (
    value
      ?.map((item) => item.trim())
      .filter(Boolean)
      .join(", ") ?? ""
  );
}

async function readScreenshotFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Use a screenshot image.");
  }

  if (file.size > maxIntakeImageBytes) {
    throw new Error("Use an image under 8 MB.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  return {
    dataUrl,
    base64: dataUrlToBase64(dataUrl),
    mimeType: file.type,
    name: file.name || "Pasted screenshot",
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read screenshot."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read screenshot."));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBase64(dataUrl: string) {
  return dataUrl.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "");
}

function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as EccSpeechWindow;
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

function subscribeToStaticStore() {
  return () => {};
}

function getVoiceSupportSnapshot() {
  return Boolean(getSpeechRecognitionConstructor());
}

function getFalseSnapshot() {
  return false;
}

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanSpokenText(text));
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function cleanSpokenText(text: string) {
  return text
    .replace(/\[Screenshot attached\]/gi, "")
    .replace(/\bCR-(\d+)/g, "CR $1")
    .trim();
}

function formToCreateArgs(form: CrFormState) {
  const crNumber = normalizeCrNumber(form.crNumber);
  const responsibleIpts = parseList(form.responsibleIptsInput);
  const enginePrograms = parseList(form.engineProgramsInput);
  const componentModels = parseList(form.componentModelsInput);
  const supplier = form.supplier.trim();

  return {
    crNumber,
    title: buildCrTitle(form, crNumber),
    status: form.status,
    priority: form.priority,
    risk: form.risk,
    category:
      form.classGateMilitarySupplierEc.trim() ||
      form.category ||
      "PWES Military ECC",
    owner:
      form.eccCoordinator.trim() ||
      responsibleIpts[0] ||
      form.owner ||
      "Unassigned",
    requester: form.requester,
    system:
      [...enginePrograms, ...componentModels].join(" / ") ||
      form.system ||
      "PWES Military ECC",
    targetDate: form.targetDate || null,
    submittedDate: form.submittedDate,
    description: form.description,
    businessImpact: form.businessImpact,
    technicalNotes: form.technicalNotes,
    tags: cleanTagList([
      ...parseTags(form.tagsInput),
      ...enginePrograms,
      ...componentModels,
      supplier,
    ]),
    ...formToWorkflowArgs(form),
    author: "Collins user",
  };
}

function formToUpdateArgs(form: CrFormState, existingCrNumber: string) {
  const crNumber = normalizeCrNumber(form.crNumber);
  return {
    ...(crNumber !== normalizeCrNumber(existingCrNumber) ? { crNumber } : {}),
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
    author: "Collins user",
  };
}

function buildCrTitle(form: CrFormState, crNumber: string) {
  const title =
    form.title.trim() ||
    form.description.trim().replace(/\s+/g, " ") ||
    form.classGateMilitarySupplierEc.trim() ||
    form.supplier.trim() ||
    parseList(form.engineProgramsInput)[0] ||
    crNumber ||
    "New CR";

  return title.length > 120 ? `${title.slice(0, 117)}...` : title;
}

function formToWorkflowArgs(form: CrFormState) {
  return {
    eccBoard: form.eccBoard,
    classification: form.classification,
    currentGate: form.currentGate,
    meetingDate: form.meetingDate || null,
    meetingTimeEst: form.meetingTimeEst,
    ncdocNumber: form.ncdocNumber,
    classGateMilitarySupplierEc: form.classGateMilitarySupplierEc,
    responsibleIpts: parseList(form.responsibleIptsInput),
    enginePrograms: parseList(form.engineProgramsInput),
    componentModels: parseList(form.componentModelsInput),
    supplier: form.supplier,
    far15: form.far15,
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
    eccCoordinator: form.eccCoordinator,
  };
}

function parseTags(value: string) {
  return cleanTagList(
    value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  );
}

function cleanTagList(tags: string[]) {
  return Array.from(
    new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
  ).slice(0, 12);
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCrNumber(value: string) {
  const normalized = value.trim().toUpperCase();
  const digitsOnly = normalized.match(/^CR[-\s_]*(\d{1,7})$/);
  if (digitsOnly) {
    return `CR-${digitsOnly[1].padStart(7, "0")}`;
  }
  return normalized;
}

function taskStateTone(state: string) {
  if (
    state === "Complete" ||
    state === "Closed" ||
    state === "Approved" ||
    state === "Not Holding"
  ) {
    return "text-emerald-700";
  }
  if (state === "Blocked" || state === "Rejected") {
    return "text-rose-700";
  }
  if (state === "In Progress" || state === "Sent" || state === "Open") {
    return "text-blue-700";
  }
  if (state === "Needed") {
    return "text-amber-700";
  }
  return "text-slate-500";
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
