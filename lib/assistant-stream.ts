type OllamaStreamingChunk = {
  message?: { content?: string };
  error?: string;
};

type AssistantStreamEvent =
  | { type: "delta"; content: string }
  | { type: "replace"; content: string }
  | { type: "error"; error: string }
  | { type: "done" };

export function createAssistantStreamingResponse({
  response,
  onComplete,
}: {
  response: Response;
  onComplete: (answer: string) => Promise<string | null>;
}) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        enqueueAssistantStreamEvent(controller, encoder, {
          type: "error",
          error: "The local AI response stream was unavailable.",
        });
        controller.close();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";

      const processLine = (line: string) => {
        if (!line.trim()) return;
        const chunk = JSON.parse(line) as OllamaStreamingChunk;
        if (chunk.error) throw new Error(chunk.error);
        const content = chunk.message?.content ?? "";
        if (!content) return;
        answer += content;
        enqueueAssistantStreamEvent(controller, encoder, {
          type: "delta",
          content,
        });
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          for (const line of lines) processLine(line);
          if (done) break;
        }
        if (buffer.trim()) processLine(buffer);

        const replacement = await onComplete(answer.trim());
        if (replacement && replacement !== answer.trim()) {
          answer = replacement;
          enqueueAssistantStreamEvent(controller, encoder, {
            type: "replace",
            content: replacement,
          });
        }
        if (!answer.trim()) {
          enqueueAssistantStreamEvent(controller, encoder, {
            type: "replace",
            content:
              "The ECC assistant did not return a response. Please try again.",
          });
        }
        enqueueAssistantStreamEvent(controller, encoder, { type: "done" });
      } catch (error) {
        enqueueAssistantStreamEvent(controller, encoder, {
          type: "error",
          error:
            error instanceof Error
              ? error.message
              : "The local AI response stream stopped unexpectedly.",
        });
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function readAssistantResponseStream(
  response: Response,
  onUpdate: (answer: string) => void,
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The local AI response stream was unavailable.");

  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";

  const processLine = (line: string) => {
    if (!line.trim()) return;
    const event = JSON.parse(line) as AssistantStreamEvent;
    if (event.type === "error") throw new Error(event.error);
    if (event.type === "delta") answer += event.content;
    if (event.type === "replace") answer = event.content;
    if (event.type === "delta" || event.type === "replace") onUpdate(answer);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) processLine(line);
      if (done) break;
    }
    if (buffer.trim()) processLine(buffer);
  } finally {
    reader.releaseLock();
  }

  return (
    answer.trim() ||
    "The ECC assistant did not return a response. Please try again."
  );
}

function enqueueAssistantStreamEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: AssistantStreamEvent,
) {
  controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
}
