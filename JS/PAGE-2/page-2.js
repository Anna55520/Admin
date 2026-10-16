/* PAGE 2 LIST ONLY. Modal form logic lives in edit-cp-modal.js. */
(function () {
  "use strict";
  const API = "/api/admin-user-management";
  const $ = id => document.getElementById(id);
  let products = [];
  let loading = false;
  let initialized = false;

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    })[c]);
  }
  function amount(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "0.00";
  }
  function message(text, type) {
    const el = $("U9-admin-products-message");
    if (!el) return;
    el.textContent = text || "";
    el.className = text ? "is-visible" : "";
    if (type) el.classList.add("is-" + type);
  }
  function tableMessage(text) {
    const body = $("U9-admin-products-tbody");
    if (!body) return;
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.className = "product-table-message";
    td.textContent = text;
    tr.appendChild(td);
    body.replaceChildren(tr);
  }
  async function requestAdmin(action, extra) {
    const response = await fetch(API, {
      method: "POST",
      credentials: "include",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(Object.assign({action}, extra || {}))
    });
    const raw = await response.text();
    let data = {};
    if (raw) { try { data = JSON.parse(raw); } catch (_) { data = {message:raw}; } }
    if (!response.ok || data.success === false || data.error) {
      throw new Error(data.error || data.message || ("Request failed (" + response.status + ")"));
    }
    return data;
  }
  function unpack(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.products)) return data.products;
    if (Array.isArray(data.data)) return data.data;
    if (data.data && Array.isArray(data.data.products)) return data.data.products;
    return [];
  }
  function flag(v) {
    const yes = v === true || v === 1 || v === "true";
    return '<span class="U9-admin-product-flag ' + (yes ? "is-on" : "is-off") + '">' + (yes ? "Yes" : "No") + "</span>";
  }
  function render() {
    const body = $("U9-admin-products-tbody");
    if (!body) return;
    if (!products.length) { tableMessage("No products found."); return; }
    body.innerHTML = products.map(p => {
      const id = String(p.id || p.uuid || "");
      return "<tr>" +
        '<td class="product-name-cell">' + esc(p.name || "") + "</td>" +
        '<td class="product-number-cell">' + esc(amount(p.price)) + "</td>" +
        '<td class="product-number-cell">' + esc(amount(p.profit)) + "</td>" +
        "<td>" + flag(p.enabled) + "</td>" +
        "<td>" + flag(p.manual_only) + "</td>" +
        '<td class="product-uuid-cell"><span class="U9-admin-product-uuid-row">' +
        '<code class="U9-admin-product-uuid-short">' + esc(id ? id.slice(0,8) : "—") + "</code>" +
        '<button type="button" class="U9-admin-product-copy-uuid" data-copy-uuid="' + esc(id) + '" title="Copy UUID">Copy</button>' +
        "</span></td>" +
        '<td class="action-column"><button type="button" class="U9-admin-products-edit-button" data-product-edit="' + esc(id) + '" aria-label="Edit product" title="Edit">' +
        '<img src="SVG/BUTTON/one.svg" alt=""></button></td>' +
        "</tr>";
    }).join("");
  }
  async function refresh() {
    if (loading) return;
    loading = true;
    const refreshButton = $("U9-admin-products-refresh");
    if (refreshButton) refreshButton.disabled = true;
    if (!products.length) tableMessage("Loading product data...");
    message("");
    try {
      // Backend must implement action: "products" and return { products: [...] }.
      products = unpack(await requestAdmin("products"));
      render();
    } catch (e) {
      console.error("[U9 Page 2] Product load failed:", e);
      if (!products.length) tableMessage("Unable to load products.");
      message(e.message || "Unable to load products.", "error");
    } finally {
      loading = false;
      if (refreshButton) refreshButton.disabled = false;
    }
  }
  function find(id) {
    return products.find(p => String(p.id || p.uuid || "") === String(id)) || null;
  }
  function openModal(product) {
    if (!window.U9ProductEditModal || typeof window.U9ProductEditModal.open !== "function") {
      message("Product modal JS is not loaded. Check JS/PAGE-2/edit-cp-modal.js.", "error");
      return;
    }
    window.U9ProductEditModal.open(product || null);
  }
  async function copy(id, button) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(id);
      } else {
        const field = document.createElement("textarea");
        field.value = id; field.readOnly = true;
        field.style.position = "fixed"; field.style.opacity = "0";
        document.body.appendChild(field); field.select();
        const ok = document.execCommand("copy"); field.remove();
        if (!ok) throw new Error("Copy was blocked");
      }
      if (button) {
        const old = button.textContent; button.textContent = "Done";
        setTimeout(() => { button.textContent = old; }, 1000);
      }
    } catch (e) { message("Unable to copy UUID. Copy it manually.", "error"); }
  }
  function bind() {
    $("U9-admin-products-refresh")?.addEventListener("click", refresh);
    $("U9-admin-products-add")?.addEventListener("click", () => openModal(null));
    $("U9-admin-products-tbody")?.addEventListener("click", event => {
      const copyButton = event.target.closest("[data-copy-uuid]");
      if (copyButton) { copy(copyButton.dataset.copyUuid || "", copyButton); return; }
      const editButton = event.target.closest("[data-product-edit]");
      if (editButton) {
        const product = find(editButton.dataset.productEdit);
        if (product) openModal(product);
        else message("Product not found. Refresh and try again.", "error");
      }
    });
    document.addEventListener("u9:products-changed", refresh);
  }
  function init() {
    if (initialized) return;
    initialized = true;
    if (!$("U9-admin-page-2") || !$("U9-admin-products-tbody")) return;
    bind();
    refresh();
  }
  window.U9AdminProducts = {
    refresh,
    findProduct: find,
    getProducts: () => products.slice(),
    requestAdmin,
    showMessage: message
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
