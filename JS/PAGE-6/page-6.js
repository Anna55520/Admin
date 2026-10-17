
/* =========================================================
   U9 ADMIN — PAGE 6: PLATFORM MAINTENANCE SETTINGS
   API: /api/admin-platform-settings
   ========================================================= */

(() => {
  "use strict";

  const API_URL = "/api/admin-platform-settings";
  const PAGE_ID = "U9-admin-page-6";
  const DEFAULT_MESSAGE = "The platform is currently undergoing maintenance. Please try again later.";
  const MIN_DURATION = 1;
  const MAX_DURATION = 720;
  const MAX_MESSAGE_LENGTH = 1000;

  function initPage6() {
    const page = document.getElementById(PAGE_ID);

    if (!page || page.dataset.p6Initialized === "true") {
      return;
    }

    const form = page.querySelector("#p6-settings-form");
    if (!form) {
      return;
    }

    page.dataset.p6Initialized = "true";

    const enabledInput = page.querySelector("#p6-maintenance-enabled");
    const durationInput = page.querySelector("#p6-maintenance-duration");
    const messageInput = page.querySelector("#p6-maintenance-message");
    const saveButton = page.querySelector("#p6-save-button");
    const resetButton = page.querySelector("#p6-reset-button");
    const refreshButton = page.querySelector("#p6-refresh-button");
    const feedback = page.querySelector("#p6-feedback");
    const statusPill = page.querySelector("#p6-status-pill");
    const statusText = page.querySelector("#p6-status-text");
    const lastUpdated = page.querySelector("#p6-last-updated");
    const messageCount = page.querySelector("#p6-message-count");

    let savedSettings = null;
    let isLoading = false;
    let isSaving = false;

    function setFeedback(message, type = "info") {
      feedback.textContent = message;
      feedback.className = `p6-feedback is-visible is-${type}`;
      feedback.setAttribute("role", type === "error" ? "alert" : "status");
    }

    function clearFeedback() {
      feedback.textContent = "";
      feedback.className = "p6-feedback";
    }

    function setBusy(busy) {
      isLoading = busy;

      if (busy) {
        page.setAttribute("aria-busy", "true");
      } else {
        page.removeAttribute("aria-busy");
      }

      updateControls();
    }

    function updateControls() {
      const busy = isLoading || isSaving;
      const disabled = busy || !savedSettings;

      enabledInput.disabled = busy;
      durationInput.disabled = busy || !enabledInput.checked;
      messageInput.disabled = busy;
      saveButton.disabled = disabled;
      resetButton.disabled = disabled;
      refreshButton.disabled = busy;

      saveButton.innerHTML = isSaving
        ? '<span class="p6-spinner" aria-hidden="true"></span> Saving...'
        : "Save Settings";

      refreshButton.textContent = isLoading ? "Loading..." : "Refresh";
    }

    function updateStatus(enabled) {
      statusPill.classList.toggle("is-active", enabled);
      statusPill.classList.toggle("is-inactive", !enabled);

      statusText.textContent = enabled
        ? "Maintenance Enabled"
        : "Operational";
    }

    function updateMessageCount() {
      messageCount.textContent =
        `${messageInput.value.length}/${MAX_MESSAGE_LENGTH} characters`;
    }

    function formatDate(value) {
      if (!value) {
        return "Not available";
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return "Not available";
      }

      return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"
      });
    }

    function updateLastUpdated(value) {
      lastUpdated.textContent = `Last updated: ${formatDate(value)}`;
    }

    function normalizeSettings(settings) {
      if (!settings || typeof settings !== "object") {
        throw new Error("The server returned invalid settings.");
      }

      const enabled = settings.maintenance_enabled;
      const duration = Number(settings.maintenance_duration_hours);
      const message = settings.maintenance_message;

      if (typeof enabled !== "boolean") {
        throw new Error("The maintenance status returned by the server is invalid.");
      }

      if (
        !Number.isInteger(duration) ||
        duration < MIN_DURATION ||
        duration > MAX_DURATION
      ) {
        throw new Error("The maintenance duration returned by the server is invalid.");
      }

      if (typeof message !== "string") {
        throw new Error("The maintenance message returned by the server is invalid.");
      }

      return {
        maintenance_enabled: enabled,
        maintenance_duration_hours: duration,
        maintenance_message: message,
        updated_at: settings.updated_at || null,
        updated_by: settings.updated_by || null
      };
    }

    function renderSettings(settings) {
      const normalized = normalizeSettings(settings);

      savedSettings = { ...normalized };

      enabledInput.checked = normalized.maintenance_enabled;
      durationInput.value = String(normalized.maintenance_duration_hours);
      messageInput.value = normalized.maintenance_message;

      updateStatus(normalized.maintenance_enabled);
      updateMessageCount();
      updateLastUpdated(normalized.updated_at);
      updateControls();
    }

    async function requestApi(method, body) {
      const options = {
        method,
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Accept": "application/json"
        }
      };

      if (body !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }

      let response;

      try {
        response = await fetch(API_URL, options);
      } catch {
        throw new Error(
          "Unable to connect to the settings service. Check your connection and try again."
        );
      }

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          `The settings service returned an invalid response (HTTP ${response.status}).`
        );
      }

      if (response.status === 401 || data.authenticated === false) {
        throw new Error(
          "Your admin session may have expired. Please sign in again."
        );
      }

      if (!response.ok || data.success !== true) {
        throw new Error(
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : `The request failed (HTTP ${response.status}).`
        );
      }

      return data;
    }

    async function loadSettings(showSuccess = false) {
      if (isLoading || isSaving) {
        return;
      }

      clearFeedback();
      setBusy(true);

      try {
        const data = await requestApi("GET");

        if (!data.settings) {
          throw new Error("The server did not return platform settings.");
        }

        renderSettings(data.settings);

        if (showSuccess) {
          setFeedback("Settings loaded successfully.", "success");
        }
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "Unable to load platform settings.",
          "error"
        );
      } finally {
        setBusy(false);
      }
    }

    function restoreSavedSettings() {
      if (!savedSettings) {
        return;
      }

      enabledInput.checked = savedSettings.maintenance_enabled;
      durationInput.value = String(savedSettings.maintenance_duration_hours);
      messageInput.value = savedSettings.maintenance_message;

      updateStatus(savedSettings.maintenance_enabled);
      updateMessageCount();
      clearFeedback();
    }

    async function saveSettings(event) {
      event.preventDefault();

      if (isLoading || isSaving || !savedSettings) {
        return;
      }

      const enabled = enabledInput.checked;
      const duration = Number(durationInput.value);
      const message = messageInput.value.trim();

      if (
        !Number.isInteger(duration) ||
        duration < MIN_DURATION ||
        duration > MAX_DURATION
      ) {
        setFeedback(
          "Maintenance duration must be a whole number between 1 and 720 hours.",
          "error"
        );
        durationInput.focus();
        return;
      }

      if (!message) {
        setFeedback("Please enter a maintenance announcement.", "error");
        messageInput.focus();
        return;
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        setFeedback(
          `The maintenance announcement must not exceed ${MAX_MESSAGE_LENGTH} characters.`,
          "error"
        );
        messageInput.focus();
        return;
      }

      const confirmed = enabled
        ? window.confirm(
            "Enable platform maintenance? Users may see the maintenance screen."
          )
        : window.confirm(
            "Disable platform maintenance and return the platform to normal operation?"
          );

      if (!confirmed) {
        return;
      }

      isSaving = true;
      clearFeedback();
      updateControls();

      try {
        const data = await requestApi("POST", {
          action: "update",
          maintenance_enabled: enabled,
          maintenance_duration_hours: duration,
          maintenance_message: message
        });

        if (!data.settings) {
          throw new Error(
            "The server did not return the saved settings. Refresh to verify the current state."
          );
        }

        renderSettings(data.settings);
        setFeedback("Platform settings saved successfully.", "success");
      } catch (error) {
        setFeedback(
          error instanceof Error
            ? error.message
            : "Unable to save platform settings.",
          "error"
        );
      } finally {
        isSaving = false;
        updateControls();
      }
    }

    enabledInput.addEventListener("change", () => {
      updateStatus(enabledInput.checked);
      updateControls();
    });

    messageInput.addEventListener("input", updateMessageCount);
    form.addEventListener("submit", saveSettings);
    resetButton.addEventListener("click", restoreSavedSettings);
    refreshButton.addEventListener("click", () => loadSettings(true));

    loadSettings();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage6, { once: true });
  } else {
    initPage6();
  }
})();
