#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const setupOnly = process.argv.includes("--setup-only");
const modelsOnly = process.argv.includes("--models-only");
const modelConfig = readModelConfig();
const systemMemoryGb = os.totalmem() / 1024 ** 3;
const modelProfileName = selectModelProfileName();
const modelProfile = modelConfig.profiles[modelProfileName];
let model = process.env.OLLAMA_MODEL || modelProfile.chat;
let voiceModel = process.env.OLLAMA_VOICE_MODEL || modelProfile.voice;
let visionModel = process.env.OLLAMA_VISION_MODEL || modelProfile.vision;
const explicitModel = Boolean(
  process.env.OLLAMA_MODEL && process.env.OLLAMA_MODEL !== modelProfile.chat,
);
const explicitVoiceModel = Boolean(
  process.env.OLLAMA_VOICE_MODEL &&
    process.env.OLLAMA_VOICE_MODEL !== modelProfile.voice,
);
const explicitVisionModel = Boolean(
  process.env.OLLAMA_VISION_MODEL &&
    process.env.OLLAMA_VISION_MODEL !== modelProfile.vision,
);
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const npmCommand = process.env.npm_execpath
  ? process.execPath
  : process.platform === "win32"
    ? "npm.cmd"
    : "npm";
const npmArgsPrefix = process.env.npm_execpath ? [process.env.npm_execpath] : [];

main().catch((error) => {
  console.error(`\nLocal startup failed: ${error.message}`);
  process.exit(1);
});

async function main() {
  printHeader();
  requireSupportedNode();
  requireCommand(npmCommand, [...npmArgsPrefix, "--version"], "npm");
  requireCommand(
    "ollama",
    ["--version"],
    "Ollama. Install it from https://ollama.com/download, then rerun this command.",
  );

  if (!modelsOnly) {
    run("Installing project dependencies", npmCommand, [...npmArgsPrefix, "install"]);
  }

  await ensureOllamaServer();
  model = await resolveAdaptiveOllamaModel({
    role: "chat",
    label: "text chat",
    requestedName: model,
    fallbackNames: modelConfig.fallbacks.chat,
    explicit: explicitModel,
  });
  voiceModel = await resolveAdaptiveOllamaModel({
    role: "voice",
    label: "voice chat",
    requestedName: voiceModel,
    fallbackNames: modelConfig.fallbacks.voice,
    explicit: explicitVoiceModel,
  });
  visionModel = await resolveAdaptiveOllamaModel({
    role: "vision",
    label: "screenshots",
    requestedName: visionModel,
    fallbackNames: modelConfig.fallbacks.vision,
    explicit: explicitVisionModel,
  });
  persistResolvedModelEnv();
  printResolvedModels();

  if (modelsOnly) {
    console.log("\nLocal models are ready.");
    return;
  }

  if (setupOnly) {
    console.log("\nSetup complete. Run `npm run local` to start the tracker.");
    return;
  }

  console.log("\nStarting local Convex and Next.js...");
  console.log("Open http://localhost:3000 when the server is ready.\n");

  const child = spawn(npmCommand, [...npmArgsPrefix, "run", "dev:local"], {
    cwd: root,
    env: {
      ...process.env,
      OLLAMA_MODEL: model,
      OLLAMA_VOICE_MODEL: voiceModel,
      OLLAMA_VISION_MODEL: visionModel,
      OLLAMA_BASE_URL: ollamaBaseUrl,
      LOCAL_MODEL_PROFILE: modelProfileName,
    },
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

function requireSupportedNode() {
  const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  if (major < 20) {
    throw new Error(
      `Node.js 20 or newer is required. Current version is ${process.versions.node}. Run scripts/start-local for automatic prerequisite installation.`,
    );
  }
}

function printHeader() {
  console.log("Local CR Tracker");
  console.log("================");
  console.log(`Workspace: ${root}`);
  console.log(`Ollama: ${ollamaBaseUrl}`);
  console.log(`System memory: ${systemMemoryGb.toFixed(1)} GB`);
  console.log(
    `Model profile: ${modelProfileName}${process.env.LOCAL_MODEL_PROFILE ? " (configured)" : " (auto)"}`,
  );
  console.log(`Seed text model: ${model}`);
  console.log(`Seed voice model: ${voiceModel}`);
  console.log(`Seed vision model: ${visionModel}\n`);
}

function printResolvedModels() {
  console.log("\nResolved local models:");
  console.log(`- Text: ${model}`);
  console.log(`- Voice: ${voiceModel}`);
  console.log(`- Screenshots: ${visionModel}`);
  console.log("- Saved model choices to .env.local");
}

function requireCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });

  if (result.error) {
    throw new Error(`Missing ${label}`);
  }
}

