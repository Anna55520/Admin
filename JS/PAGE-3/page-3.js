/* Page 3 — admin-authenticated customer service inbox. */
(function () {
  "use strict";

  const API = "/api/admin-user-management";
  const $ = id => document.getElementById(id);

  let conversations = [];
  let selectedId = null;
  let messages = [];
  let filter = "all";
  let loading = false;
  let messageLoading = false;
  let initialized = false;
  let admin = null;
  let lastMessageCount = -1;

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }

  function dateLabel(v, full) {
    if (!v) return "";

    const d = new Date(v);
    if (!Number.isFinite(d.getTime())) return "";

    const now = new Date();

    if (!full && d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric"
    }) + (
      full
        ? " · " + d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        : ""
    );
  }

  function alertMessage(text, type) {
    const el = $("U9-admin-cs-alert");
    if (!el) return;

    el.textContent = text || "";
    el.className = text
      ? "U9-admin-cs-alert is-visible" +
        (type === "error" ? " is-error" : "")
      : "";
  }

  async function request(action, extra) {
    const response = await fetch(API, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(
        Object.assign({ action }, extra || {})
      )
    });

    const raw = await response.text();
    let data = {};

    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (_) {
        data = { error: raw };
      }
    }

    if (
      !response.ok ||
      data.error ||
      data.success === false
    ) {
      throw new Error(
        data.error ||
        data.message ||
        ("Request failed (" + response.status + ")")
      );
    }

    return data;
  }

  function current() {
    return conversations.find(
      c => String(c.id) === String(selectedId)
    ) || null;
  }

  function customerName(c) {
    return (
      (c.customer && (
        c.customer.username ||
        c.customer.account
      )) ||
      c.customer_username ||
      (c.user_id
        ? "Customer " + String(c.user_id).slice(0, 8)
        : "Customer")
    );
  }

  function lastText(c) {
    return (
      (c.last_message && c.last_message.content) ||
      c.last_message_content ||
      (c.status === "closed"
        ? "Conversation closed"
        : "No messages yet")
    );
  }

  function isMine(c) {
    return !!(
      admin &&
      c.assigned_agent_id &&
      String(c.assigned_agent_id) ===
        String(admin.agent_user_id)
    );
  }

  /*
   * Accept either unread_count or has_unread from the backend.
   * Customer messages without admin_read_at should be counted
   * by the backend as unread.
   */
  function hasUnread(c) {
    if (!c) return false;

    if (typeof c.unread_count === "number") {
      return c.unread_count > 0;
    }

    if (typeof c.unread_count === "string") {
      return Number(c.unread_count) > 0;
    }

    return c.has_unread === true;
  }

  function totalUnread() {
    return conversations.some(hasUnread);
  }

  /*
   * Keep the Page 3 bottom-navigation dot in sync with
   * the conversation list.
   *
   * CSS selector:
   * #U9-admin-bottom-nav button[data-target="U9-admin-page-3"].has-unread::after
   */
  function renderNavigationUnread() {
    const navButton = document.querySelector(
      '#U9-admin-bottom-nav [data-target="U9-admin-page-3"]'
    );

    if (!navButton) return;

    navButton.classList.toggle(
      "has-unread",
      totalUnread()
    );

    navButton.setAttribute(
      "aria-label",
      totalUnread()
        ? "Customer service — unread messages"
        : "Customer service"
    );
  }

  function filtered() {
    return conversations.filter(c => {
      if (filter === "available") {
        return c.status !== "closed" && !c.assigned_agent_id;
      }

      if (filter === "mine") {
        return isMine(c) && c.status !== "closed";
      }

      if (filter === "closed") {
        return c.status === "closed";
      }

      return true;
    });
  }

  function renderList() {
    const el = $("U9-admin-cs-conversation-list");
    if (!el) return;

    const list = filtered();
    const countEl = $("U9-admin-cs-count");

    if (countEl) {
      countEl.textContent = String(list.length);
    }

    if (!list.length) {
      el.innerHTML =
        '<div class="U9-admin-cs-empty">' +
        "No conversations in this view." +
        "</div>";

      renderNavigationUnread();
      return;
    }

    el.innerHTML = list.map(c => {
      const id = String(c.id || "");
      const status = String(c.status || "open");
      const unread = hasUnread(c);

      const assigned =
        c.assigned_agent_username ||
        (
          c.assigned_agent_id
            ? (
                isMine(c)
                  ? "Assigned to you"
                  : "Assigned to another agent"
              )
            : "Unclaimed"
        );

      const classes = [
        "U9-admin-cs-conversation",
        id === String(selectedId) ? "is-selected" : "",
        unread ? "has-unread" : ""
      ].filter(Boolean).join(" ");

      return (
        '<button type="button" class="' + classes + '"' +
        ' data-cs-open="' + esc(id) + '"' +
        (unread
          ? ' aria-label="' +
            esc(customerName(c) + ", unread messages") + '"'
          : '') +
        '>' +

          '<span class="U9-admin-cs-conversation-top">' +
            '<strong>' + esc(customerName(c)) + '</strong>' +
            '<span class="U9-admin-cs-time">' +
              esc(dateLabel(c.updated_at || c.created_at)) +
            '</span>' +
          '</span>' +

          '<span class="U9-admin-cs-preview">' +
            esc(lastText(c)) +
          '</span>' +

          '<span class="U9-admin-cs-conversation-bottom">' +
            '<span>' + esc(assigned) + '</span>' +
            '<span class="U9-admin-cs-pill ' +
              (
                status === "closed"
                  ? "is-closed"
                  : status === "assigned"
                    ? "is-assigned"
                    : "is-open"
              ) +
            '">' + esc(status) + '</span>' +
          '</span>' +

        '</button>'
      );
    }).join("");

    renderNavigationUnread();
  }

  /*
   * The receipt reads read_at only.
   * This code never writes to or changes read_at.
   */
  function renderReadReceipt(message) {
    const read = !!message.read_at;
    const symbol = read ? "✓✓" : "✓";
    const stateClass = read ? "is-read" : "is-unread";
    const label = read ? "Read" : "Sent";

    return (
      '<span class="U9-admin-cs-read-receipt ' +
        stateClass +
        '" aria-label="' + label + '" title="' + label + '">' +
        symbol +
      '</span>'
    );
  }

  function renderMessages(scroll) {
    const el = $("U9-admin-cs-messages");
    if (!el) return;

    if (!messages.length) {
      el.innerHTML =
        '<div class="U9-admin-cs-empty">' +
          "No messages yet. You can send the first reply below." +
        '</div>';
      return;
    }

    el.innerHTML = messages.map(m => {
      const type = m.sender_type || "customer";
      const agentMessage = type === "agent";

      const cls =
        type === "system"
          ? "is-system"
          : agentMessage
            ? "is-agent"
            : "is-customer";

      const who =
        type === "system"
          ? "System"
          : agentMessage
            ? (
                m.sender_id &&
                admin &&
                String(m.sender_id) !==
                  String(admin.agent_user_id)
                  ? "Support"
                  : "You"
              )
            : "Customer";

      const content =
        m.content ||
        (m.deleted_at ? "Message deleted" : "");

      return (
        '<article class="U9-admin-cs-message ' + cls + '">' +

          '<span class="U9-admin-cs-message-meta">' +
            esc(who) +
            ' · ' +
            esc(dateLabel(m.created_at, true)) +
          '</span>' +

          '<div class="U9-admin-cs-bubble">' +
            esc(content) +
          '</div>' +

          /*
           * Only agent/admin messages get sent/read receipts.
           * Customer read_at is not modified here.
           */
          (agentMessage ? renderReadReceipt(m) : '') +

        '</article>'
      );
    }).join("");

    if (scroll) {
      el.scrollTop = el.scrollHeight;
    }
  }

  function renderDetail() {
    const c = current();

    const empty = $("U9-admin-cs-chat-empty");
    const panel = $("U9-admin-cs-chat-panel");

    if (empty) empty.hidden = !!c;
    if (panel) panel.hidden = !c;

    if (!c) return;

    const name = customerName(c);

    const nameEl = $("U9-admin-cs-customer-name");
    if (nameEl) nameEl.textContent = name;

    const avatar = $("U9-admin-cs-avatar");
    if (avatar) {
      avatar.textContent =
        name.trim().charAt(0).toUpperCase() || "U";
    }

    const meta = $("U9-admin-cs-conversation-meta");
    if (meta) {
      meta.textContent =
        "Created " +
        (dateLabel(c.created_at, true) || "date unavailable") +
        " · ID " +
        String(c.id).slice(0, 8);
    }

    const status = $("U9-admin-cs-status");

    if (status) {
      status.textContent = c.status || "open";
      status.className =
        "U9-admin-cs-status" +
        (
          c.status === "closed"
            ? " is-closed"
            : c.status === "assigned"
              ? " is-assigned"
              : ""
        );
    }

    const mine = isMine(c);
    const claimed = !!c.assigned_agent_id;

    const claimButton = $("U9-admin-cs-claim");

    if (claimButton) {
      claimButton.hidden =
        c.status === "closed" || mine;

      claimButton.disabled =
        claimed || c.status === "closed";

      claimButton.textContent =
        claimed
          ? (mine ? "Claimed by you" : "Assigned")
          : "Claim conversation";
    }

    const closeButton = $("U9-admin-cs-close");

    if (closeButton) {
      closeButton.hidden =
        c.status === "closed" || !mine;
    }

    const reply = $("U9-admin-cs-reply");
    const send = $("U9-admin-cs-send");

    if (reply) {
      reply.disabled = c.status === "closed" || !mine;
      reply.placeholder =
        c.status === "closed"
          ? "This conversation is closed."
          : !mine
            ? "Claim this conversation before replying."
            : "Write a reply…";
    }

    if (send) {
      send.disabled = c.status === "closed" || !mine;
    }

    renderMessages(false);
  }

  /*
   * When a conversation has been successfully opened and its
   * messages loaded, immediately clear its local unread state.
   *
   * The backend must separately persist admin_read_at so the
   * unread state stays cleared after a refresh.
   */
  function clearLocalUnread(conversationId) {
    const c = conversations.find(
      item => String(item.id) === String(conversationId)
    );

    if (!c) return;

    c.unread_count = 0;
    c.has_unread = false;

    renderList();
  }

  async function refreshConversations(keepSelection) {
    if (loading) return;

    loading = true;

    const refreshButton = $("U9-admin-cs-refresh");
    if (refreshButton) refreshButton.disabled = true;

    try {
      const data = await request("cs_list_conversations");

      conversations = Array.isArray(data.conversations)
        ? data.conversations
        : [];

      admin = data.admin || admin;

      const identity = $("U9-admin-cs-identity");

      if (identity) {
        identity.textContent = admin
          ? "Signed in as " + (admin.username || "admin")
          : "Admin session verified";
      }

      if (
        !keepSelection ||
        !conversations.some(
          c => String(c.id) === String(selectedId)
        )
      ) {
        /*
         * Preserve the existing initial-selection behavior:
         * select the first conversation accessible to this admin.
         */
        const firstAccessible = conversations.find(
          c => !c.assigned_agent_id || isMine(c)
        );

        selectedId = firstAccessible
          ? String(firstAccessible.id)
          : null;
      }

      renderList();
      renderDetail();

      if (selectedId) {
        await loadMessages(false);
      } else {
        messages = [];
        renderMessages(false);
      }

      alertMessage("");
    } catch (e) {
      console.error("[U9 Page 3] refresh failed", e);

      alertMessage(
        e.message || "Unable to load customer-service conversations.",
        "error"
      );

      if (!conversations.length) {
        const list = $("U9-admin-cs-conversation-list");

        if (list) {
          list.innerHTML =
            '<div class="U9-admin-cs-empty">' +
              "Unable to load conversations. Check your admin session, " +
              "agent binding, and database migration." +
            '</div>';
        }
      }
    } finally {
      loading = false;
      if (refreshButton) refreshButton.disabled = false;
      renderNavigationUnread();
    }
  }

  async function loadMessages(scroll) {
    if (!selectedId || messageLoading) return;

    messageLoading = true;

    const id = selectedId;
    const messagesEl = $("U9-admin-cs-messages");

    if (messagesEl) {
      messagesEl.innerHTML =
        '<div class="U9-admin-cs-empty">Loading messages…</div>';
    }

    try {
      const data = await request("cs_list_messages", {
        conversation_id: id
      });

      /*
       * Ignore a late response if the admin has selected
       * another conversation while this request was running.
       */
      if (String(selectedId) !== String(id)) return;

      messages = Array.isArray(data.messages)
        ? data.messages
        : [];

      /*
       * The backend should mark customer messages as read for
       * the admin by updating admin_read_at after successful
       * message retrieval. It must not update customer-side
       * read_at in this admin endpoint.
       */
      clearLocalUnread(id);

      renderMessages(
        scroll || messages.length !== lastMessageCount
      );

      lastMessageCount = messages.length;
    } catch (e) {
      console.error("[U9 Page 3] messages failed", e);

      alertMessage(
        e.message || "Unable to load messages.",
        "error"
      );

      if (messagesEl) {
        messagesEl.innerHTML =
          '<div class="U9-admin-cs-empty">' +
            "Unable to load messages." +
          '</div>';
      }
    } finally {
      messageLoading = false;
    }
  }

  async function selectConversation(id) {
    selectedId = String(id);
    lastMessageCount = -1;

    renderList();
    renderDetail();

    await loadMessages(true);
  }

  async function claim() {
    const c = current();
    if (!c) return;

    const btn = $("U9-admin-cs-claim");
    if (btn) btn.disabled = true;

    alertMessage("");

    try {
      await request("cs_claim_conversation", {
        conversation_id: c.id
      });

      await refreshConversations(true);
      alertMessage("Conversation claimed.");
    } catch (e) {
      alertMessage(
        e.message || "Unable to claim conversation.",
        "error"
      );
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function sendReply(text) {
    const c = current();

    if (!c || !text.trim()) return;

    const btn = $("U9-admin-cs-send");
    if (btn) btn.disabled = true;

    try {
      const data = await request("cs_send_message", {
        conversation_id: c.id,
        content: text.trim()
      });

      if (data.message) {
        messages.push(data.message);
      }

      const reply = $("U9-admin-cs-reply");
      if (reply) reply.value = "";

      renderMessages(true);

      await refreshConversations(true);
      alertMessage("");
    } catch (e) {
      alertMessage(
        e.message || "Unable to send reply.",
        "error"
      );
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function closeConversation() {
    const c = current();

    if (
      !c ||
      !window.confirm(
        "Close this customer-service conversation?"
      )
    ) {
      return;
    }

    const btn = $("U9-admin-cs-close");
    if (btn) btn.disabled = true;

    try {
      await request("cs_close_conversation", {
        conversation_id: c.id
      });

      await refreshConversations(true);
      alertMessage("Conversation closed.");
    } catch (e) {
      alertMessage(
        e.message || "Unable to close conversation.",
        "error"
      );
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function bind() {
    const refreshButton = $("U9-admin-cs-refresh");
    if (refreshButton) {
      refreshButton.addEventListener(
        "click",
        () => refreshConversations(true)
      );
    }

    const list = $("U9-admin-cs-conversation-list");

    if (list) {
      list.addEventListener("click", e => {
        const button = e.target.closest("[data-cs-open]");
        if (button) {
          selectConversation(button.dataset.csOpen);
        }
      });
    }

    document.querySelectorAll("[data-cs-filter]").forEach(button => {
      button.addEventListener("click", () => {
        filter = button.dataset.csFilter;

        document.querySelectorAll("[data-cs-filter]").forEach(item => {
          item.classList.toggle("is-active", item === button);
        });

        renderList();
      });
    });

    const claimButton = $("U9-admin-cs-claim");
    if (claimButton) {
      claimButton.addEventListener("click", claim);
    }

    const closeButton = $("U9-admin-cs-close");
    if (closeButton) {
      closeButton.addEventListener("click", closeConversation);
    }

    const replyForm = $("U9-admin-cs-reply-form");

    if (replyForm) {
      replyForm.addEventListener("submit", e => {
        e.preventDefault();

        const reply = $("U9-admin-cs-reply");
        sendReply(reply ? reply.value : "");
      });
    }

    const reply = $("U9-admin-cs-reply");

    if (reply) {
      reply.addEventListener("keydown", e => {
        if (
          e.key === "Enter" &&
          !e.shiftKey &&
          !e.isComposing
        ) {
          e.preventDefault();

          const form = $("U9-admin-cs-reply-form");
          if (form && typeof form.requestSubmit === "function") {
            form.requestSubmit();
          } else {
            sendReply(reply.value);
          }
        }
      });
    }

    document.addEventListener("click", e => {
      const nav = e.target.closest(
        '#U9-admin-bottom-nav [data-target="U9-admin-page-3"]'
      );

      if (nav) {
        refreshConversations(true);
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) return;

      const page = $("U9-admin-page-3");

      if (page && page.classList.contains("active")) {
        refreshConversations(true);
      }
    });
  }

  function init() {
    if (initialized) return;

    if (
      !$("U9-admin-page-3") ||
      !$("U9-admin-cs-conversation-list")
    ) {
      return;
    }

    initialized = true;
    bind();
    refreshConversations(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();
