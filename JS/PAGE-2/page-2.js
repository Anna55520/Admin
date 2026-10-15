
/* =========================================================
   U9 ADMIN - PAGE 2 PRODUCT MANAGEMENT
   File: JS/PAGE-2/page-2.js
========================================================= */

(function () {
  "use strict";

  const API_URL =
    "https://tvtakmswbzawaweytimx.supabase.co/functions/v1/admin-user-management";

  const elements = {};
  let products = [];
  let currentProductId = null;
  let loading = false;
  let saving = false;

  function $(id) {
    return document.getElementById(id);
  }

  function initializeElements() {
    [
      "U9-admin-page-2",
      "U9-admin-products-tbody",
      "U9-admin-products-message",
      "U9-admin-products-refresh",
      "U9-admin-product-modal",
      "U9-admin-product-modal-title",
      "U9-admin-product-modal-close",
      "U9-admin-product-form",
      "U9-admin-product-modal-message",
      "U9-admin-product-save",
      "U9-admin-product-cancel",
      "U9-product-id",
      "U9-product-name",
      "U9-product-price",
      "U9-product-profit",
      "U9-product-description",
      "U9-product-url",
      "U9-product-image-url",
      "U9-product-enabled",
      "U9-product-manual-only",
      "U9-product-copy-uuid",
    ].forEach((id) => {
      elements[id] = $(id);
    });

    return Object.values(elements).every(Boolean);
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

  function showPageMessage(message, type = "") {
    const target = elements["U9-admin-products-message"];

    target.textContent = message;
    target.dataset.type = type;
  }

  function showModalMessage(message, type = "") {
    const target = elements["U9-admin-product-modal-message"];

    target.textContent = message;
    target.dataset.type = type;
  }

  async function api(action, payload = {}) {
    const response = await fetch(API_URL, {
      method: "POST",
      credentials: "include",
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

    if (!response.ok || result.success === false || result.error) {
      throw new Error(
        result.error || `Request failed (${response.status}).`,
      );
    }

    return result;
  }

  function renderProducts() {
    const tbody = elements["U9-admin-products-tbody"];

    if (!products.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">No products found.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = products.map((product) => {
      const id = escapeHTML(product.id);
      const shortId = escapeHTML(product.id.slice(0, 8));

      return `
        <tr>
          <td>
            <div class="U9-admin-product-id-cell">
              <code title="${id}">${shortId}</code>
              <button
                type="button"
                class="U9-admin-product-copy"
                data-copy-product="${id}"
                aria-label="Copy full product UUID"
                title="Copy full UUID"
              >Copy</button>
            </div>
          </td>

          <td class="U9-admin-product-name">
            ${escapeHTML(product.name)}
          </td>

          <td class="U9-admin-product-number">
            ${formatAmount(product.price)}
          </td>

          <td class="U9-admin-product-number">
            ${formatAmount(product.profit)}
          </td>

          <td>
            <span class="U9-admin-product-status ${
              product.enabled ? "is-enabled" : "is-disabled"
            }">
              ${product.enabled ? "Enabled" : "Disabled"}
            </span>
          </td>

          <td>
            <span class="U9-admin-product-status ${
              product.manual_only ? "is-manual" : "is-automatic"
            }">
              ${product.manual_only ? "Yes" : "No"}
            </span>
          </td>

          <td>
            <button
              type="button"
              class="U9-admin-product-action"
              data-edit-product="${id}"
            >Edit</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function loadProducts() {
    if (loading) return;

    loading = true;
    elements["U9-admin-products-refresh"].disabled = true;
    showPageMessage("Loading product data...");

    try {
      const result = await api("products");

      if (!Array.isArray(result.products)) {
        throw new Error("The server did not return a product list.");
      }

      products = result.products;
      renderProducts();
      showPageMessage(`Loaded ${products.length} products.`, "success");
    } catch (error) {
      console.error("U9 Admin products load error:", error);

      showPageMessage(
        error.message || "Failed to load products.",
        "error",
      );
    } finally {
      loading = false;
      elements["U9-admin-products-refresh"].disabled = false;
    }
  }

  function openProductModal(productId) {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      showPageMessage("Product not found. Refresh the list and try again.", "error");
      return;
    }

    currentProductId = product.id;

    elements["U9-admin-product-modal-title"].textContent = "Edit Product";
    elements["U9-product-id"].value = product.id;
    elements["U9-product-name"].value = product.name ?? "";
    elements["U9-product-price"].value = product.price ?? 0;
    elements["U9-product-profit"].value = product.profit ?? 0;
    elements["U9-product-description"].value = product.description ?? "";
    elements["U9-product-url"].value = product.url ?? "";
    elements["U9-product-image-url"].value = product.image_url ?? "";
    elements["U9-product-enabled"].checked = product.enabled === true;
    elements["U9-product-manual-only"].checked =
      product.manual_only === true;

    showModalMessage("");

    elements["U9-admin-product-modal"].classList.add("is-open");
    elements["U9-admin-product-modal"].setAttribute("aria-hidden", "false");
    elements["U9-product-name"].focus();
  }

  function closeProductModal() {
    const modal = elements["U9-admin-product-modal"];

    if (modal.contains(document.activeElement)) {
      elements["U9-admin-products-refresh"].focus();
    }

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    currentProductId = null;
    showModalMessage("");
  }

  async function copyText(value) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const temporary = document.createElement("textarea");

        temporary.value = value;
        temporary.style.position = "fixed";
        temporary.style.opacity = "0";

        document.body.appendChild(temporary);
        temporary.select();

        const copied = document.execCommand("copy");
        temporary.remove();

        if (!copied) {
          throw new Error("Copy failed.");
        }
      }

      return true;
    } catch (error) {
      console.error("U9 Admin copy error:", error);
      return false;
    }
  }

  async function handleCopy(button, value) {
    const originalText = button.textContent;
    const copied = await copyText(value);

    button.textContent = copied ? "Copied" : "Copy failed";

    window.setTimeout(() => {
      button.textContent = originalText;
    }, 1500);
  }

  async function saveProduct(event) {
    event.preventDefault();

    if (saving || !currentProductId) return;

    const name = elements["U9-product-name"].value.trim();
    const price = Number(elements["U9-product-price"].value);
    const profitValue = elements["U9-product-profit"].value.trim();
    const profit = profitValue === "" ? 0 : Number(profitValue);
    const description = elements["U9-product-description"].value;
    const url = elements["U9-product-url"].value.trim();
    const imageUrl = elements["U9-product-image-url"].value.trim();

    if (!name) {
      showModalMessage("Product name is required.", "error");
      elements["U9-product-name"].focus();
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      showModalMessage("Price must be a valid non-negative number.", "error");
      return;
    }

    if (!Number.isFinite(profit)) {
      showModalMessage("Profit must be a valid number.", "error");
      return;
    }

    if (url && !isValidHttpUrl(url)) {
      showModalMessage("Product URL must be a valid HTTP or HTTPS URL.", "error");
      return;
    }

    if (imageUrl && !isValidHttpUrl(imageUrl)) {
      showModalMessage("Image URL must be a valid HTTP or HTTPS URL.", "error");
      return;
    }

    saving = true;
    elements["U9-admin-product-save"].disabled = true;
    elements["U9-admin-product-save"].textContent = "Saving...";
    showModalMessage("Saving changes...");

    try {
      await api("update_product", {
        product_id: currentProductId,
        name,
        price,
        profit,
        description,
        url,
        image_url: imageUrl,
        enabled: elements["U9-product-enabled"].checked,
        manual_only: elements["U9-product-manual-only"].checked,
      });

      showModalMessage("Product updated successfully.", "success");

      await loadProducts();
      closeProductModal();
      showPageMessage("Product updated successfully.", "success");
    } catch (error) {
      console.error("U9 Admin product update error:", error);

      showModalMessage(
        error.message || "Failed to update product.",
        "error",
      );
    } finally {
      saving = false;
      elements["U9-admin-product-save"].disabled = false;
      elements["U9-admin-product-save"].textContent = "Save Changes";
    }
  }

  function isValidHttpUrl(value) {
    try {
      const url = new URL(value);

      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  function bindEvents() {
    elements["U9-admin-products-refresh"].addEventListener(
      "click",
      loadProducts,
    );

    elements["U9-admin-products-tbody"].addEventListener(
      "click",
      async (event) => {
        const copyButton = event.target.closest("[data-copy-product]");

        if (copyButton) {
          await handleCopy(
            copyButton,
            copyButton.dataset.copyProduct,
          );
          return;
        }

        const editButton = event.target.closest("[data-edit-product]");

        if (editButton) {
          openProductModal(editButton.dataset.editProduct);
        }
      },
    );

    elements["U9-product-copy-uuid"].addEventListener("click", async () => {
      await handleCopy(
        elements["U9-product-copy-uuid"],
        elements["U9-product-id"].value,
      );
    });

    elements["U9-admin-product-modal-close"].addEventListener(
      "click",
      closeProductModal,
    );

    elements["U9-admin-product-cancel"].addEventListener(
      "click",
      closeProductModal,
    );

    elements["U9-admin-product-form"].addEventListener(
      "submit",
      saveProduct,
    );

    elements["U9-admin-product-modal"].addEventListener(
      "click",
      (event) => {
        if (event.target === elements["U9-admin-product-modal"]) {
          closeProductModal();
        }
      },
    );

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        elements["U9-admin-product-modal"].classList.contains("is-open")
      ) {
        closeProductModal();
      }
    });
  }

  function initialize() {
    if (!initializeElements()) {
      console.error(
        "U9 Admin PAGE 2: Required product management elements are missing.",
      );
      return;
    }

    bindEvents();

    // Load on startup. Refresh is also available manually.
    loadProducts();

    console.log("U9 Admin PAGE 2 Product Management initialized.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
