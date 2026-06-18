import { api } from "@/convex/_generated/api";
import {
  fetchAuthMutation,
  fetchAuthQuery,
  isAuthenticated,
} from "@/lib/auth-server";
import { requestOllamaChat } from "@/lib/ollama";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

type IncomingMessage = {
  role: "assistant" | "user";
  content: string;
};

type AssistantImage = {
  mimeType?: string;
  base64?: string;
};

type AssistantRequest = {
  messages?: IncomingMessage[];
  selectedCrNumber?: string | null;
  image?: AssistantImage | null;
};

type AssistantServiceResponse = {
  message?: {
    content?: string;
  };
};

type AssistantChatMessage = {
  role: "assistant" | "user";
  content: string;
  images?: string[];
};

type WorkflowStatus = "Closed" | "Pending OOC Approvals";

type WorkflowTaskState = "Complete" | "In Progress";

type AssistantWorkflowCommand = {
  crNumber: string;
  sourceText: string;
  title: string;
  status?: WorkflowStatus;
  eccScope?: string;
  previousWork?: string;
  disposition?: string;
  oocApprovalStatus?: WorkflowTaskState;
  closureNotificationStatus?: WorkflowTaskState;
  author: string;
};

type AssistantWorkflowResult = {
  crNumber: string;
  operation: "created" | "updated";
  status: WorkflowStatus | string;
};

const DEFAULT_MODEL = "qwen3:latest";
const DEFAULT_VISION_MODEL = "qwen2.5vl:3b";
const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as AssistantRequest | null;
  const messages = normalizeMessages(body?.messages ?? []);

  if (messages.length === 0) {
    return NextResponse.json(
      { error: "Send at least one message to ask about CRs." },
      { status: 400 },
    );
  }

  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Sign in to use the ECC assistant." },
      { status: 401 },
    );
  }

  const selectedCrNumber = body?.selectedCrNumber ?? null;
  const workflowCommand = parseAssistantWorkflowCommand(
    messages,
    selectedCrNumber,
  );

  if (workflowCommand) {
    try {
      const result = (await fetchAuthMutation(
        api.crs.upsertFromAssistant,
        workflowCommand,
      )) as AssistantWorkflowResult;

      return NextResponse.json({
        answer: buildWorkflowActionAnswer(result, workflowCommand),
      });
    } catch (error) {
      console.error("Assistant workflow update failed", error);
      return NextResponse.json(
        {
          error:
            "I understood the workflow update, but could not save it to the CR register.",
        },
        { status: 500 },
      );
    }
  }

  const imageBase64 = cleanImageBase64(body?.image?.base64 ?? "");
  const model = imageBase64
    ? process.env.OLLAMA_VISION_MODEL ?? DEFAULT_VISION_MODEL
    : process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_URL;
  const context = await fetchAuthQuery(api.crs.assistantContext, { limit: 100 });
  const processKnowledge = await readProcessKnowledge();

  const systemPrompt = [
    "You are an ECC assistant for Collins Aerospace engineering change requests.",
    "Use only the CR data provided in the JSON context. If the data does not answer the question, say what is missing.",
    "Be concise, practical, and specific. Mention CR numbers when making claims.",
    "If the user attaches a screenshot with CR intake notes, read the screenshot and extract the PWES Military ECC fields. Read digits exactly and double-check CR numbers, dates, and charge numbers. Map Presenter to ECC Coordinator, Timestamp or Timeslot to Meeting Date and Time, Provide Collins CR to Collins CR # / PW REA #, CR Title/Description to Description, Engine Programs affected to Engine Program(s), Review being requested and CR Classification to Class/Gate/Military Supplier EC, Component Model name to Component Model(s), and Open Charge Number to Charge Number.",
    "Do not reveal chain-of-thought or use think tags.",
    selectedCrNumber
      ? `The user currently has ${selectedCrNumber} selected in the UI.`
      : "No CR is currently selected in the UI.",
    `Current timestamp: ${new Date().toISOString()}.`,
    `ECC process knowledge:\n${processKnowledge}`,
    `CR JSON context:\n${JSON.stringify(context, null, 2).slice(0, 30000)}`,
  ].join("\n\n");

  try {
    const chatMessages: AssistantChatMessage[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    if (imageBase64) {
      const lastUserIndex = findLastUserMessageIndex(chatMessages);
      if (lastUserIndex === -1) {
        chatMessages.push({
          role: "user",
          content:
            "Read the attached screenshot and extract the PWES Military ECC CR intake details.",
          images: [imageBase64],
        });
      } else {
        chatMessages[lastUserIndex] = {
          ...chatMessages[lastUserIndex],
          images: [imageBase64],
        };
      }
    }

    const ollamaResponse = await requestOllamaChat({
      ollamaBaseUrl,
      model,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        ...chatMessages,
      ],
      options: {
        temperature: 0.2,
      },
    });

    if (!ollamaResponse.ok) {
      await ollamaResponse.text();
      return NextResponse.json(
        {
          error:
            "The ECC assistant is temporarily unavailable. Please try again later.",
        },
        { status: 502 },
      );
    }

    const data = (await ollamaResponse.json()) as AssistantServiceResponse;
    const answer = data.message?.content?.trim();

    return NextResponse.json({
      answer:
        answer ||
        "The ECC assistant did not return a response. Please try again.",
    });
  } catch (error) {
    console.error("Assistant service request failed", error);
    return NextResponse.json(
      {
        error:
          "The ECC assistant is temporarily unavailable. Please try again later.",
      },
      { status: 502 },
    );
  }
}

function findLastUserMessageIndex(messages: AssistantChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return index;
    }
  }
  return -1;
}

