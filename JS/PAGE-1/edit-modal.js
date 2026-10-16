
/* =====================================================
   U9 ADMIN — Edit User Modal
   File: JS/PAGE-1/edit-modal.js
   Uses admin-user-management Edge Function.
   Existing SVG source paths are intentionally unchanged.
===================================================== */

(function () {
  "use strict";

  const API_URL = "/api/admin-user-management";

  const elements = {};

  let currentUser = null;
  let currentDetails = null;
  let busy = false;

  // Round cooldown countdown
  let cooldownTimer = null;
  let cooldownEndTime = null;
  let cooldownRefreshPending = false;

  function byId(id) {
    return document.getElementById(id);
  }

  /* =====================================================
     ELEMENTS
  ===================================================== */

  function getElements() {
    const ids = {
      modal: "U9-admin-edit-modal",
      close: "U9-admin-edit-modal-close",
      title: "U9-admin-edit-modal-title",
      refresh: "U9-admin-edit-modal-refresh",

      orderStatus: "U9-edit-order-status",
      orderCount: "U9-edit-order-count",
      coins: "U9-edit-user-coins",
      balance: "U9-edit-user-balance",

      uuid: "U9-edit-user-uuid",
      copyUuid: "U9-edit-copy-uuid",

      roundProgress: "U9-edit-round-progress",
      roundLabel: "U9-edit-round-label",

      message: "U9-edit-modal-message",

      fundType: "U9-edit-fund-type",
      fundOperation: "U9-edit-fund-operation",
      fundAmount: "U9-edit-fund-amount",
      fundSubmit: "U9-edit-fund-submit",

      // Updated: Product ID is now entered manually.
      ruleProductId: "U9-edit-rule-product-id",
      ruleOrderNumber: "U9-edit-rule-order-number",
      ruleSubmit: "U9-edit-rule-submit",
      rulesList: "U9-edit-rules-list"
    };

    Object.keys(ids).forEach(function (key) {
      elements[key] = byId(ids[key]);
    });
  }

  /* =====================================================
     FORMAT / MESSAGES
  ===================================================== */

  function formatAmount(value) {
    const n = Number(value ?? 0);

    return Number.isFinite(n)
      ? n.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      : "0.00";
  }

  function updateNegativeColor(el, value) {
    if (!el) return;

    const n = Number(value ?? 0);

    el.classList.toggle(
      "is-negative",
      Number.isFinite(n) && n < 0
    );
  }

  function setMessage(message, isError) {
    if (!elements.message) return;

    elements.message.textContent = message || "";
    elements.message.classList.toggle(
      "error",
      Boolean(isError)
    );
  }

  function setBusy(value) {
    busy = Boolean(value);

    [
      elements.refresh,
      elements.fundSubmit,
      elements.ruleSubmit
    ].forEach(function (el) {
      if (el) el.disabled = busy;
    });

    if (elements.rulesList) {
      elements.rulesList
        .querySelectorAll("button")
        .forEach(function (el) {
          el.disabled = busy;
        });
    }
  }

  /* =====================================================
     API
  ===================================================== */

  async function api(action, payload) {
    if (!currentUser || !currentUser.id) {
      throw new Error("Selected user UUID is missing.");
    }

    const response = await fetch(API_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store",
      body: JSON.stringify(
        Object.assign(
          {
            action: action,
            user_id: currentUser.id
          },
          payload || {}
        )
      )
    });

    let result;

    try {
      result = await response.json();
    } catch (_) {
      result = {};
    }

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message ||
        result.error ||
        "Request failed (" + response.status + ")"
      );
    }

    return result;
  }

  /* =====================================================
     ROUND COOLDOWN
  ===================================================== */

  function stopCooldownTimer() {
    if (cooldownTimer !== null) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }

    cooldownEndTime = null;
    cooldownRefreshPending = false;
  }

  function getCooldownEndTime(details) {
    if (!details || typeof details !== "object") {
      return null;
    }

    const user = details.user || {};

    const raw =
      user.cooldown_end_time ??
      details.cooldown_end_time ??
      details.user_cooldown_end_time ??
      null;

    if (!raw) return null;

    const timestamp = new Date(raw).getTime();

    return Number.isFinite(timestamp)
      ? timestamp
      : null;
  }

  function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(
      0,
      Math.ceil(milliseconds / 1000)
    );

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );
    const seconds = totalSeconds % 60;

    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");

    if (hours > 0) {
      return (
        String(hours).padStart(2, "0") +
        ":" + mm +
        ":" + ss
      );
    }

    return mm + ":" + ss;
  }

  function renderCooldownTick() {
    if (!elements.roundLabel || !cooldownEndTime) {
      return;
    }

    const remaining = cooldownEndTime - Date.now();

    if (remaining <= 0) {
      elements.roundLabel.textContent =
        "Cooldown finished · Refreshing round status…";

      if (cooldownTimer !== null) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
      }

      if (
        currentUser &&
        elements.modal &&
        elements.modal.classList.contains("active") &&
        !cooldownRefreshPending
      ) {
        cooldownRefreshPending = true;

        loadDetails()
          .catch(function (error) {
            setMessage(
              "Cooldown ended, but refresh failed: " +
              error.message,
              true
            );
          })
          .finally(function () {
            cooldownRefreshPending = false;
          });
      }

      return;
    }

    elements.roundLabel.textContent =
      "Cooldown " + formatCountdown(remaining);

    const completed = Number(
      currentDetails &&
      currentDetails.round_completed || 0
    );

    const required = Number(
      currentDetails &&
      currentDetails.orders_per_round || 0
    );

    if (elements.roundProgress && required > 0) {
      elements.roundProgress.textContent =
        Math.min(completed, required) +
        " / " + required;
    }
  }

  function startCooldownTimer(endTime) {
    stopCooldownTimer();

    if (!endTime || endTime <= Date.now()) {
      return false;
    }

    cooldownEndTime = endTime;

    renderCooldownTick();

    cooldownTimer = setInterval(function () {
      if (
        !currentUser ||
        !elements.modal ||
        !elements.modal.classList.contains("active")
      ) {
        stopCooldownTimer();
        return;
      }

      renderCooldownTick();
    }, 1000);

    return true;
  }

  /* =====================================================
     RENDER USER / ROUND STATUS
  ===================================================== */

  function renderStatus(details) {
    if (!details || !details.user) {
      throw new Error(
        "Invalid user details returned by admin-user-management."
      );
    }

    const user = details.user;

    if (elements.orderStatus) {
      elements.orderStatus.textContent =
        details.order_status || "No Order";
    }

    if (elements.orderCount) {
      elements.orderCount.textContent =
        String(details.order_count ?? 0);
    }

    if (elements.coins) {
      elements.coins.textContent =
        formatAmount(user.coins);

      updateNegativeColor(
        elements.coins,
        user.coins
      );
    }

    if (elements.balance) {
      elements.balance.textContent =
        formatAmount(user.balance);

      updateNegativeColor(
        elements.balance,
        user.balance
      );
    }

    if (elements.uuid) {
      elements.uuid.textContent =
        user.id || (currentUser && currentUser.id) || "—";
    }

    const completed = Number(
      details.round_completed || 0
    );

    const required = Number(
      details.orders_per_round || 0
    );

    const safeCompleted = Math.max(0, completed);
    const safeRequired = Math.max(0, required);

    if (elements.roundProgress) {
      elements.roundProgress.textContent =
        safeCompleted + " / " + safeRequired;
    }

    const endTime = getCooldownEndTime(details);

    // Active cooldown: show a live countdown.
    if (endTime && endTime > Date.now()) {
      if (elements.roundLabel) {
        elements.roundLabel.textContent =
          "Cooldown " + formatCountdown(endTime - Date.now());
      }

      startCooldownTimer(endTime);
      return;
    }

    // No active cooldown.
    stopCooldownTimer();

    if (elements.roundLabel) {
      if (user.current_round_id) {
        elements.roundLabel.textContent =
          "Current round · " +
          Math.min(safeCompleted, safeRequired) +
          " completed";
      } else {
        elements.roundLabel.textContent =
          "No active round · " +
          safeCompleted + "/" + safeRequired;
      }
    }
  }

  /* =====================================================
     MANUAL MATCHING RULES

     Product ID is entered manually.
     max_orders / period_minutes are no longer used.
  ===================================================== */

  function renderRules(rules, products) {
    if (!elements.rulesList) return;

    elements.rulesList.replaceChildren();

    const productNames = new Map(
      (products || []).map(function (product) {
        return [product.id, product.name];
      })
    );

    if (!rules || !rules.length) {
      const empty = document.createElement("p");

      empty.className = "U9-edit-empty";
      empty.textContent =
        "No manual matching rules for this user.";

      elements.rulesList.appendChild(empty);
      return;
    }

    rules.forEach(function (rule) {
      const item = document.createElement("div");
      item.className = "U9-edit-rule-item";

      const info = document.createElement("div");
      info.className = "U9-edit-rule-info";

      const title = document.createElement("strong");

      title.textContent =
        "Order #" + rule.order_number +
        " · " +
        (
          productNames.get(rule.product_id) ||
          rule.product_name ||
          rule.product_id
        );

      const productIdText = document.createElement("span");
      productIdText.textContent =
        "Product ID: " + rule.product_id;

      const status = document.createElement("span");
      status.textContent = rule.enabled
        ? "Enabled"
        : "Disabled";

      info.append(title, productIdText, status);

      // Edit button
      const edit = document.createElement("button");

      edit.type = "button";
      edit.className = "U9-edit-secondary-button";
      edit.textContent = "Edit";
      edit.disabled = busy;

      edit.addEventListener("click", function () {
        if (busy) return;

        if (elements.ruleOrderNumber) {
          elements.ruleOrderNumber.value =
            String(rule.order_number);
        }

        if (elements.ruleProductId) {
          elements.ruleProductId.value =
            rule.product_id || "";
        }

        setMessage(
          "Rule loaded into the form. Edit the values and save."
        );

        if (elements.ruleOrderNumber) {
          elements.ruleOrderNumber.focus();
        }
      });

      // Enable / Disable button
      const toggle = document.createElement("button");

      toggle.type = "button";
      toggle.className = "U9-edit-secondary-button";
      toggle.textContent = rule.enabled
        ? "Disable"
        : "Enable";
      toggle.disabled = busy;

      toggle.addEventListener("click", async function () {
        if (busy) return;

        setBusy(true);
        setMessage("Updating rule…");

        try {
          await api("toggle_rule", {
            rule_id: rule.id,
            enabled: !rule.enabled
          });

          await loadDetails();

          setMessage("Rule updated.");
        } catch (error) {
          setMessage(error.message, true);
        } finally {
          setBusy(false);
        }
      });

      // Delete button
      const remove = document.createElement("button");

      remove.type = "button";
      remove.className = "U9-edit-secondary-button";
      remove.textContent = "Delete";
      remove.disabled = busy;
      remove.setAttribute(
        "aria-label",
        "Delete matching rule for order " + rule.order_number
      );

      remove.addEventListener("click", async function () {
        if (busy) return;

        const confirmed = window.confirm(
          "Delete this manual matching rule?\n\n" +
          "Order Number: " + rule.order_number + "\n" +
          "Product ID: " + rule.product_id + "\n\n" +
          "This action cannot be undone."
        );

        if (!confirmed) return;

        setBusy(true);
        setMessage("Deleting matching rule…");

        try {
          await api("delete_rule", {
            rule_id: rule.id
          });

          await loadDetails();

          setMessage("Matching rule deleted.");
        } catch (error) {
          setMessage(error.message, true);
        } finally {
          setBusy(false);
        }
      });

      item.append(info, edit, toggle, remove);
      elements.rulesList.appendChild(item);
    });
  }

  /* =====================================================
     LOAD DETAILS
  ===================================================== */

  async function loadDetails() {
    if (!currentUser || !currentUser.id) {
      throw new Error("Selected user UUID is missing.");
    }

    const userIdAtRequest = currentUser.id;
    const result = await api("details");

    // Ignore an old response if the modal has switched users.
    if (
      !currentUser ||
      currentUser.id !== userIdAtRequest
    ) {
      return null;
    }

    currentDetails = result;

    renderStatus(result);

    renderRules(
      result.rules || [],
      result.all_products || result.products || []
    );

    return result;
  }

  async function refreshEditModal() {
    if (!currentUser || busy) return;

    setBusy(true);
    setMessage("Refreshing user data…");

    try {
      await loadDetails();
      setMessage("User data refreshed.");
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  /* =====================================================
     OPEN / CLOSE MODAL
  ===================================================== */

  function openEditModal(user) {
    if (!elements.modal) {
      console.error(
        "[U9 Admin] Edit modal HTML not found."
      );
      return;
    }

    if (!user || !user.id) {
      console.error(
        "[U9 Admin] Selected user has no UUID."
      );
      return;
    }

    stopCooldownTimer();

    currentUser = user;
    currentDetails = null;

    if (elements.title) {
      elements.title.textContent =
        user.username || user.account || "User";
    }

    if (elements.orderStatus) {
      elements.orderStatus.textContent = "Loading…";
    }

    if (elements.orderCount) {
      elements.orderCount.textContent =
        String(user.order_count ?? 0);
    }

    if (elements.coins) {
      elements.coins.textContent =
        formatAmount(user.coins);

      updateNegativeColor(
        elements.coins,
        user.coins
      );
    }

    if (elements.balance) {
      elements.balance.textContent =
        formatAmount(user.balance);

      updateNegativeColor(
        elements.balance,
        user.balance
      );
    }

    if (elements.uuid) {
      elements.uuid.textContent = user.id;
    }

    if (elements.roundProgress) {
      elements.roundProgress.textContent = "—";
    }

    if (elements.roundLabel) {
      elements.roundLabel.textContent =
        "Loading round…";
    }

    if (elements.ruleOrderNumber) {
      elements.ruleOrderNumber.value = "";
    }

    if (elements.ruleProductId) {
      elements.ruleProductId.value = "";
    }

    setMessage("");

    elements.modal.classList.add("active");
    document.body.style.overflow = "hidden";

    refreshEditModal();
  }

  function closeEditModal() {
    stopCooldownTimer();

    if (!elements.modal) return;

    elements.modal.classList.remove("active");
    document.body.style.overflow = "";

    currentUser = null;
    currentDetails = null;

    setMessage("");
  }

  /* =====================================================
     COINS / BALANCE ADJUSTMENT
  ===================================================== */

  async function submitFundAdjustment() {
    if (busy || !currentUser) return;

    const amount = Number(
      elements.fundAmount &&
      elements.fundAmount.value
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage(
        "Enter an amount greater than zero.",
        true
      );
      return;
    }

    const field = elements.fundType.value;
    const operation = elements.fundOperation.value;

    const delta = operation === "subtract"
      ? -amount
      : amount;

    const label = field === "coins"
      ? "Coins"
      : "Balance";

    const confirmed = window.confirm(
      (operation === "subtract" ? "Subtract " : "Add ") +
      formatAmount(amount) +
      " " + label +
      " for this user?"
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage("Updating " + label + "…");

    try {
      await api("adjust_funds", {
        field: field,
        delta: delta
      });

      if (elements.fundAmount) {
        elements.fundAmount.value = "";
      }

      await loadDetails();

      setMessage(label + " updated successfully.");

      const listRefresh = byId(
        "U9-admin-users-refresh"
      );

      if (listRefresh) {
        listRefresh.click();
      }
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  /* =====================================================
     SAVE MANUAL MATCHING RULE

     Required:
     - Order Number
     - Product ID (UUID)

     Removed:
     - Max Orders
     - Period (minutes)
  ===================================================== */

  function isValidUuid(value) {
    return typeof value === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(value);
  }

  async function submitRule() {
    if (busy || !currentUser) return;

    const productId = (
      elements.ruleProductId &&
      elements.ruleProductId.value || ""
    ).trim();

    const orderNumber = Number(
      elements.ruleOrderNumber &&
      elements.ruleOrderNumber.value
    );

    if (
      !Number.isInteger(orderNumber) ||
      orderNumber < 1
    ) {
      setMessage(
        "Order number must be a positive integer.",
        true
      );
      return;
    }

    if (!isValidUuid(productId)) {
      setMessage(
        "Enter a valid Product ID UUID.",
        true
      );

      if (elements.ruleProductId) {
        elements.ruleProductId.focus();
      }

      return;
    }

    setBusy(true);
    setMessage("Saving manual matching rule…");

    try {
      await api("save_rule", {
        product_id: productId,
        order_number: orderNumber,
        enabled: true
      });

      await loadDetails();

      if (elements.ruleOrderNumber) {
        elements.ruleOrderNumber.value = "";
      }

      if (elements.ruleProductId) {
        elements.ruleProductId.value = "";
      }

      setMessage("Manual matching rule saved.");
    } catch (error) {
      setMessage(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  /* =====================================================
     INITIALIZATION
  ===================================================== */

  function init() {
    getElements();

    if (!elements.modal) {
      console.error(
        "[U9 Admin] Edit modal HTML not found."
      );
      return;
    }

    if (elements.close) {
      elements.close.addEventListener(
        "click",
        closeEditModal
      );
    }

    if (elements.refresh) {
      elements.refresh.addEventListener(
        "click",
        refreshEditModal
      );
    }

    if (elements.copyUuid) {
      elements.copyUuid.addEventListener(
        "click",
        async function () {
          if (!currentUser || !currentUser.id) return;

          try {
            if (
              navigator.clipboard &&
              window.isSecureContext
            ) {
              await navigator.clipboard.writeText(
                currentUser.id
              );
            } else {
              const temp =
                document.createElement("textarea");

              temp.value = currentUser.id;
              temp.style.position = "fixed";
              temp.style.opacity = "0";

              document.body.appendChild(temp);
              temp.select();

              const ok =
                document.execCommand("copy");

              temp.remove();

              if (!ok) {
                throw new Error(
                  "Clipboard copy failed."
                );
              }
            }

            setMessage("User UUID copied.");
          } catch (error) {
            setMessage(
              "Could not copy UUID. " + error.message,
              true
            );
          }
        }
      );
    }

    if (elements.fundSubmit) {
      elements.fundSubmit.addEventListener(
        "click",
        submitFundAdjustment
      );
    }

    if (elements.ruleSubmit) {
      elements.ruleSubmit.addEventListener(
        "click",
        submitRule
      );
    }

    // Close when clicking the modal backdrop.
    elements.modal.addEventListener(
      "click",
      function (event) {
        if (event.target === elements.modal) {
          closeEditModal();
        }
      }
    );

    // Close with Escape.
    document.addEventListener(
      "keydown",
      function (event) {
        if (
          event.key === "Escape" &&
          elements.modal.classList.contains("active")
        ) {
          closeEditModal();
        }
      }
    );

    console.log(
      "[U9 Admin] Edit modal initialized."
    );
  }

  window.openEditModal = openEditModal;
  window.closeEditModal = closeEditModal;
  window.refreshEditModal = refreshEditModal;

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
