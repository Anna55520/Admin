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

  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]); }
  function dateLabel(v, full) {
    if (!v) return "";
    const d = new Date(v); if (!Number.isFinite(d.getTime())) return "";
    const now = new Date();
    if (!full && d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    return d.toLocaleDateString([], {month:"short",day:"numeric"}) + (full ? " · " + d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) : "");
  }
  function alertMessage(text, type) {
    const el = $("U9-admin-cs-alert"); if (!el) return;
    el.textContent = text || ""; el.className = text ? "U9-admin-cs-alert is-visible" + (type === "error" ? " is-error" : "") : "";
  }
  async function request(action, extra) {
    const response = await fetch(API, {method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.assign({action},extra||{}))});
    const raw = await response.text(); let data = {};
    if (raw) { try { data = JSON.parse(raw); } catch (_) { data = {error:raw}; } }
    if (!response.ok || data.error || data.success === false) throw new Error(data.error || data.message || ("Request failed (" + response.status + ")"));
    return data;
  }
  function current() { return conversations.find(c => String(c.id) === String(selectedId)) || null; }
  function customerName(c) { return (c.customer && (c.customer.username || c.customer.account)) || c.customer_username || (c.user_id ? "Customer " + String(c.user_id).slice(0,8) : "Customer"); }
  function lastText(c) { return c.last_message && c.last_message.content || c.last_message_content || (c.status === "closed" ? "Conversation closed" : "No messages yet"); }
  function isMine(c) { return !!(admin && c.assigned_admin_id && String(c.assigned_admin_id) === String(admin.id)); }
  function filtered() {
    return conversations.filter(c => {
      if (filter === "available") return c.status !== "closed" && !c.assigned_admin_id && !c.assigned_agent_id;
      if (filter === "mine") return isMine(c) && c.status !== "closed";
      if (filter === "closed") return c.status === "closed";
      return true;
    });
  }
  function renderList() {
    const el = $("U9-admin-cs-conversation-list"); if (!el) return;
    const list = filtered(); $("U9-admin-cs-count").textContent = String(list.length);
    if (!list.length) { el.innerHTML = '<div class="U9-admin-cs-empty">No conversations in this view.</div>'; return; }
    el.innerHTML = list.map(c => {
      const id = String(c.id || ""); const status = String(c.status || "open");
      const assigned = c.assigned_admin_username || (c.assigned_admin_id ? (isMine(c) ? "Assigned to you" : "Assigned to another admin") : "Unclaimed");
      return '<button type="button" class="U9-admin-cs-conversation' + (id === String(selectedId) ? ' is-selected' : '') + '" data-cs-open="' + esc(id) + '">' +
        '<span class="U9-admin-cs-conversation-top"><strong>' + esc(customerName(c)) + '</strong><span class="U9-admin-cs-time">' + esc(dateLabel(c.updated_at || c.created_at)) + '</span></span>' +
        '<span class="U9-admin-cs-preview">' + esc(lastText(c)) + '</span>' +
        '<span class="U9-admin-cs-conversation-bottom"><span>' + esc(assigned) + '</span><span class="U9-admin-cs-pill ' + (status === "closed" ? "is-closed" : status === "assigned" ? "is-assigned" : "is-open") + '">' + esc(status) + '</span></span></button>';
    }).join("");
  }
  function renderMessages(scroll) {
    const el = $("U9-admin-cs-messages"); if (!el) return;
    if (!messages.length) { el.innerHTML = '<div class="U9-admin-cs-empty">No messages yet. You can send the first reply below.</div>'; return; }
    el.innerHTML = messages.map(m => {
      const type = m.sender_type || "customer";
      const agent = type === "agent";
      const cls = type === "system" ? "is-system" : agent ? "is-agent" : "is-customer";
      const who = type === "system" ? "System" : agent ? (m.sender_admin_id && admin && String(m.sender_admin_id) !== String(admin.id) ? "Support" : "You") : "Customer";
      return '<article class="U9-admin-cs-message ' + cls + '"><span class="U9-admin-cs-message-meta">' + esc(who) + ' · ' + esc(dateLabel(m.created_at, true)) + '</span><div class="U9-admin-cs-bubble">' + esc(m.content || (m.deleted_at ? "Message deleted" : "")) + '</div></article>';
    }).join("");
    if (scroll) el.scrollTop = el.scrollHeight;
  }
  function renderDetail() {
    const c = current();
    $("U9-admin-cs-chat-empty").hidden = !!c;
    $("U9-admin-cs-chat-panel").hidden = !c;
    if (!c) return;
    const name = customerName(c); $("U9-admin-cs-customer-name").textContent = name;
    $("U9-admin-cs-avatar").textContent = name.trim().charAt(0).toUpperCase() || "U";
    $("U9-admin-cs-conversation-meta").textContent = "Created " + (dateLabel(c.created_at, true) || "date unavailable") + " · ID " + String(c.id).slice(0,8);
    const status = $("U9-admin-cs-status"); status.textContent = c.status || "open"; status.className = "U9-admin-cs-status" + (c.status === "closed" ? " is-closed" : c.status === "assigned" ? " is-assigned" : "");
    const mine = isMine(c); const claimed = !!c.assigned_admin_id;
    const claim = $("U9-admin-cs-claim"); claim.hidden = c.status === "closed" || mine; claim.disabled = claimed || !!c.assigned_agent_id || c.status === "closed"; claim.textContent = claimed ? "Assigned" : c.assigned_agent_id ? "U9 agent assigned" : "Claim conversation";
    $("U9-admin-cs-close").hidden = c.status === "closed" || !mine;
    $("U9-admin-cs-reply").disabled = c.status === "closed" || !mine;
    $("U9-admin-cs-send").disabled = c.status === "closed" || !mine;
    $("U9-admin-cs-reply").placeholder = c.status === "closed" ? "This conversation is closed." : !mine ? "Claim this conversation before replying." : "Write a reply…";
    renderMessages(false);
  }
  async function refreshConversations(keepSelection) {
    if (loading) return; loading = true;
    const btn = $("U9-admin-cs-refresh"); if (btn) btn.disabled = true;
    try {
      const data = await request("cs_list_conversations");
      conversations = Array.isArray(data.conversations) ? data.conversations : [];
      admin = data.admin || admin;
      $("U9-admin-cs-identity").textContent = admin ? "Signed in as " + (admin.username || "admin") : "Admin session verified";
      if (!keepSelection || !conversations.some(c => String(c.id) === String(selectedId))) { const firstAccessible = conversations.find(c => !c.assigned_admin_id || isMine(c)); selectedId = firstAccessible ? String(firstAccessible.id) : null; }
      renderList(); renderDetail();
      if (selectedId) await loadMessages(false);
      else { messages = []; renderMessages(false); }
      alertMessage("");
    } catch (e) {
      console.error("[U9 Page 3] refresh failed", e);
      alertMessage(e.message || "Unable to load customer-service conversations.", "error");
      if (!conversations.length) $("U9-admin-cs-conversation-list").innerHTML = '<div class="U9-admin-cs-empty">Unable to load conversations. Check your admin session and database migration.</div>';
    } finally { loading = false; if (btn) btn.disabled = false; }
  }
  async function loadMessages(scroll) {
    if (!selectedId) return; messageLoading = true;
    const id = selectedId; $("U9-admin-cs-messages").innerHTML = '<div class="U9-admin-cs-empty">Loading messages…</div>';
    try {
      const data = await request("cs_list_messages", {conversation_id:id});
      if (String(selectedId) !== String(id)) return;
      messages = Array.isArray(data.messages) ? data.messages : [];
      renderMessages(scroll || messages.length !== lastMessageCount); lastMessageCount = messages.length;
      renderList();
    } catch (e) { console.error("[U9 Page 3] messages failed",e); alertMessage(e.message || "Unable to load messages.","error"); $("U9-admin-cs-messages").innerHTML = '<div class="U9-admin-cs-empty">Unable to load messages.</div>'; }
    finally { messageLoading = false; }
  }
  async function selectConversation(id) {
    selectedId = String(id); lastMessageCount = -1; renderList(); renderDetail(); await loadMessages(true);
  }
  async function claim() {
    const c = current(); if (!c) return;
    const btn = $("U9-admin-cs-claim"); btn.disabled = true; alertMessage("");
    try { await request("cs_claim_conversation", {conversation_id:c.id}); await refreshConversations(true); alertMessage("Conversation claimed."); }
    catch (e) { alertMessage(e.message || "Unable to claim conversation.","error"); }
    finally { btn.disabled = false; }
  }
  async function sendReply(text) {
    const c = current(); if (!c || !text.trim()) return;
    const btn = $("U9-admin-cs-send"); btn.disabled = true;
    try {
      const data = await request("cs_send_message", {conversation_id:c.id,content:text.trim()});
      if (data.message) messages.push(data.message);
      $("U9-admin-cs-reply").value = ""; renderMessages(true); await refreshConversations(true); alertMessage("");
    } catch (e) { alertMessage(e.message || "Unable to send reply.","error"); }
    finally { btn.disabled = false; }
  }
  async function closeConversation() {
    const c = current(); if (!c || !window.confirm("Close this customer-service conversation?")) return;
    const btn = $("U9-admin-cs-close"); btn.disabled = true;
    try { await request("cs_close_conversation", {conversation_id:c.id}); await refreshConversations(true); alertMessage("Conversation closed."); }
    catch (e) { alertMessage(e.message || "Unable to close conversation.","error"); }
    finally { btn.disabled = false; }
  }
  function bind() {
    $("U9-admin-cs-refresh").addEventListener("click", () => refreshConversations(true));
    $("U9-admin-cs-conversation-list").addEventListener("click", e => { const b=e.target.closest("[data-cs-open]"); if (b) selectConversation(b.dataset.csOpen); });
    document.querySelectorAll("[data-cs-filter]").forEach(b => b.addEventListener("click", () => { filter=b.dataset.csFilter; document.querySelectorAll("[data-cs-filter]").forEach(x=>x.classList.toggle("is-active",x===b)); renderList(); }));
    $("U9-admin-cs-claim").addEventListener("click", claim);
    $("U9-admin-cs-close").addEventListener("click", closeConversation);
    $("U9-admin-cs-reply-form").addEventListener("submit", e => { e.preventDefault(); sendReply($("U9-admin-cs-reply").value); });
    $("U9-admin-cs-reply").addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); $("U9-admin-cs-reply-form").requestSubmit(); } });
    document.addEventListener("click", e => { const nav=e.target.closest('#U9-admin-bottom-nav [data-target="U9-admin-page-3"]'); if (nav) refreshConversations(true); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && !$('U9-admin-page-3')?.classList.contains('active')) return; if (!document.hidden) refreshConversations(true); });
  }
  function init() {
    if (initialized) return; initialized = true;
    if (!$("U9-admin-page-3") || !$("U9-admin-cs-conversation-list")) return;
    bind(); refreshConversations(false);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true}); else init();
})();
