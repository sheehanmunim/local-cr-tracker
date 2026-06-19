import { NextResponse } from "next/server";
import type { GenerateOptions } from "kokoro-js";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TtsRequest = {
  text?: string;
  voice?: string;
  speed?: number;
};

type KokoroModule = typeof import("kokoro-js");
type KokoroInstance = Awaited<
  ReturnType<KokoroModule["KokoroTTS"]["from_pretrained"]>
>;
type KokoroVoice = NonNullable<GenerateOptions["voice"]>;

const DEFAULT_MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const DEFAULT_VOICE = "af_heart";
const DEFAULT_DTYPE = "q8";
const DEFAULT_DEVICE = "cpu";
const DEFAULT_SPEED = 0.97;
const MAX_TEXT_CHARS = 4_000;
const MAX_CHUNK_CHARS = 420;

const globalForKokoro = globalThis as typeof globalThis & {
  __collinsKokoroTtsPromise?: Promise<KokoroInstance>;
};

export async function GET() {
  try {
    await getKokoroTts();
    return NextResponse.json({
      ok: true,
      engine: "kokoro-js",
      voice: process.env.KOKORO_VOICE ?? DEFAULT_VOICE,
    });
  } catch (error) {
    console.error("Local Kokoro TTS warmup failed", error);
    return NextResponse.json(
      { error: "Local TTS warmup failed." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as TtsRequest | null;
  const text = cleanTtsText(body?.text ?? "");

  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  try {
    const tts = await getKokoroTts();
    const voice = sanitizeVoice(body?.voice ?? process.env.KOKORO_VOICE);
    const speed = sanitizeSpeed(body?.speed);
    const chunks = splitTtsText(text);
    const wav = await synthesizeWav(tts, chunks, voice, speed);

    return new NextResponse(wav, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "audio/wav",
        "X-TTS-Engine": "kokoro-js",
        "X-TTS-Voice": voice,
      },
    });
  } catch (error) {
    console.error("Local Kokoro TTS failed", error);
    return NextResponse.json(
      {
        error: "Local TTS is unavailable.",
        ...(process.env.NODE_ENV === "development" && error instanceof Error
          ? { detail: error.message }
          : {}),
      },
      { status: 502 },
    );
  }
}

async function getKokoroTts() {
  globalForKokoro.__collinsKokoroTtsPromise ??= loadKokoroTts();
  return globalForKokoro.__collinsKokoroTtsPromise;
}

async function loadKokoroTts() {
  const { KokoroTTS, env } = await import("kokoro-js");
  const transformersEnv = env as typeof env & {
    allowLocalModels?: boolean;
    allowRemoteModels?: boolean;
    cacheDir?: string;
  };

  transformersEnv.allowLocalModels = true;
  transformersEnv.allowRemoteModels = process.env.KOKORO_OFFLINE !== "1";
  transformersEnv.cacheDir =
    process.env.KOKORO_CACHE_DIR ??
    path.join(process.cwd(), ".cache", "kokoro");

  return KokoroTTS.from_pretrained(
    process.env.KOKORO_MODEL ?? DEFAULT_MODEL_ID,
    {
      dtype: sanitizeDtype(process.env.KOKORO_DTYPE),
      device: sanitizeDevice(process.env.KOKORO_DEVICE),
    },
  );
}

async function synthesizeWav(
  tts: KokoroInstance,
  chunks: string[],
  voice: KokoroVoice,
  speed: number,
) {
  const audioChunks: Float32Array[] = [];
  let sampleRate = 24_000;

  for (const chunk of chunks) {
    const audio = await tts.generate(chunk, { voice, speed });
    sampleRate = audio.sampling_rate;
    audioChunks.push(audio.audio);
  }

  return float32ToWav(concatenateAudio(audioChunks), sampleRate);
}

function cleanTtsText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_CHARS);
}

function splitTtsText(text: string) {
  const sentences =
    text.match(/[^.!?;:]+[.!?;:]?|\S+/g)?.map((part) => part.trim()) ?? [];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (!sentence) {
      continue;
    }

    if (
      current &&
      current.length + sentence.length + 1 > MAX_CHUNK_CHARS
    ) {
      chunks.push(current);
      current = sentence;
      continue;
    }

    current = current ? `${current} ${sentence}` : sentence;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [text];
}

function concatenateAudio(chunks: Float32Array[]) {
  const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const output = new Float32Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}

function float32ToWav(audio: Float32Array, sampleRate: number) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = new ArrayBuffer(44 + audio.length * bytesPerSample);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + audio.length * bytesPerSample, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, audio.length * bytesPerSample, true);

  let offset = 44;
  for (const sample of audio) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(
      offset,
      clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
      true,
    );
    offset += bytesPerSample;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function sanitizeVoice(value: string | undefined) {
  return ((value?.trim() || DEFAULT_VOICE) as KokoroVoice);
}

function sanitizeSpeed(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    const envSpeed = Number(process.env.KOKORO_SPEED ?? DEFAULT_SPEED);
    return Number.isFinite(envSpeed)
      ? Math.min(1.25, Math.max(0.75, envSpeed))
      : DEFAULT_SPEED;
  }

  return Math.min(1.25, Math.max(0.75, value));
}

function sanitizeDtype(value: string | undefined) {
  if (["fp32", "fp16", "q8", "q4", "q4f16"].includes(value ?? "")) {
    return value as "fp32" | "fp16" | "q8" | "q4" | "q4f16";
  }
  return DEFAULT_DTYPE;
}

function sanitizeDevice(value: string | undefined) {
  if (["wasm", "webgpu", "cpu"].includes(value ?? "")) {
    return value as "wasm" | "webgpu" | "cpu";
  }
  return DEFAULT_DEVICE;
}
