import * as webllm from "https://esm.run/@mlc-ai/web-llm";

let engine = null;

// Auto-download on page load
(async () => {
  const progressText = document.getElementById("progress-text");
  const progressContainer = document.getElementById("progress-container");
  const chatContainer = document.getElementById("chat-container");

  if (progressText) {
    progressText.textContent = "Initializing...";
  }

  const initProgressCallback = (progress) => {
    if (progressText) {
      progressText.textContent = progress.text;
    }
  };

  try {
    engine = await webllm.CreateMLCEngine("SmolLM2-135M-Instruct-q0f16-MLC", {
      initProgressCallback: initProgressCallback,
    });

    if (progressContainer) progressContainer.classList.add("hidden");
    if (chatContainer) chatContainer.classList.remove("hidden");

    const userInput = document.getElementById("user-input");
    if (userInput) userInput.focus();
  } catch (error) {
    if (progressText) {
      progressText.textContent = `Error: ${error.message}`;
    }
    console.error(error);
  }
})();

// Handle chat
const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");

if (sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
}

if (userInput) {
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });
}

async function sendMessage() {
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const chatBox = document.getElementById("chat-box");

  if (!userInput || !sendBtn || !chatBox) return;

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
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
