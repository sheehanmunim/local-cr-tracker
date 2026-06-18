import { isAuthenticated } from "@/lib/auth-server";
import { requestOllamaChat } from "@/lib/ollama";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type IntakeImage = {
  mimeType?: string;
  base64?: string;
};

type IntakeRequest = {
  prompt?: string;
  image?: IntakeImage | null;
};

type IntakeFields = {
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
};

type AssistantServiceResponse = {
  message?: {
    content?: string;
  };
};

const DEFAULT_TEXT_MODEL = "qwen3:latest";
const DEFAULT_VISION_MODEL = "qwen2.5vl:3b";
const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Sign in to use AI intake." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as IntakeRequest | null;
  const prompt = cleanString(body?.prompt ?? "");
  const imageBase64 = cleanImageBase64(body?.image?.base64 ?? "");

  if (!prompt && !imageBase64) {
    return NextResponse.json(
      { error: "Add a screenshot or notes to fill the CR fields." },
      { status: 400 },
    );
  }

  const model = imageBase64
    ? process.env.OLLAMA_VISION_MODEL ?? DEFAULT_VISION_MODEL
    : process.env.OLLAMA_MODEL ?? DEFAULT_TEXT_MODEL;
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_URL;
  const promptFields = parseIntakeText(prompt);
  const ocrText = imageBase64
    ? await extractTextFromImage(imageBase64, body?.image?.mimeType ?? "image/png")
    : "";
  const ocrFields = parseIntakeText(ocrText);
  const directFields = mergeFields(promptFields, ocrFields);

  if (hasUsableFields(directFields)) {
    return NextResponse.json({ fields: directFields });
  }

  try {
    const ollamaResponse = await requestOllamaChat({
      ollamaBaseUrl,
      model,
      stream: false,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
            content: buildUserPrompt(prompt, Boolean(imageBase64), ocrText),
            ...(imageBase64 ? { images: [imageBase64] } : {}),
          },
      ],
      options: {
        temperature: 0,
      },
    });

    if (!ollamaResponse.ok) {
      await ollamaResponse.text();
      if (hasUsableFields(directFields)) {
        return NextResponse.json({ fields: directFields });
      }
      return NextResponse.json(
        { error: "AI intake is temporarily unavailable. Please try again." },
        { status: 502 },
      );
    }

    const data = (await ollamaResponse.json()) as AssistantServiceResponse;
    const aiFields = normalizeFields(parseJsonObject(data.message?.content ?? ""));
    const responseTextFields = parseIntakeText(data.message?.content ?? "");
    const fields = mergeFields(
      promptFields,
      ocrFields,
      responseTextFields,
      aiFields,
    );

    return NextResponse.json({ fields });
  } catch (error) {
    console.error("CR intake request failed", error);
    if (hasUsableFields(directFields)) {
      return NextResponse.json({ fields: directFields });
    }
    return NextResponse.json(
      { error: "AI intake is temporarily unavailable. Please try again." },
      { status: 502 },
    );
  }
}

function buildSystemPrompt() {
  return [
    "You extract PWES Military ECC change request intake data for Collins Aerospace.",
    "Return only one JSON object. Do not use markdown, explanations, or extra keys.",
    "Do not invent missing values. Use empty strings, empty arrays, or null for missing fields.",
    "Normalize dates to YYYY-MM-DD when the source gives enough information.",
    "Normalize Time (EST) to HH:MM in 24-hour format when possible.",
    "Read digits exactly. Double-check CR numbers, dates, and charge numbers before returning JSON.",
    "For Timeslot dates, preserve the visible month/day/year exactly before normalizing.",
    "Treat Collins CR # / PW REA # as crNumber.",
    "Recognize screenshots or pasted notes with labels like Presenter, Timestamp, Timeslot, Provide Collins CR, CR Title/Description, Engine Programs affected, CR Classification, Review being requested, Component Model name, and Open Charge Number.",
    "Map Presenter to eccCoordinator.",
    "Map Timestamp or Timeslot date to meetingDate and the adjacent time to meetingTimeEst.",
    "Map Provide Collins CR to crNumber.",
    "Map CR Title/Description to description.",
    "Map Engine Programs affected to enginePrograms.",
    "Map Review being requested and CR Classification to classGateMilitarySupplierEc.",
    "Map Component Model name to componentModels.",
    "Map Open Charge Number to wbsChargeNumber.",
    "Use this exact JSON shape:",
    JSON.stringify({
      crNumber: "",
      ncdocNumber: "",
      meetingDate: "",
      meetingTimeEst: "",
      classGateMilitarySupplierEc: "",
      disposition: "",
      responsibleIpts: [],
      enginePrograms: [],
      componentModels: [],
      supplier: "",
      description: "",
      wbsChargeNumber: "",
      far15: null,
      documentationDeadline: "",
      targetDate: "",
      designAuthority: "",
      eccCoordinator: "",
    }),
  ].join("\n");
}

