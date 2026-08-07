/**
 * RecuerdArte Rai chat widget.
 * Uso: <script type="module" src="/assets/rai-chat-widget.js"></script><rai-chat></rai-chat>
 */
class RaiChat extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = { busy: false, messages: [], actions: [] };
  }

  connectedCallback() {
    this.render();
  }

  async request(path, body) {
    const response = await fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "No se pudo completar la operación.");
    return payload;
  }

  async send(message) {
    const text = message.trim();
    if (!text || this.state.busy) return;
    this.state.busy = true;
    this.state.messages.push({ role: "USER", text });
    this.render();
    try {
      const payload = await this.request("/mvp/chat/messages", { message: text });
      this.state.messages = payload.session.messages;
      this.state.actions = payload.actions || [];
      this.state.error = undefined;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.state.busy = false;
      this.render();
    }
  }

  async showProposals() {
    if (this.state.busy) return;
    this.state.busy = true;
    this.render();
    try {
      const payload = await this.request("/mvp/chat/proposals", {});
      this.state.messages = payload.session.messages;
      this.state.actions = payload.actions || [];
      this.state.proposals = payload.result.solutionSet?.solutions || [];
      this.state.error = undefined;
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.state.busy = false;
      this.render();
    }
  }

  render() {
    const action = this.state.actions.find((item) => item.type === "SHOW_PROPOSALS" && item.enabled);
    const messages = this.state.messages.map((message) => `
      <div class="message ${message.role.toLowerCase()}">${this.escape(message.text)}</div>
    `).join("");
    const proposals = (this.state.proposals || []).map((proposal, index) => `
      <article class="proposal"><strong>Propuesta ${index + 1}</strong><pre>${this.escape(JSON.stringify(proposal, null, 2))}</pre></article>
    `).join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;font-family:system-ui,sans-serif;max-width:760px}
        .messages{display:flex;flex-direction:column;gap:10px;min-height:180px;padding:16px;border:1px solid #ddd;border-radius:16px;background:#fff}
        .message{max-width:82%;padding:10px 14px;border-radius:14px;white-space:pre-wrap}
        .user{align-self:flex-end;background:#eceff3}.rai{align-self:flex-start;background:#f7f4ff}
        form{display:flex;gap:8px;margin-top:12px}input{flex:1;padding:12px;border:1px solid #bbb;border-radius:10px}
        button{padding:11px 16px;border:0;border-radius:10px;cursor:pointer;font-weight:700}
        .send{background:#222;color:#fff}.proposals{margin-top:10px;background:#6d46d7;color:#fff;width:100%}
        .error{margin-top:8px;color:#a40000}.proposal{margin-top:12px;padding:12px;border:1px solid #ddd;border-radius:12px}
        pre{white-space:pre-wrap;overflow-wrap:anywhere}button[disabled],input[disabled]{opacity:.55;cursor:not-allowed}
      </style>
      <div class="messages">${messages || '<div class="message rai">Hola, soy Rai. Cuéntame para quién quieres crear un recuerdo especial.</div>'}</div>
      ${action ? `<button class="proposals" data-action="proposals" ${this.state.busy ? "disabled" : ""}>${this.escape(action.label)}</button>` : ""}
      <form>
        <input aria-label="Mensaje para Rai" placeholder="Escribe tu mensaje…" ${this.state.busy ? "disabled" : ""}>
        <button class="send" ${this.state.busy ? "disabled" : ""}>Enviar</button>
      </form>
      ${this.state.error ? `<div class="error">${this.escape(this.state.error)}</div>` : ""}
      ${proposals}
    `;

    const form = this.shadowRoot.querySelector("form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = this.shadowRoot.querySelector("input");
      const value = input.value;
      input.value = "";
      this.send(value);
    });
    this.shadowRoot.querySelector('[data-action="proposals"]')?.addEventListener("click", () => this.showProposals());
  }

  escape(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[character]);
  }
}

customElements.define("rai-chat", RaiChat);
