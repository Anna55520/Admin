/* =========================================================
   U9 ADMIN - PAGE 2 PRODUCT MANAGEMENT
   File: JS/PAGE-2/page-2.js

   Responsibilities:
   - Load and render product list
   - Refresh products
   - Copy product UUID
   - Open the separate product edit modal
   - Keep Name and Action columns sticky via CSS

   Product modal logic belongs in:
   JS/PAGE-2/edit-cp-modal.js

   Edit icon:
   SVG/BUTTON/one.svg
========================================================= */

(function () {
  "use strict";

  const API_URL =
    "https://tvtakmswbzawaweytimx.supabase.co/functions/v1/admin-user-management";

  const EDIT_ICON_URL = "SVG/BUTTON/one.svg";

  const elements = {};

  let products = [];
  let loading = false;

  /* =======================================================
     DOM HELPERS
  ======================================================= */

  function $(id) {
    return document.getElementById(id);
  }

  function initializeElements() {
    const ids = [
      "U9-admin-page-2",
      "U9-admin-products-tbody",
      "U9-admin-products-message",
      "U9-admin-products-refresh",
    ];

    ids.forEach((id) => {
      elements[id] = $(id);
    });

    const missing = ids.filter((id) => !elements[id]);

    if (missing.length) {
      console.error(
        "[U9 Admin PAGE 2] Missing required elements:",
        missing,
      );

      return false;
    }

    return true;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function formatAmount(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
  }

  /* =======================================================
     PAGE MESSAGES
  ======================================================= */

  function showPageMessage(message, type = "") {
    const target = elements["U9-admin-products-message"];

    if (!target) return;

    target.textContent = message;
    target.dataset.type = type;
  }

  /* =======================================================
     API
  ======================================================= */

  async function api(action, payload = {}) {
    const response = await fetch(API_URL, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        ...payload,
      }),
    });

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error("Invalid server response.");
    }

    if (
      !response.ok ||
      result.success === false ||
      result.error
    ) {
      throw new Error(
        result.error || `Request failed (${response.status}).`,
      );
    }

    return result;
  }

  /* =======================================================
     PRODUCT LOOKUP
  ======================================================= */

  function findProduct(productId) {
    return products.find(
      (product) => String(product.id) === String(productId),
    );
  }

  /* =======================================================
     RENDER PRODUCT TABLE

     Columns:
     Name | Price | Profit | Enabled | Manual UUID | Action

     Manual UUID cell:
     - Shows whether Manual Only is enabled
     - Shows a shortened product UUID
     - Provides a button to copy the full UUID

     The full UUID is still available in the edit modal.
  ======================================================= */

  function renderProducts() {
    const tbody = elements["U9-admin-products-tbody"];

    if (!products.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="U9-admin-products-empty">
            No products found.
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML = products.map((product) => {
      const id = String(product.id ?? "");
      const safeId = escapeHTML(id);
      const shortId = escapeHTML(id.slice(0, 8));
      const safeName = escapeHTML(product.name ?? "");

      const enabled = product.enabled === true;
      const manualOnly = product.manual_only === true;

      return `
        <tr data-product-row="${safeId}">

          <!-- NAME: sticky left column -->
          <td class="U9-admin-product-name U9-admin-product-sticky-name">
            <span title="${safeName}">
              ${safeName || "Unnamed product"}
            </span>
          </td>

          <!-- PRICE -->
          <td class="U9-admin-product-number">
            ${formatAmount(product.price)}
          </td>

          <!-- PROFIT -->
          <td class="U9-admin-product-number">
            ${formatAmount(product.profit)}
          </td>

          <!-- ENABLED -->
          <td>
            <span class="U9-admin-product-status ${
              enabled ? "is-enabled" : "is-disabled"
            }">
              ${enabled ? "Enabled" : "Disabled"}
            </span>
          </td>

          <!-- MANUAL UUID -->
          <td class="U9-admin-product-manual-uuid">
            <div class="U9-admin-product-manual-uuid-content">

              <span class="U9-admin-product-status ${
                manualOnly ? "is-manual" : "is-automatic"
              }">
                ${manualOnly ? "Manual" : "Auto"}
              </span>

              <code
                class="U9-admin-product-short-uuid"
                title="${safeId}"
              >${shortId}</code>

              <button
                type="button"
                class="U9-admin-product-copy"
                data-copy-product="${safeId}"
                aria-label="Copy product UUID"
                title="Copy full product UUID"
              >Copy</button>

            </div>
          </td>

          <!-- ACTION: sticky right column -->
          <td class="U9-admin-product-action-cell U9-admin-product-sticky-action">
            <button
              type="button"
              class="U9-admin-product-action U9-admin-edit-button"
              data-edit-product="${safeId}"
              aria-label="Edit ${safeName || "product"}"
              title="Edit product"
            >
              <img
                src="${EDIT_ICON_URL}"
                alt=""
                width="16"
                height="16"
              >
            </button>
          </td>

        </tr>
      `;
    }).join("");
  }

  /* =======================================================
     LOAD PRODUCTS

     Important:
     This function only reads products.
     It does not call update_product.
  ======================================================= */

  async function loadProducts() {
    if (loading) return;

    loading = true;

    const refreshButton =
      elements["U9-admin-products-refresh"];

    refreshButton.disabled = true;
    showPageMessage("Loading product data...");

    try {
      const result = await api("products");

      if (!Array.isArray(result.products)) {
        throw new Error(
          "The server did not return a product list.",
        );
      }

      products = result.products;

      renderProducts();

      showPageMessage(
        `Loaded ${products.length} products.`,
        "success",
      );
    } catch (error) {
      console.error(
        "[U9 Admin PAGE 2] Product loading error:",
        error,
      );

      showPageMessage(
        error.message || "Failed to load products.",
        "error",
      );
    } finally {
      loading = false;
      refreshButton.disabled = false;
    }
  }

  /* =======================================================
     OPEN PRODUCT MODAL

     The separate edit-cp-modal.js file should expose:

       window.openProductModal = function (product) { ... }

     Pass the complete product object so the modal can
     populate every field, including the product UUID.
  ======================================================= */

  function openProductModal(productId) {
    const product = findProduct(productId);

    if (!product) {
      showPageMessage(
        "Product not found. Refresh the list and try again.",
        "error",
      );

      return;
    }

    if (typeof window.openProductModal !== "function") {
      console.error(
        "[U9 Admin PAGE 2] Product modal function is unavailable. " +
        "Check that JS/PAGE-2/edit-cp-modal.js is loaded.",
      );

      showPageMessage(
        "Product edit modal is unavailable. Check the modal JavaScript file.",
        "error",
      );

      return;
    }

    window.openProductModal(product);
  }

  /* =======================================================
     COPY UUID
  ======================================================= */

  async function copyText(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return true;
      }

      const temporary = document.createElement("textarea");

      temporary.value = value;
      temporary.setAttribute("readonly", "");
      temporary.style.position = "fixed";
      temporary.style.left = "-9999px";
      temporary.style.top = "0";

      document.body.appendChild(temporary);
      temporary.select();

      const copied = document.execCommand("copy");

      temporary.remove();

      if (!copied) {
        throw new Error("Copy failed.");
      }

      return true;
    } catch (error) {
      console.error(
        "[U9 Admin PAGE 2] UUID copy error:",
        error,
      );

      return false;
    }
  }

  async function handleCopy(button, value) {
    if (!value) return;

    if (button.disabled) return;

    const originalText = button.textContent;

    button.disabled = true;

    const copied = await copyText(value);

    button.textContent = copied
      ? "Copied"
      : "Copy failed";

    if (copied) {
      showPageMessage(
        "Product UUID copied.",
        "success",
      );
    } else {
      showPageMessage(
        "Unable to copy UUID. Please copy it manually.",
        "error",
      );
    }

    window.setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1500);
  }

  /* =======================================================
     EVENT HANDLERS
  ======================================================= */

  function bindEvents() {
    elements["U9-admin-products-refresh"].addEventListener(
      "click",
      loadProducts,
    );

    elements["U9-admin-products-tbody"].addEventListener(
      "click",
      async (event) => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        /* Copy UUID */
        const copyButton = target.closest(
          "[data-copy-product]",
        );

        if (copyButton) {
          await handleCopy(
            copyButton,
            copyButton.dataset.copyProduct,
          );

          return;
        }

        /* Open edit modal */
        const editButton = target.closest(
          "[data-edit-product]",
        );

        if (editButton) {
          openProductModal(
            editButton.dataset.editProduct,
          );
        }
      },
    );
  }

  /* =======================================================
     INITIALIZATION
  ======================================================= */

  function initialize() {
    if (!initializeElements()) {
      return;
    }

    bindEvents();

    loadProducts();

    console.log(
      "[U9 Admin] PAGE 2 Product Management initialized.",
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true },
    );
  } else {
    initialize();
  }
})();
