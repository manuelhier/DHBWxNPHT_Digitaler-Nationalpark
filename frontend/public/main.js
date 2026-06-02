const CHAT_OPEN_KEY = "___anythingllm-chat-widget-open___";
const ASSISTANT_ICON = "/assets/forrest.gif";

let feedbackTimer = null;

window.localStorage.removeItem(CHAT_OPEN_KEY);

// ── CHAT OPEN ──────────────────────────────────────────────────────────────

function openAnythingLLMChat() {
  if (document.getElementById("anything-llm-header")) return;
  const btn = document.getElementById("anything-llm-embed-chat-button");
  if (btn) { btn.click(); return; }
  let attempts = 0;
  const poll = setInterval(() => {
    const b = document.getElementById("anything-llm-embed-chat-button");
    if (++attempts >= 60 || b) clearInterval(poll);
    if (b) b.click();
  }, 100);
}

// ── HEADER CUSTOMIZATION ───────────────────────────────────────────────────

function customizeAnythingLLMHeader() {
  const header = document.getElementById("anything-llm-header");
  if (!header || header.classList.contains("npht-anythingllm-header")) return;
  header.classList.add("npht-anythingllm-header");
  header.querySelector(":scope > div:first-child").innerHTML = `
    <div class="npht-chat-header-brand">
      <span class="npht-chat-header-logo-wrap">
        <img class="npht-chat-header-logo" src="${ASSISTANT_ICON}" alt="FragForrest" />
      </span>
      <span class="npht-chat-header-copy">
        <span class="npht-chat-header-title">FragForrest</span>
        <span class="npht-chat-header-subtitle">Nationalpark Hohe Tauern · Österreich</span>
      </span>
    </div>
  `;
}

// ── GREETING STYLING ───────────────────────────────────────────────────────

function boldGreetingName() {
  const el = document.querySelector(
    ".allm-text-slate-400.allm-text-sm.allm-font-sans.allm-py-4.allm-text-center"
  );
  if (!el || el.dataset.nphtStyled) return;
  el.dataset.nphtStyled = "1";
  const boldText = el.textContent.replace("Forrest", "<strong>Forrest</strong>");
  el.style.cssText = `
    display: flex !important;
    align-items: center !important;
    gap: 16px !important;
    text-align: left !important;
    width: 85% !important;
    margin: 0 auto 2rem !important;
  `;
  el.innerHTML = `
    <img src="/assets/forrest.gif" alt="Forrest"
         style="width:200px;height:200px;object-fit:contain;flex-shrink:0;border-radius:16px;" />
    <span style="
      flex: 1;
      position: relative;
      background: #eaf4ec;
      color: #2a2a2a;
      border-radius: 16px 16px 16px 4px;
      padding: 14px 18px;
      font-style: italic;
      font-size: 1.35rem;
      line-height: 1.6;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    ">
      <span style="
        position: absolute;
        left: -12px;
        top: 50%;
        transform: translateY(-50%);
        width: 0; height: 0;
        border-top: 8px solid transparent;
        border-right: 13px solid #eaf4ec;
      "></span>
      ${boldText}
    </span>
  `;
}

// ── FEEDBACK ───────────────────────────────────────────────────────────────

function updateOverlay() {
  const chatOpen = !!document.getElementById("anything-llm-header");
  const feedbackOpen = !document.getElementById("feedback-panel")?.classList.contains("hidden");
  document.getElementById("page-overlay")?.classList.toggle("hidden", !chatOpen && !feedbackOpen);
}

function showFeedbackPanel() {
  document.getElementById("feedback-panel")?.classList.remove("hidden");
  document.querySelector(".feedback-trigger")?.classList.add("hidden");
  updateOverlay();
}

function closeFeedback() {
  document.getElementById("feedback-panel")?.classList.add("hidden");
  document.querySelector(".feedback-trigger")?.classList.remove("hidden");
  updateOverlay();
  feedbackTimer = setTimeout(showFeedbackPanel, 5000);
}

function toggleFeedback() {
  const panel = document.getElementById("feedback-panel");
  if (!panel) return;
  panel.classList.contains("hidden") ? showFeedbackPanel() : closeFeedback();
}

// ── MUTATION OBSERVER ──────────────────────────────────────────────────────

function init() {
  customizeAnythingLLMHeader();
  feedbackTimer = setTimeout(showFeedbackPanel, 5000);

  new MutationObserver(() => {
    customizeAnythingLLMHeader();
    boldGreetingName();

    const chatBtn = document.getElementById("anything-llm-embed-chat-button-container");
    if (chatBtn && !chatBtn.classList.contains("npht-tooltip")) {
      chatBtn.classList.add("npht-tooltip");
      chatBtn.setAttribute("data-tooltip", "Chat öffnen");
    }

    updateOverlay();
  }).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// ── WIDGET LOADER ──────────────────────────────────────────────────────────

fetch("/config.json")
  .then(r => r.json())
  .then(({ embedId }) => {
    const s = document.createElement("script");
    s.setAttribute("data-embed-id",           embedId);
    s.setAttribute("data-base-api-url",        "/api/embed");
    s.setAttribute("data-language",            "de");
    s.setAttribute("data-assistant-name",      "Forrest");
    s.setAttribute("data-brand-image-url",     ASSISTANT_ICON);
    s.setAttribute("data-assistant-icon",      ASSISTANT_ICON);
    s.setAttribute("data-greeting",            "Grüß Gott! Ich bin Forrest, der digitale Assistent des Nationalparks Hohe Tauern. \n Wie kann ich Ihnen helfen?");
    s.setAttribute("data-send-message-text",   "Frage zum Nationalpark eingeben ...");
    s.setAttribute("data-reset-chat-text",     "Neuer Chat");
    s.setAttribute("data-chat-icon",           "chatBubble");
    s.setAttribute("data-button-color",        "#2f6b3f");
    s.setAttribute("data-user-bg-color",       "#2f6b3f");
    s.setAttribute("data-assistant-bg-color",  "#f3f7f1");
    s.setAttribute("data-position",            "bottom-right");
    s.setAttribute("data-window-width",        "780px");
    s.setAttribute("data-window-height",       "880px");
    s.setAttribute("data-text-size",           "15");
    s.setAttribute("data-default-messages",    "Wanderwege, Tierbeobachtungen, Hütten & Unterkünfte, Anreise");
    s.setAttribute("data-no-sponsor",          "true");
    s.src = "/embed/anythingllm-chat-widget.min.js";
    document.body.appendChild(s);
  })
  .catch(() => console.warn("config.json nicht gefunden – Widget nicht geladen."));