function buildUserPrompt(prompt: string, hasImage: boolean, ocrText: string) {
  return [
    hasImage
      ? "Read the attached screenshot and extract the CR intake fields."
      : "Extract the CR intake fields from this text.",
    prompt ? `User notes:\n${prompt.slice(0, 6000)}` : "",
    ocrText ? `OCR text from the image:\n${ocrText.slice(0, 6000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function extractTextFromImage(imageBase64: string, mimeType: string) {
  const extension = mimeType.toLowerCase().includes("jpeg") ? "jpg" : "png";
  const imagePath = path.join(tmpdir(), `ecc-intake-${randomUUID()}.${extension}`);
  const scriptPath = path.join(process.cwd(), "scripts", "windows-ocr.ps1");

  try {
    await writeFile(imagePath, Buffer.from(imageBase64, "base64"));
    const { stdout } = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        "-Path",
        imagePath,
      ],
      {
        timeout: 15000,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      },
    );
    return stdout.trim();
  } catch (error) {
    console.warn("Windows OCR failed", error);
    return "";
  } finally {
    await unlink(imagePath).catch(() => {});
  }
}

function parseJsonObject(content: string) {
  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!objectMatch) {
    return {};
  }

  try {
    return JSON.parse(objectMatch[0]) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizeFields(raw: Record<string, unknown>): IntakeFields {
  const fields = asRecord(raw.fields) ?? raw;

  return {
    crNumber: normalizeCrNumber(
      cleanString(
        firstValue(fields, "crNumber", "collinsCrNumber", "pwReaNumber"),
      ),
    ),
    ncdocNumber: cleanString(firstValue(fields, "ncdocNumber", "ncdoc")),
    meetingDate: normalizeDate(cleanString(firstValue(fields, "meetingDate"))),
    meetingTimeEst: normalizeTime(
      cleanString(firstValue(fields, "meetingTimeEst", "meetingTime", "timeEst")),
    ),
    classGateMilitarySupplierEc: cleanString(
      firstValue(
        fields,
        "classGateMilitarySupplierEc",
        "classGate",
        "militarySupplierEc",
      ),
    ),
    disposition: cleanString(firstValue(fields, "disposition")),
    responsibleIpts: cleanStringArray(
      firstValue(fields, "responsibleIpts", "responsibleIPTs"),
    ),
    enginePrograms: cleanStringArray(firstValue(fields, "enginePrograms")),
    componentModels: cleanStringArray(
      firstValue(fields, "componentModels", "componentModel"),
    ),
    supplier: cleanString(firstValue(fields, "supplier")),
    description: cleanString(firstValue(fields, "description")),
    wbsChargeNumber: cleanString(
      firstValue(fields, "wbsChargeNumber", "chargeNumber"),
    ),
    far15: cleanBoolean(firstValue(fields, "far15", "far15Required")),
    documentationDeadline: normalizeDate(
      cleanString(firstValue(fields, "documentationDeadline", "documentationDue")),
    ),
    targetDate: normalizeDate(
      cleanString(
        firstValue(
          fields,
          "targetDate",
          "coNeedByCompletionDate",
          "coNeedBy",
          "completionDate",
        ),
      ),
    ),
    designAuthority: cleanString(
      firstValue(fields, "designAuthority", "designAuthorityGroup"),
    ),
    eccCoordinator: cleanString(firstValue(fields, "eccCoordinator")),
  };
}

function mergeFields(...sources: IntakeFields[]): IntakeFields {
  const empty = emptyFields();

  for (const source of sources) {
    for (const key of Object.keys(empty) as Array<keyof IntakeFields>) {
      const value = source[key];
      if (Array.isArray(value)) {
        if (value.length > 0 && (empty[key] as string[]).length === 0) {
          empty[key] = value as never;
        }
        continue;
      }

      if (key === "far15") {
        if (typeof value === "boolean" && empty.far15 === null) {
          empty.far15 = value;
        }
        continue;
      }

      if (typeof value === "string" && value.trim() && !empty[key]) {
        empty[key] = value.trim() as never;
      }
    }
  }

  return empty;
}

function emptyFields(): IntakeFields {
  return {
    crNumber: "",
    ncdocNumber: "",
    meetingDate: "",
    meetingTimeEst: "",
    classGateMilitarySupplierEc: "",
    disposition: "",
    responsibleIpts: [],
    enginePrograms: [],
    componentModels: [],
    supplier: "",
    description: "",
    wbsChargeNumber: "",
    far15: null,
    documentationDeadline: "",
    targetDate: "",
    designAuthority: "",
    eccCoordinator: "",
  };
}

function hasUsableFields(fields: IntakeFields) {
  return Boolean(
    fields.crNumber ||
      fields.description ||
      fields.eccCoordinator ||
      fields.wbsChargeNumber ||
      fields.enginePrograms.length > 0 ||
      fields.componentModels.length > 0,
  );
}

function parseIntakeText(text: string): IntakeFields {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const fields = emptyFields();

  if (lines.length === 0) {
    return fields;
  }

  fields.eccCoordinator = getBlockValue(lines, /^presenter\b/i);
  fields.crNumber = normalizeCrNumber(
    getBlockValue(lines, /^(?:provide\s+)?collins\s+cr\b/i),
  );
  fields.ncdocNumber = getBlockValue(lines, /^ncdoc(?:\s+number)?\b/i);
  fields.description = getBlockValue(
    lines,
    /^cr\s+(?:title\/description|title|description)\b/i,
    true,
  );
  fields.disposition = getBlockValue(lines, /^disposition\b/i);
  fields.wbsChargeNumber = getBlockValue(
    lines,
    /^(?:open\s+)?(?:charge|wbs\s+charge)(?:\s+number)?\b/i,
  );
  fields.documentationDeadline = normalizeDate(
    getBlockValue(lines, /^documentation\s+(?:due|deadline)\b/i),
  );
  fields.targetDate = normalizeDate(
    getBlockValue(lines, /^co\s+need[-\s]?by|^completion\s*date\b/i),
  );
  fields.designAuthority = getBlockValue(
    lines,
    /^design\s+auth(?:ority)?(?:\s+group)?\b/i,
  );

  const meetingDate = getBlockValue(lines, /^meeting\s+date\b/i);
  const meetingTime = getBlockValue(lines, /^time\s*(?:\(est\))?\b/i);
  const timestamp = getTimestamp(lines);
  fields.meetingDate = normalizeDate(meetingDate || timestamp.date);
  fields.meetingTimeEst = normalizeTime(meetingTime || timestamp.time);

  const reviewRequested = getBlockValue(lines, /^review\s+being\s+requested\b/i);
  const crClassification = getBlockValue(lines, /^cr\s+classification\b/i);
  fields.classGateMilitarySupplierEc = normalizeClassGate(
    reviewRequested,
    crClassification,
  );

  fields.responsibleIpts = splitList(
    getBlockValue(lines, /^responsible\s+ipt(?:\(s\))?\b/i),
  );
  fields.enginePrograms = splitList(
    getBlockValue(lines, /^engine\s+programs?\s+(?:affected)?\b/i),
  );
  fields.componentModels = splitList(
    getBlockValue(lines, /^component\s+models?\s+(?:name)?\b/i),
  );
  fields.supplier = getBlockValue(lines, /^supplier\b/i);
  fields.far15 = cleanBoolean(getBlockValue(lines, /^far\s*15\??\b/i));

  return fields;
}

function getBlockValue(lines: string[], label: RegExp, allowContinuation = false) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(label);
    if (!match || match.index !== 0) {
      continue;
    }

    const value = line
      .slice(match[0].length)
      .replace(/^[:\s-]+/, "")
      .trim();
    const block = [value];

    if (allowContinuation) {
      for (let next = index + 1; next < lines.length; next += 1) {
        if (isKnownLabel(lines[next])) {
          break;
        }
        block.push(lines[next]);
      }
    }

    return block.filter(Boolean).join(" ").trim();
  }

  return "";
}

function isKnownLabel(line: string) {
  return [
    /^presenter\b/i,
    /^(?:timestamp|timeslot)\b/i,
    /^which\s+platform\b/i,
    /^(?:provide\s+)?collins\s+cr\b/i,
    /^cr\s+(?:title\/description|title|description|classification)\b/i,
    /^review\s+being\s+requested\b/i,
    /^engine\s+programs?\b/i,
    /^component\s+models?\b/i,
    /^(?:open\s+)?(?:charge|wbs\s+charge)(?:\s+number)?\b/i,
    /^ncdoc\b/i,
    /^meeting\s+date\b/i,
    /^time\s*(?:\(est\))?\b/i,
    /^disposition\b/i,
    /^responsible\s+ipt/i,
    /^supplier\b/i,
    /^far\s*15/i,
    /^documentation\s+(?:due|deadline)\b/i,
    /^co\s+need[-\s]?by/i,
    /^completion\s*date\b/i,
    /^design\s+auth/i,
    /^ecc\s+coordinator\b/i,
  ].some((pattern) => pattern.test(line));
}

function getTimestamp(lines: string[]) {
  const timestampIndex = lines.findIndex((line) =>
    /^(?:timestamp|timeslot)\b/i.test(line),
  );
  if (timestampIndex === -1) {
    return { date: "", time: "" };
  }

  const inlineValue = lines[timestampIndex]
    .replace(/^(?:timestamp|timeslot)\s*:?\s*/i, "")
    .trim();
  const nextValue = lines[timestampIndex + 1] ?? "";
  const combined = [inlineValue, nextValue].join(" ");

  return {
    date: combined.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/)?.[0] ?? "",
    time:
      combined.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)?\b/i)?.[0] ??
      combined.match(/\b\d{1,2}\s*(?:AM|PM)\b/i)?.[0] ??
      "",
  };
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  const slashDate = trimmed.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (slashDate) {
    const year =
      slashDate[3].length === 2 ? `20${slashDate[3]}` : slashDate[3];
    return [
      year,
      slashDate[1].padStart(2, "0"),
      slashDate[2].padStart(2, "0"),
    ].join("-");
  }

  const isoDate = trimmed.match(/\b\d{4}-\d{2}-\d{2}\b/);
  return isoDate?.[0] ?? "";
}

function normalizeTime(value: string) {
  const match = value.trim().match(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\b/i);
  if (!match) {
    return "";
  }

  let hour = Number(match[1]);
  const minute = match[2] ?? "00";
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hour < 12) {
    hour += 12;
  }
  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function normalizeClassGate(reviewRequested: string, crClassification: string) {
  const normalizedClassification = crClassification
    .replace(/\bclass\s*1\b/i, "Class I")
    .replace(/\bclass\s*2\b/i, "Class II")
    .trim();

  if (reviewRequested && normalizedClassification) {
    return reviewRequested
      .toLowerCase()
      .includes(normalizedClassification.toLowerCase())
      ? reviewRequested
      : `${normalizedClassification}; ${reviewRequested}`;
  }

  return reviewRequested || normalizedClassification;
}

function normalizeCrNumber(value: string) {
  const match = value.trim().match(/\bCR[-\s_]*(\d{1,7})\b/i);
  if (!match) {
    return value.trim();
  }
  return `CR-${match[1].padStart(7, "0")}`;
}

function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstValue(fields: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (fields[key] !== undefined) {
      return fields[key];
    }
  }
  return "";
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanImageBase64(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, "").trim();
}

function cleanStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanString(item))
      .filter(Boolean)
      .slice(0, 20);
  }

  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }

  return [];
}

function cleanBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["yes", "true", "y", "required"].includes(normalized)) {
      return true;
    }
    if (["no", "false", "n", "not required"].includes(normalized)) {
      return false;
    }
  }

  return null;
}