function run(label, command, args) {
  console.log(`${label}...`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed.`);
  }
}

async function ensureOllamaServer() {
  if (await canReachOllama()) {
    console.log("Ollama server is running.");
    return;
  }

  console.log("Starting Ollama server...");
  const server = spawn("ollama", ["serve"], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  server.unref();

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await canReachOllama()) {
      console.log("Ollama server is ready.");
      return;
    }
    await sleep(750);
  }

  throw new Error(
    `Ollama did not become reachable at ${ollamaBaseUrl}. Start it manually with \`ollama serve\` and rerun this command.`,
  );
}

async function resolveAdaptiveOllamaModel({
  role,
  label,
  requestedName,
  fallbackNames,
  explicit,
}) {
  if (explicit) {
    if (await ensureOllamaModel(requestedName)) {
      return requestedName;
    }

    throw new Error(
      `Could not install explicitly configured ${label} model ${requestedName}.`,
    );
  }

  const installedModels = await getOllamaModels();
  const rankedCandidates = rankModelCandidates(role, installedModels);
  const candidates = unique([...rankedCandidates, requestedName, ...fallbackNames]);
  console.log(
    `Adaptive ${label} candidates: ${previewCandidateList(candidates)}.`,
  );

  const firstCandidate = candidates[0] ?? requestedName;
  for (const candidate of candidates) {
    if (candidate !== firstCandidate) {
      console.warn(
        `Trying ${candidate} for ${label} because ${firstCandidate} was not available.`,
      );
    }
    if (await ensureOllamaModel(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Could not install any local ${label} model.`);
}

function rankModelCandidates(role, installedModels) {
  const candidates = Array.isArray(modelConfig.candidates?.[role])
    ? modelConfig.candidates[role]
    : [];
  if (candidates.length === 0) {
    return [];
  }

  const compatibleCandidates = candidates.filter((candidate) =>
    isCandidateCompatible(candidate),
  );
  const pool = compatibleCandidates.length > 0 ? compatibleCandidates : candidates;
  const weights = normalizeWeights(modelConfig.weights?.[modelProfileName]?.[role]);
  const installedSet = new Set(installedModels);
  const installedBonus = Number(modelConfig.installedBonus?.[modelProfileName] ?? 0);

  return pool
    .map((candidate) => ({
      name: candidate.name,
      score: scoreModelCandidate(candidate, weights, installedSet, installedBonus),
    }))
    .filter((candidate) => typeof candidate.name === "string" && candidate.name)
    .sort((left, right) => right.score - left.score)
    .map((candidate) => candidate.name);
}

function scoreModelCandidate(candidate, weights, installedSet, installedBonus) {
  const quality = Number(candidate.quality ?? 0);
  const speed = Number(candidate.speed ?? 0);
  const memoryPenalty =
    typeof candidate.minRamGb === "number" && candidate.minRamGb > systemMemoryGb
      ? (candidate.minRamGb - systemMemoryGb) * 0.3
      : 0;
  const cachedBonus = installedSet.has(candidate.name) ? installedBonus : 0;

  return quality * weights.quality + speed * weights.speed + cachedBonus - memoryPenalty;
}

function isCandidateCompatible(candidate) {
  return (
    typeof candidate.minRamGb !== "number" || candidate.minRamGb <= systemMemoryGb
  );
}

function normalizeWeights(weights) {
  const quality = Number(weights?.quality ?? 0.5);
  const speed = Number(weights?.speed ?? 0.5);
  const total = quality + speed;
  if (!Number.isFinite(total) || total <= 0) {
    return { quality: 0.5, speed: 0.5 };
  }

  return {
    quality: quality / total,
    speed: speed / total,
  };
}

function previewCandidateList(candidates) {
  const preview = candidates.slice(0, 4).join(", ");
  return candidates.length > 4 ? `${preview}, ...` : preview;
}

async function ensureOllamaModel(name) {
  const models = await getOllamaModels();
  if (models.includes(name)) {
    console.log(`Model ${name} is already installed.`);
    return true;
  }

  console.log(`Pulling ${name}. This can take a few minutes the first time...`);
  return runOptional(`Pulling ${name}`, "ollama", ["pull", name]);
}

async function canReachOllama() {
  try {
    await requestJson(`${ollamaBaseUrl}/api/tags`);
    return true;
  } catch {
    return false;
  }
}

async function getOllamaModels() {
  const data = await requestJson(`${ollamaBaseUrl}/api/tags`);
  return Array.isArray(data.models)
    ? data.models
        .flatMap((entry) => [entry.name, entry.model])
        .filter((value) => typeof value === "string")
    : [];
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        if ((response.statusCode ?? 500) >= 400) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("error", reject);
    request.setTimeout(5_000, () => {
      request.destroy(new Error("Request timed out"));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runOptional(label, command, args) {
  console.log(`${label}...`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    shell: false,
  });

  if (result.status !== 0) {
    console.warn(`${label} failed.`);
    return false;
  }

  return true;
}

function readModelConfig() {
  const configPath = path.join(root, "config", "local-models.json");
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Could not read local model config at ${configPath}: ${error.message}`,
    );
  }
}

function selectModelProfileName() {
  const configuredProfile = process.env.LOCAL_MODEL_PROFILE?.trim();
  const profileName =
    configuredProfile && configuredProfile !== "auto"
      ? configuredProfile
      : chooseAutoModelProfileName();

  if (!modelConfig.profiles[profileName]) {
    throw new Error(
      `Unknown LOCAL_MODEL_PROFILE=${profileName}. Use one of: ${Object.keys(
        modelConfig.profiles,
      ).join(", ")}.`,
    );
  }

  return profileName;
}

function chooseAutoModelProfileName() {
  if (systemMemoryGb >= 24) {
    return "quality";
  }
  return systemMemoryGb >= 12 ? "balanced" : "fast";
}

function unique(values) {
  return Array.from(
    new Set(values.filter((value) => typeof value === "string" && value)),
  );
}

function persistResolvedModelEnv() {
  const envPath = path.join(root, ".env.local");
  const nextValues = {
    LOCAL_MODEL_PROFILE: modelProfileName,
    OLLAMA_MODEL: model,
    OLLAMA_VOICE_MODEL: voiceModel,
    OLLAMA_VISION_MODEL: visionModel,
    OLLAMA_BASE_URL: ollamaBaseUrl,
    OLLAMA_KEEP_ALIVE: process.env.OLLAMA_KEEP_ALIVE || "30m",
  };
  const existing = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8").split(/\r?\n/)
    : [];
  const seen = new Set();
  const nextLines = existing.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match || !(match[1] in nextValues)) {
      return line;
    }

    const key = match[1];
    seen.add(key);
    return `${key}=${nextValues[key]}`;
  });

  for (const [key, value] of Object.entries(nextValues)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(
    envPath,
    `${nextLines.filter((line, index) => line || index < nextLines.length - 1).join("\n")}\n`,
  );
}
