// Local AI Chat powered by WebLLM (WebGPU in the browser)
// Minimal, dependency-free frontend

import { CreateMLCEngine, prebuiltAppConfig } from "https://unpkg.com/@mlc-ai/web-llm?module";

const ui = {
  chat: document.getElementById("chat"),
  prompt: document.getElementById("prompt"),
  send: document.getElementById("send"),
  stop: document.getElementById("stop"),
  modelSelect: document.getElementById("model-select"),
  status: document.getElementById("status-text"),
  gpu: document.getElementById("gpu-status"),
  clear: document.getElementById("clear-history"),
  exportBtn: document.getElementById("export-chat"),
  importInput: document.getElementById("import-chat"),
};

const STORAGE_KEY = "local-ai-chat-history-v1";
const MODEL_KEY = "local-ai-chat-model";

// Will be populated from WebLLM's prebuiltAppConfig at runtime
let AVAILABLE_MODELS = [];

let engine = null;
let controller = null; // for cancel
let messages = loadHistory();

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function addMessage(role, content) {
  const msg = { role, content, ts: Date.now() };
  messages.push(msg);
  saveHistory();
  renderMessage(msg);
  return msg;
}

function renderAll() {
  ui.chat.innerHTML = "";
  for (const m of messages) renderMessage(m);
  ui.chat.scrollTop = ui.chat.scrollHeight;
}

function renderMessage(m) {
  const el = document.createElement("div");
  el.className = `message ${m.role}`;
  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = m.role === "user" ? "U" : m.role === "assistant" ? "A" : "S";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = m.content;
  const meta = document.createElement("div");
  meta.className = "meta";
  const dt = new Date(m.ts || Date.now());
  meta.textContent = `${m.role} • ${dt.toLocaleString()}`;
  const wrapper = document.createElement("div");
  wrapper.appendChild(bubble);
  wrapper.appendChild(meta);
  el.appendChild(avatar);
  el.appendChild(wrapper);
  ui.chat.appendChild(el);
}

function setStatus(text) {
  ui.status.innerHTML = text;
}

function setGPUInfo() {
  if (!("gpu" in navigator)) {
    ui.gpu.textContent = "WebGPU: unavailable (try Chrome/Edge with hardware acceleration)";
    return;
  }
  ui.gpu.textContent = "WebGPU: available";
}

function populateModels() {
  ui.modelSelect.innerHTML = "";
  const list = (prebuiltAppConfig?.model_list ?? []).map(m => m.model_id);
  AVAILABLE_MODELS = list;
  for (const id of list) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = id;
    ui.modelSelect.appendChild(opt);
  }
  const saved = localStorage.getItem(MODEL_KEY);
  if (saved && list.includes(saved)) ui.modelSelect.value = saved;
}

async function ensureEngine() {
  const modelId = ui.modelSelect.value || AVAILABLE_MODELS[0];
  if (engine && engine.getModelId && engine.getModelId() === modelId) return engine;

  if (!("gpu" in navigator)) {
    setStatus("WebGPU is not available. Please use a compatible browser.");
    throw new Error("WebGPU not available");
  }

  setStatus(`Initializing model <b>${modelId}</b> <span class=spinner></span>`);
  localStorage.setItem(MODEL_KEY, modelId);

  // Release old engine if any
  if (engine && engine.unload) {
    try { await engine.unload(); } catch {}
  }
  engine = null;

  engine = await CreateMLCEngine(modelId, {
    appConfig: prebuiltAppConfig,
    initProgressCallback: (report) => {
      const { progress = 0, text = "" } = report || {};
      setStatus(`Loading <b>${modelId}</b>: ${(progress * 100).toFixed(0)}% — ${text}`);
    },
  });

  setStatus(`Model <b>${modelId}</b> ready.`);
  return engine;
}

async function* streamAssistant(engine, messages, params = {}) {
  const conf = Object.assign({
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
    messages,
  }, params);
  const chunks = await engine.chat.completions.create(conf);
  for await (const chunk of chunks) {
    const delta = chunk?.choices?.[0]?.delta?.content ?? "";
    if (delta) yield delta;
  }
}

function appendAssistantPlaceholder() {
  const msg = { role: "assistant", content: "", ts: Date.now() };
  messages.push(msg);
  saveHistory();
  renderMessage(msg);
  return msg;
}

async function onSend() {
  const text = ui.prompt.value.trim();
  if (!text) return;
  ui.prompt.value = "";
  controller = new AbortController();
  ui.send.disabled = true; ui.stop.disabled = false;

  // Add user message
  addMessage("user", text);
  // Add assistant placeholder
  const assistantMsg = appendAssistantPlaceholder();

  try {
    const eng = await ensureEngine();
    setStatus("Generating response <span class=spinner></span>");
    let acc = "";
    for await (const token of streamAssistant(eng, messages)) {
      if (controller.signal.aborted) throw new Error("aborted");
      acc += token;
      assistantMsg.content = acc;
      // re-render last message efficiently
      ui.chat.lastElementChild.querySelector(".bubble").textContent = acc;
      ui.chat.scrollTop = ui.chat.scrollHeight;
    }
    assistantMsg.ts = Date.now();
    saveHistory();
    setStatus("Done");
  } catch (err) {
    if (String(err?.message || err).includes("aborted")) {
      setStatus("Generation stopped");
    } else {
      console.error(err);
      setStatus("Error: " + (err?.message || err));
      // annotate assistant bubble with error if empty
      if (!assistantMsg.content) {
        assistantMsg.content = "[Error generating response]";
        ui.chat.lastElementChild.querySelector(".bubble").textContent = assistantMsg.content;
      }
    }
  } finally {
    ui.send.disabled = false; ui.stop.disabled = true;
  }
}

function onStop() {
  if (controller) controller.abort();
}

function onClear() {
  messages = [];
  saveHistory();
  renderAll();
}

function onExport() {
  const data = JSON.stringify(messages, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `chat-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function onImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (Array.isArray(data)) {
        messages = data;
        saveHistory();
        renderAll();
      } else {
        alert("Invalid chat JSON: expected an array.");
      }
    } catch (err) {
      alert("Failed to parse chat JSON.");
    } finally {
      ui.importInput.value = "";
    }
  };
  reader.readAsText(file);
}

ui.send.addEventListener("click", onSend);
ui.stop.addEventListener("click", onStop);
ui.clear.addEventListener("click", onClear);
ui.exportBtn.addEventListener("click", onExport);
ui.importInput.addEventListener("change", onImport);
ui.modelSelect.addEventListener("change", () => {
  // Persist selection and reinitialize lazily on next send
  localStorage.setItem(MODEL_KEY, ui.modelSelect.value);
  setStatus("Model set to " + ui.modelSelect.value + ". It will initialize on next message.");
});

ui.prompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    onSend();
  }
});

// Initial render
populateModels();
setGPUInfo();
renderAll();
setStatus("Idle");
