import assert from "node:assert/strict";
import test from "node:test";
import {
  createAssistantStreamingResponse,
  readAssistantResponseStream,
} from "../lib/assistant-stream.ts";

test("forwards split Ollama chunks to the browser incrementally", async () => {
  const encoder = new TextEncoder();
  const ollamaBody = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode('{"message":{"content":"Hello"}}\n{"mess'),
      );
      controller.enqueue(
        encoder.encode('age":{"content":" world"}}\n{"done":true}\n'),
      );
      controller.close();
    },
  });
  const response = createAssistantStreamingResponse({
    response: new Response(ollamaBody),
    onComplete: async () => null,
  });
  const updates = [];
  const answer = await readAssistantResponseStream(response, (value) =>
    updates.push(value),
  );

  assert.match(
    response.headers.get("content-type") ?? "",
    /application\/x-ndjson/,
  );
  assert.deepEqual(updates, ["Hello", "Hello world"]);
  assert.equal(answer, "Hello world");
});

test("can replace an invalid completed answer", async () => {
  const encoder = new TextEncoder();
  const ollamaBody = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('{"message":{"content":"I"}}\n'));
      controller.close();
    },
  });
  const response = createAssistantStreamingResponse({
    response: new Response(ollamaBody),
    onComplete: async () => "A useful replacement",
  });
  const updates = [];
  const answer = await readAssistantResponseStream(response, (value) =>
    updates.push(value),
  );

  assert.deepEqual(updates, ["I", "A useful replacement"]);
  assert.equal(answer, "A useful replacement");
});