function cleanImageBase64(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "").trim();
}

function parseAssistantWorkflowCommand(
  messages: IncomingMessage[],
  selectedCrNumber: string | null,
): AssistantWorkflowCommand | null {
  const latestUserMessage = findLastUserMessage(messages);
  if (!latestUserMessage) {
    return null;
  }

  const sourceText = latestUserMessage.content
    .replace(/\[Screenshot attached\]/gi, "")
    .trim();
  if (!sourceText) {
    return null;
  }

  const crNumber = normalizeCrNumber(
    findCrNumber(sourceText) || selectedCrNumber || "",
  );
  if (!crNumber) {
    return null;
  }

  const mentionsClosure = /\b(?:closure|closed|closeout|close-out)\b/i.test(
    sourceText,
  );
  const mentionsOoc = /\b(?:ooc|out[-\s]?of[-\s]?cycle)\b/i.test(sourceText);
  const hasActionIntent =
    /\b(?:push(?:ed)?|move(?:d)?|set|mark(?:ed)?|update(?:d)?|create(?:d)?|add(?:ed)?|put|send|sent|now|done|completed|previously)\b/i.test(
      sourceText,
    );

  if ((!mentionsClosure && !mentionsOoc) || !hasActionIntent) {
    return null;
  }

  const eccScope = extractEccScope(sourceText);
  const status = mentionsClosure
    ? "Closed"
    : mentionsOoc
      ? "Pending OOC Approvals"
      : undefined;
  const oocComplete =
    mentionsOoc &&
    /\b(?:previously|done|completed|complete|approved|finished)\b/i.test(
      sourceText,
    );
  const previousWork =
    oocComplete && mentionsClosure
      ? `OOC${eccScope ? ` for ${eccScope}` : ""}`
      : undefined;
  const title = buildWorkflowCommandTitle(crNumber, status, eccScope);
  const disposition = buildWorkflowCommandDisposition(status, eccScope);

  return {
    crNumber,
    sourceText,
    title,
    ...(status ? { status } : {}),
    ...(eccScope ? { eccScope } : {}),
    ...(previousWork ? { previousWork } : {}),
    ...(disposition ? { disposition } : {}),
    ...(mentionsOoc
      ? { oocApprovalStatus: oocComplete ? "Complete" : "In Progress" }
      : {}),
    ...(mentionsClosure ? { closureNotificationStatus: "In Progress" } : {}),
    author: "Collins AI",
  };
}

function findLastUserMessage(messages: IncomingMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return messages[index];
    }
  }
  return null;
}

function findCrNumber(value: string) {
  return value.match(/\bCR[-\s_]*(\d{1,7})\b/i)?.[0] ?? "";
}

function normalizeCrNumber(value: string) {
  const match = value.trim().match(/\bCR[-\s_]*(\d{1,7})\b/i);
  if (!match) {
    return "";
  }
  return `CR-${match[1].padStart(7, "0")}`;
}

function extractEccScope(value: string) {
  const matches = Array.from(
    value.matchAll(
      /\b(?:for|to|in)\s+([A-Z][A-Z&]*(?:\s+[A-Z][A-Z&]*){0,3}\s+ECC)\b/gi,
    ),
  );
  const match = matches.at(-1)?.[1] ?? "";
  return normalizeEccScope(match);
}

function normalizeEccScope(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\bms\b/gi, "MS")
    .replace(/\bpwes\b/gi, "PWES")
    .replace(/\becc\b/gi, "ECC");
}

function buildWorkflowCommandTitle(
  crNumber: string,
  status: WorkflowStatus | undefined,
  eccScope: string,
) {
  const scope = eccScope ? `${eccScope} ` : "";
  if (status === "Closed") {
    return `${crNumber} - ${scope}closure`;
  }
  if (status === "Pending OOC Approvals") {
    return `${crNumber} - ${scope}OOC`;
  }
  return `${crNumber} - ${scope}workflow update`;
}

function buildWorkflowCommandDisposition(
  status: WorkflowStatus | undefined,
  eccScope: string,
) {
  const scope = eccScope ? ` for ${eccScope}` : "";
  if (status === "Closed") {
    return `Pushed to closure${scope}`;
  }
  if (status === "Pending OOC Approvals") {
    return `Pending OOC approvals${scope}`;
  }
  return "";
}

function buildWorkflowActionAnswer(
  result: AssistantWorkflowResult,
  command: AssistantWorkflowCommand,
) {
  const action = result.operation === "created" ? "Created" : "Updated";
  const scope = command.eccScope ? ` for ${command.eccScope}` : "";
  const previous = command.previousWork
    ? ` I also marked ${command.previousWork} as complete.`
    : "";

  if (command.status === "Closed") {
    return `${action} ${result.crNumber} in All CRs and pushed it to the Closure phase${scope}.${previous} The workflow view will update from the CR register.`;
  }

  if (command.status === "Pending OOC Approvals") {
    return `${action} ${result.crNumber} in All CRs and moved it into OOC approvals${scope}.${previous} The workflow view will update from the CR register.`;
  }

  return `${action} ${result.crNumber} in All CRs. The workflow view will update from the CR register.`;
}

async function readProcessKnowledge() {
  try {
    return await readFile(
      path.join(process.cwd(), "docs", "ecc-process-knowledge.md"),
      "utf8",
    );
  } catch {
    return "No ECC process knowledge file was available.";
  }
}

function normalizeMessages(messages: IncomingMessage[]) {
  return messages
    .filter(
      (message) =>
        (message.role === "assistant" || message.role === "user") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, 4000),
    }));
}
