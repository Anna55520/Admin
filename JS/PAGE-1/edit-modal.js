/* =====================================================
   U9 ADMIN — Edit User Modal
   File: JS/PAGE-1/edit-modal.js
   Uses admin-user-management Edge Function.
   Existing SVG source paths are intentionally unchanged.
===================================================== */
(function () {
  "use strict";

  const API_URL = "https://tvtakmswbzawaweytimx.supabase.co/functions/v1/admin-user-management";
  const elements = {};
  let currentUser = null;
  let currentDetails = null;
  let busy = false;

  function byId(id) { return document.getElementById(id); }

  function getElements() {
    [
      "modal", "close", "title", "refresh", "orderStatus", "orderCount",
      "coins", "balance", "uuid", "copyUuid", "roundProgress", "roundLabel",
      "message", "fundType", "fundOperation", "fundAmount", "fundSubmit",
      "product", "ruleOrderNumber", "ruleMaxOrders", "rulePeriodMinutes",
      "ruleSubmit", "rulesList"
    ].forEach(function (key) {
      const ids = {
        modal: "U9-admin-edit-modal", close: "U9-admin-edit-modal-close",
        title: "U9-admin-edit-modal-title", refresh: "U9-admin-edit-modal-refresh",
        orderStatus: "U9-edit-order-status", orderCount: "U9-edit-order-count",
        coins: "U9-edit-user-coins", balance: "U9-edit-user-balance",
        uuid: "U9-edit-user-uuid", copyUuid: "U9-edit-copy-uuid",
        roundProgress: "U9-edit-round-progress", roundLabel: "U9-edit-round-label",
        message: "U9-edit-modal-message", fundType: "U9-edit-fund-type",
        fundOperation: "U9-edit-fund-operation", fundAmount: "U9-edit-fund-amount",
        fundSubmit: "U9-edit-fund-submit", product: "U9-edit-rule-product",
        ruleOrderNumber: "U9-edit-rule-order-number", ruleMaxOrders: "U9-edit-rule-max-orders",
        rulePeriodMinutes: "U9-edit-rule-period-minutes", ruleSubmit: "U9-edit-rule-submit",
        rulesList: "U9-edit-rules-list"
      };
      elements[key] = byId(ids[key]);
    });
  }

  function formatAmount(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
  }

  function updateNegativeColor(el, value) {
    if (!el) return;
    const n = Number(value ?? 0);
    el.classList.toggle("is-negative", Number.isFinite(n) && n < 0);
  }

  function setMessage(message, isError) {
    if (!elements.message) return;
    elements.message.textContent = message || "";
    elements.message.classList.toggle("error", Boolean(isError));
  }

  function setBusy(value) {
    busy = Boolean(value);
    [elements.refresh, elements.fundSubmit, elements.ruleSubmit].forEach(function (el) {
      if (el) el.disabled = busy;
    });
    if (elements.rulesList) {
      elements.rulesList.querySelectorAll("button").forEach(function (el) {
        el.disabled = busy;
      });
    }
  }

  async function api(action, payload) {
    const response = await fetch(API_URL, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(Object.assign({ action: action, user_id: currentUser && currentUser.id }, payload || {}))
    });
    let result;
    try { result = await response.json(); } catch (_) { result = {}; }
    if (!response.ok || result.success === false) {
      throw new Error(result.message || result.error || "Request failed (" + response.status + ")");
    }
    return result;
  }

  function renderStatus(details) {
    if (elements.orderStatus) elements.orderStatus.textContent = details.order_status || "No Order";
    if (elements.orderCount) elements.orderCount.textContent = String(details.order_count ?? 0);
    if (elements.coins) {
      elements.coins.textContent = formatAmount(details.user.coins);
      updateNegativeColor(elements.coins, details.user.coins);
    }
    if (elements.balance) {
      elements.balance.textContent = formatAmount(details.user.balance);
      updateNegativeColor(elements.balance, details.user.balance);
    }
    if (elements.uuid) elements.uuid.textContent = details.user.id || currentUser.id || "—";
    const completed = Number(details.round_completed || 0);
    const required = Number(details.orders_per_round || 0);
    if (elements.roundProgress) elements.roundProgress.textContent = completed + "/" + required;
    if (elements.roundLabel) {
      elements.roundLabel.textContent = details.user.current_round_id
        ? "Current round · " + Math.min(completed, required) + " completed"
        : "No active round · " + completed + "/" + required;
    }
  }

  function renderProducts(products) {
    if (!elements.product) return;
    const previous = elements.product.value;
    elements.product.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select enabled product";
    elements.product.appendChild(placeholder);
    (products || []).forEach(function (product) {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = product.name + " — " + formatAmount(product.price) + " (profit " + formatAmount(product.profit) + ")";
      elements.product.appendChild(option);
    });
    if (previous && Array.from(elements.product.options).some(function (o) { return o.value === previous; })) elements.product.value = previous;
  }

  function renderRules(rules, products) {
    if (!elements.rulesList) return;
    elements.rulesList.replaceChildren();
    const productNames = new Map((products || []).map(function (p) { return [p.id, p.name]; }));
    if (!rules || !rules.length) {
      const empty = document.createElement("p");
      empty.className = "U9-edit-empty";
      empty.textContent = "No manual matching rules for this user.";
      elements.rulesList.appendChild(empty);
      return;
    }
    rules.forEach(function (rule) {
      const item = document.createElement("div");
      item.className = "U9-edit-rule-item";
      const info = document.createElement("div");
      info.className = "U9-edit-rule-info";
      const title = document.createElement("strong");
      title.textContent = "Order #" + rule.order_number + " · " + (productNames.get(rule.product_id) || rule.product_name || rule.product_id);
      const meta = document.createElement("span");
      meta.textContent = (rule.enabled ? "Enabled" : "Disabled") + " · Max " + rule.max_orders + " · Period " + rule.period_minutes + " min";
      info.append(title, meta);
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "U9-edit-secondary-button";
      toggle.textContent = rule.enabled ? "Disable" : "Enable";
      toggle.disabled = busy;
      toggle.addEventListener("click", async function () {
        if (busy) return;
        setBusy(true);
        setMessage("Updating rule…");
        try {
          await api("toggle_rule", { rule_id: rule.id, enabled: !rule.enabled });
          await loadDetails();
          setMessage("Rule updated.");
        } catch (error) { setMessage(error.message, true); }
        finally { setBusy(false); }
      });
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "U9-edit-secondary-button";
      edit.textContent = "Edit";
      edit.disabled = busy;
      edit.addEventListener("click", function () {
        if (elements.ruleOrderNumber) elements.ruleOrderNumber.value = rule.order_number;
        if (elements.product) elements.product.value = rule.product_id;
        if (elements.ruleMaxOrders) elements.ruleMaxOrders.value = rule.max_orders;
        if (elements.rulePeriodMinutes) elements.rulePeriodMinutes.value = rule.period_minutes;
      });
      item.append(info, edit, toggle);
      elements.rulesList.appendChild(item);
    });
  }

  async function loadDetails() {
    if (!currentUser || !currentUser.id) throw new Error("Selected user UUID is missing.");
    const result = await api("details");
    currentDetails = result;
    renderStatus(result);
    renderProducts(result.products || []);
    renderRules(result.rules || [], result.all_products || result.products || []);
    return result;
  }

  async function refreshEditModal() {
    if (!currentUser || busy) return;
    setBusy(true);
    setMessage("Refreshing user data…");
    try { await loadDetails(); setMessage("User data refreshed."); }
    catch (error) { setMessage(error.message, true); }
    finally { setBusy(false); }
  }

  function openEditModal(user) {
    if (!elements.modal) { console.error("[U9 Admin] Edit modal HTML not found."); return; }
    if (!user || !user.id) { console.error("[U9 Admin] Selected user has no UUID."); return; }
    currentUser = user;
    currentDetails = null;
    if (elements.title) elements.title.textContent = user.username || user.account || "User";
    if (elements.orderStatus) elements.orderStatus.textContent = "Loading…";
    if (elements.orderCount) elements.orderCount.textContent = String(user.order_count ?? 0);
    if (elements.coins) { elements.coins.textContent = formatAmount(user.coins); updateNegativeColor(elements.coins, user.coins); }
    if (elements.balance) { elements.balance.textContent = formatAmount(user.balance); updateNegativeColor(elements.balance, user.balance); }
    if (elements.uuid) elements.uuid.textContent = user.id;
    if (elements.roundProgress) elements.roundProgress.textContent = "—";
    setMessage("");
    elements.modal.classList.add("active");
    document.body.style.overflow = "hidden";
    refreshEditModal();
  }

  function closeEditModal() {
    if (!elements.modal) return;
    elements.modal.classList.remove("active");
    document.body.style.overflow = "";
    currentUser = null;
    currentDetails = null;
    setMessage("");
  }

  async function submitFundAdjustment() {
    if (busy || !currentUser) return;
    const amount = Number(elements.fundAmount && elements.fundAmount.value);
    if (!Number.isFinite(amount) || amount <= 0) { setMessage("Enter an amount greater than zero.", true); return; }
    const field = elements.fundType.value;
    const operation = elements.fundOperation.value;
    const delta = operation === "subtract" ? -amount : amount;
    const label = field === "coins" ? "Coins" : "Balance";
    if (!window.confirm((operation === "subtract" ? "Subtract " : "Add ") + formatAmount(amount) + " " + label + " for this user?")) return;
    setBusy(true); setMessage("Updating " + label + "…");
    try {
      await api("adjust_funds", { field: field, delta: delta });
      if (elements.fundAmount) elements.fundAmount.value = "";
      await loadDetails();
      setMessage(label + " updated successfully.");
      const listRefresh = byId("U9-admin-users-refresh");
      if (listRefresh) listRefresh.click();
    } catch (error) { setMessage(error.message, true); }
    finally { setBusy(false); }
  }

  async function submitRule() {
    if (busy || !currentUser) return;
    const productId = elements.product && elements.product.value;
    const orderNumber = Number(elements.ruleOrderNumber && elements.ruleOrderNumber.value);
    const maxOrders = Number(elements.ruleMaxOrders && elements.ruleMaxOrders.value);
    const periodMinutes = Number(elements.rulePeriodMinutes && elements.rulePeriodMinutes.value);
    if (!productId) { setMessage("Select a product.", true); return; }
    if (!Number.isInteger(orderNumber) || orderNumber < 1) { setMessage("Order number must be a positive integer.", true); return; }
    if (!Number.isInteger(maxOrders) || maxOrders < 1) { setMessage("Max orders must be a positive integer.", true); return; }
    if (!Number.isInteger(periodMinutes) || periodMinutes < 1) { setMessage("Period minutes must be a positive integer.", true); return; }
    setBusy(true); setMessage("Saving manual matching rule…");
    try {
      await api("save_rule", { product_id: productId, order_number: orderNumber, max_orders: maxOrders, period_minutes: periodMinutes, enabled: true });
      await loadDetails();
      setMessage("Manual matching rule saved.");
    } catch (error) { setMessage(error.message, true); }
    finally { setBusy(false); }
  }

  function init() {
    getElements();
    if (!elements.modal) { console.error("[U9 Admin] Edit modal HTML not found."); return; }
    if (elements.close) elements.close.addEventListener("click", closeEditModal);
    if (elements.refresh) elements.refresh.addEventListener("click", refreshEditModal);
    if (elements.copyUuid) elements.copyUuid.addEventListener("click", async function () {
      if (!currentUser || !currentUser.id) return;
      try {
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(currentUser.id);
        else {
          const temp = document.createElement("textarea"); temp.value = currentUser.id; temp.style.position = "fixed"; temp.style.opacity = "0"; document.body.appendChild(temp); temp.select();
          const ok = document.execCommand("copy"); temp.remove(); if (!ok) throw new Error("Clipboard copy failed.");
        }
        setMessage("User UUID copied.");
      } catch (error) { setMessage("Could not copy UUID. " + error.message, true); }
    });
    if (elements.fundSubmit) elements.fundSubmit.addEventListener("click", submitFundAdjustment);
    if (elements.ruleSubmit) elements.ruleSubmit.addEventListener("click", submitRule);
    elements.modal.addEventListener("click", function (event) { if (event.target === elements.modal) closeEditModal(); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape" && elements.modal.classList.contains("active")) closeEditModal(); });
    console.log("[U9 Admin] Edit modal initialized.");
  }

  window.openEditModal = openEditModal;
  window.closeEditModal = closeEditModal;
  window.refreshEditModal = refreshEditModal;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
