import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;

// UI elements
const modelName = document.getElementById("model-name");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const chatContainer = document.getElementById("chat-container");
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// Custom model config with GGUF URL
const customModel = {
  model: "https://huggingface.co/mradermacher/SmolLM-135M-GGUF/resolve/main/SmolLM-135M.Q4_K_M.gguf",
  model_id: "SmolLM-135M-Q4",
  model_lib: webllm.prebuiltAppConfig.model_list.find(m => m.model_id.includes("SmolLM"))?.model_lib ||
             "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_46/SmolLM-135M-q4f16_1-ctx768_cs1k-webgpu.wasm",
};

// Auto-download on page load
(async () => {
  progressText.textContent = "Initializing...";

  const initProgressCallback = (progress) => {
    const percentage = Math.round(progress.progress * 100);
    progressBar.style.setProperty('--progress', `${percentage}%`);
    progressText.textContent = progress.text;
  };

  try {
    engine = await webllm.CreateMLCEngine("SmolLM2-135M-Instruct-q0f16-MLC", {
      initProgressCallback: initProgressCallback,
    });

    modelName.textContent = "SmolLM2-135M";
    progressContainer.classList.add("hidden");
    chatContainer.classList.remove("hidden");
    userInput.focus();
  } catch (error) {
    progressText.textContent = `Error: ${error.message}`;
    console.error(error);
  }
})();

// Handle chat
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message || !engine) return;

  // Add user message
  addMessage(message, "user");
  userInput.value = "";
  sendBtn.disabled = true;

  // Create assistant message for streaming
  const assistantMsg = document.createElement("div");
  assistantMsg.className = "message assistant";
  chatBox.appendChild(assistantMsg);

  try {
    const chunks = await engine.chat.completions.create({
      messages: [{ role: "user", content: message }],
      stream: true,
    });

    let fullResponse = "";
    for await (const chunk of chunks) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullResponse += content;
      assistantMsg.textContent = fullResponse;
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  } catch (error) {
    assistantMsg.textContent = `Error: ${error.message}`;
    console.error(error);
  }

  sendBtn.disabled = false;
  userInput.focus();
}

function addMessage(text, type) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
