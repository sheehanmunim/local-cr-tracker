import { NextResponse } from "next/server";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SttRequest = {
  audioPcm16Base64?: string;
  sampleRate?: number;
};

type AsrResult = {
  text?: string;
};

type AsrPipeline = (
  audio: Float32Array,
  options?: Record<string, unknown>,
) => Promise<AsrResult>;

const DEFAULT_STT_MODEL = "onnx-community/moonshine-tiny-ONNX";
const DEFAULT_STT_DTYPE = "q8";
const DEFAULT_STT_DEVICE = "cpu";
const TARGET_SAMPLE_RATE = 16_000;
const MAX_AUDIO_SECONDS = 24;

const globalForStt = globalThis as typeof globalThis & {
  __collinsSttPromise?: Promise<AsrPipeline>;
};

export async function GET() {
  try {
    await getLocalStt();
    return NextResponse.json({
      ok: true,
      engine: "transformers.js",
      model: process.env.LOCAL_STT_MODEL ?? DEFAULT_STT_MODEL,
      sampleRate: TARGET_SAMPLE_RATE,
    });
  } catch (error) {
    console.error("Local STT warmup failed", error);
    return NextResponse.json(
      { error: "Local speech recognition warmup failed." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as SttRequest | null;
  const sampleRate = sanitizeSampleRate(body?.sampleRate);
  const audio = decodePcm16Audio(body?.audioPcm16Base64 ?? "", sampleRate);

  if (!audio) {
    return NextResponse.json(
      { error: "Audio is required for local transcription." },
      { status: 400 },
    );
  }

  try {
    const transcriber = await getLocalStt();
    const result = await transcriber(audio, getTranscriptionOptions());
    const text = cleanTranscript(result.text ?? "");

    return NextResponse.json(
      { text },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-STT-Engine": "transformers.js",
          "X-STT-Model": process.env.LOCAL_STT_MODEL ?? DEFAULT_STT_MODEL,
        },
      },
    );
  } catch (error) {
    console.error("Local STT failed", error);
    return NextResponse.json(
      {
        error: "Local speech recognition is unavailable.",
        ...(process.env.NODE_ENV === "development" && error instanceof Error
          ? { detail: error.message }
          : {}),
      },
      { status: 502 },
    );
  }
}

async function getLocalStt() {
  globalForStt.__collinsSttPromise ??= loadLocalStt();
  return globalForStt.__collinsSttPromise;
}

async function loadLocalStt() {
  const { env, pipeline } = await import("@huggingface/transformers");
  const transformersEnv = env as typeof env & {
    allowLocalModels?: boolean;
    allowRemoteModels?: boolean;
    cacheDir?: string;
  };

  transformersEnv.allowLocalModels = true;
  transformersEnv.allowRemoteModels = process.env.LOCAL_STT_OFFLINE !== "1";
  transformersEnv.cacheDir =
    process.env.LOCAL_STT_CACHE_DIR ??
    path.join(process.cwd(), ".cache", "transformers");

  const transcriber = await pipeline(
    "automatic-speech-recognition",
    process.env.LOCAL_STT_MODEL ?? DEFAULT_STT_MODEL,
    {
      dtype: sanitizeDtype(process.env.LOCAL_STT_DTYPE),
      device: sanitizeDevice(process.env.LOCAL_STT_DEVICE),
    },
  );

  return transcriber as unknown as AsrPipeline;
}

function decodePcm16Audio(value: string, sampleRate: number) {
  if (!value.trim()) {
    return null;
  }

  const buffer = Buffer.from(value, "base64");
  if (buffer.length < 2 || buffer.length % 2 !== 0) {
    return null;
  }

  const maxBytes = MAX_AUDIO_SECONDS * sampleRate * 2;
  const boundedBuffer = buffer.subarray(0, maxBytes);
  const sampleCount = Math.floor(boundedBuffer.length / 2);
  const audio = new Float32Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    audio[index] = boundedBuffer.readInt16LE(index * 2) / 32768;
  }

  return sampleRate === TARGET_SAMPLE_RATE
    ? audio
    : resampleLinear(audio, sampleRate, TARGET_SAMPLE_RATE);
}

function resampleLinear(
  input: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number,
) {
  if (sourceSampleRate === targetSampleRate || input.length === 0) {
    return input;
  }

  const ratio = sourceSampleRate / targetSampleRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const leftIndex = Math.floor(sourceIndex);
    const rightIndex = Math.min(leftIndex + 1, input.length - 1);
    const fraction = sourceIndex - leftIndex;
    output[index] =
      input[leftIndex] * (1 - fraction) + input[rightIndex] * fraction;
  }

  return output;
}

function getTranscriptionOptions() {
  const model = (process.env.LOCAL_STT_MODEL ?? DEFAULT_STT_MODEL).toLowerCase();
  if (!model.includes("whisper")) {
    return {};
  }

  return {
    language: "english",
    task: "transcribe",
  };
}

function cleanTranscript(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^\s*[.,!?;:-]+\s*/, "")
    .trim();
}

function sanitizeSampleRate(value: number | undefined) {
  if (!value || !Number.isFinite(value)) {
    return TARGET_SAMPLE_RATE;
  }

  return Math.min(48_000, Math.max(8_000, Math.round(value)));
}

function sanitizeDtype(value: string | undefined) {
  if (["fp32", "fp16", "q8", "q4", "q4f16"].includes(value ?? "")) {
    return value as "fp32" | "fp16" | "q8" | "q4" | "q4f16";
  }
  return DEFAULT_STT_DTYPE;
}

function sanitizeDevice(value: string | undefined) {
  if (["wasm", "webgpu", "cpu"].includes(value ?? "")) {
    return value as "wasm" | "webgpu" | "cpu";
  }
  return DEFAULT_STT_DEVICE;
}
