import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

type IncomingMessage = {
  role: "assistant" | "user";
  content: string;
};

type AssistantRequest = {
  messages?: IncomingMessage[];
  selectedCrNumber?: string | null;
};

type OllamaResponse = {
  message?: {
    content?: string;
  };
};

const DEFAULT_MODEL = "qwen3:latest";
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

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_CONVEX_URL is missing. Start the app with npm run dev:local." },
      { status: 503 },
    );
  }

  const model = process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_URL;
  const convex = new ConvexHttpClient(convexUrl);
  const context = await convex.query(api.crs.assistantContext, { limit: 100 });
  const selectedCrNumber = body?.selectedCrNumber ?? null;

  const systemPrompt = [
    "You are a local CR tracker assistant for engineering change requests.",
    "Use only the CR data provided in the JSON context. If the data does not answer the question, say what is missing.",
    "Be concise, practical, and specific. Mention CR numbers when making claims.",
    "Do not reveal chain-of-thought or use think tags.",
    selectedCrNumber
      ? `The user currently has ${selectedCrNumber} selected in the UI.`
      : "No CR is currently selected in the UI.",
    `Current timestamp: ${new Date().toISOString()}.`,
    `CR JSON context:\n${JSON.stringify(context, null, 2).slice(0, 30000)}`,
  ].join("\n\n");

  try {
    const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
        options: {
          temperature: 0.2,
        },
      }),
    });

    if (!ollamaResponse.ok) {
      const detail = await ollamaResponse.text();
      return NextResponse.json(
        {
          error: `Ollama returned ${ollamaResponse.status}. Check that Ollama is running and that ${model} is pulled. ${detail}`,
          model,
        },
        { status: 502 },
      );
    }

    const data = (await ollamaResponse.json()) as OllamaResponse;
    const answer = data.message?.content?.trim();

    return NextResponse.json({
      answer: answer || "Ollama returned an empty response.",
      model,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to reach the local Ollama server.";
    return NextResponse.json(
      {
        error: `Unable to reach Ollama at ${ollamaBaseUrl}. Run ollama serve and ollama pull ${model}. ${message}`,
        model,
      },
      { status: 502 },
    );
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
