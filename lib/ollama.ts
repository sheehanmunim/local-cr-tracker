import localModelsConfig from "@/config/local-models.json";

type OllamaMessage = {
  role: string;
  content: string;
  images?: string[];
};

type OllamaChatPayload = {
  model: string;
  stream: boolean;
  think?: false;
  messages: OllamaMessage[];
  options?: Record<string, unknown>;
  keep_alive?: string | number;
};

type OllamaChatRequest = OllamaChatPayload & {
  ollamaBaseUrl: string;
};

const chatModelFallbacks = localModelsConfig.fallbacks.chat;
const visionModelFallbacks = localModelsConfig.fallbacks.vision;

export async function requestOllamaChat({
  ollamaBaseUrl,
  model,
  ...payload
}: OllamaChatRequest) {
  const models = hasImagePayload(payload.messages)
    ? Array.from(new Set([model, ...visionModelFallbacks]))
    : Array.from(new Set([model, ...chatModelFallbacks]));

  let lastResponse: Response | null = null;
  for (const candidate of models) {
    const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        model: candidate,
      }),
    });

    if (response.ok) {
      return response;
    }

    if (lastResponse) {
      await lastResponse.text().catch(() => "");
    }
    lastResponse = response;
  }

  return (
    lastResponse ??
    fetch(`${ollamaBaseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        model,
      }),
    })
  );
}

function hasImagePayload(messages: OllamaMessage[]) {
  return messages.some(
    (message) => message.images && message.images.length > 0,
  );
}
