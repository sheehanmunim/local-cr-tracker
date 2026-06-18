type OllamaMessage = {
  role: string;
  content: string;
  images?: string[];
};

type OllamaChatPayload = {
  model: string;
  stream: false;
  messages: OllamaMessage[];
  options?: Record<string, unknown>;
};

type OllamaChatRequest = OllamaChatPayload & {
  ollamaBaseUrl: string;
};

const visionModelFallbacks = [
  "qwen2.5vl:3b",
  "granite3.2-vision:2b",
  "llava-phi3:3.8b",
  "hf.co/remyxai/SpaceQwen2.5-VL-3B-Instruct:latest",
  "gemma3:4b",
];

export async function requestOllamaChat({
  ollamaBaseUrl,
  model,
  ...payload
}: OllamaChatRequest) {
  const models = hasImagePayload(payload.messages)
    ? Array.from(new Set([model, ...visionModelFallbacks]))
    : [model];

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

  return lastResponse ?? fetch(`${ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      model,
    }),
  });
}

function hasImagePayload(messages: OllamaMessage[]) {
  return messages.some((message) => message.images && message.images.length > 0);
}
