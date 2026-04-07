/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const latestQuestion = document.getElementById("latestQuestion");

const WORKER_URL = "https://api-worker.rk4b2rt5k6.workers.dev/";

// Keep a system prompt so the bot stays focused on L'Oréal + beauty topics
const messages = [
  {
    role: "system",
    content: `
      You are a polished and friendly L'Oréal beauty advisor.
      Only answer questions related to:
      - L'Oréal products
      - skincare
      - makeup
      - haircare
      - fragrance
      - beauty routines
      - beauty recommendations

      If a question is unrelated, politely refuse and guide the user back to L'Oréal or beauty-related topics.
      Keep your answers helpful, concise, and easy to read.
      Ask short follow-up questions when needed to personalize recommendations.
      Do not claim to diagnose medical conditions.
    `.trim(),
  },
];

// Helper to add a message bubble
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.classList.add("msg", role);

  const label = document.createElement("span");
  label.classList.add("msg-label");
  label.textContent = role === "user" ? "You" : "Advisor";

  const content = document.createElement("p");
  content.textContent = text;

  msg.appendChild(label);
  msg.appendChild(content);
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Helper to show the latest question above the response
function updateLatestQuestion(question) {
  latestQuestion.hidden = false;
  latestQuestion.textContent = `Latest question: ${question}`;
}

// Set initial message
addMessage("ai", "👋 Hello! How can I help you today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = userInput.value.trim();
  if (!question) return;

  // When using Cloudflare, you'll need to POST a `messages` array in the body,
  // and handle the response using: data.choices[0].message.content

  // Show message
  addMessage("user", question);
  updateLatestQuestion(question);

  messages.push({
    role: "user",
    content: question,
  });

  userInput.value = "";
  sendBtn.disabled = true;

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Request failed.");
    }

    const aiReply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response right now.";

    addMessage("ai", aiReply);

    messages.push({
      role: "assistant",
      content: aiReply,
    });
  } catch (error) {
    addMessage("ai", `Sorry, something went wrong: ${error.message}`);
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
