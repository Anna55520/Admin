/* PAGE 2 PRODUCT EDIT MODAL ONLY. Page list logic is in page-2.js. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const I = {
    modal:"U9-admin-products-edit-modal", title:"U9-admin-products-edit-modal-title",
    status:"U9-admin-products-edit-status", form:"U9-admin-products-edit-form",
    id:"U9-admin-products-edit-id", name:"U9-admin-products-edit-name",
    price:"U9-admin-products-edit-price", profit:"U9-admin-products-edit-profit",
    description:"U9-admin-products-edit-description", url:"U9-admin-products-edit-url",
    image:"U9-admin-products-edit-image-url", enabled:"U9-admin-products-edit-enabled",
    manual:"U9-admin-products-edit-manual-only", close:"U9-admin-products-edit-close",
    cancel:"U9-admin-products-edit-cancel", refresh:"U9-admin-products-edit-refresh",
    save:"U9-admin-products-edit-save"
  };
  let busy = false, focusBeforeOpen = null, initialized = false;

  function status(text, type) {
    const el = $(I.status);
    if (!el) return;
    el.textContent = text || "";
    el.className = text ? "is-visible" : "";
    if (type) el.classList.add("is-" + type);
  }
  function val(id, value) { if ($(id)) $(id).value = value == null ? "" : String(value); }
  function fill(product) {
    const p = product || {};
    $(I.title).textContent = p.id || p.uuid ? "Edit Product" : "Add Product";
    val(I.id, p.id || p.uuid || "");
    val(I.name, p.name || "");
    val(I.price, p.price ?? "");
    val(I.profit, p.profit ?? "");
    val(I.description, p.description || "");
    val(I.url, p.url || "");
    val(I.image, p.image_url || p.imageUrl || "");
    $(I.enabled).checked = product ? (p.enabled === true || p.enabled === 1 || p.enabled === "true") : true;
    $(I.manual).checked = !!(p.manual_only === true || p.manual_only === 1 || p.manual_only === "true");
    status("");
  }
  function open(product) {
    const modal = $(I.modal);
    if (!modal) return;
    focusBeforeOpen = document.activeElement;
    fill(product || null);
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $(I.name)?.focus();
  }
  function close() {
    if (busy) return;
    const modal = $(I.modal);
    if (!modal) return;
    if (modal.contains(document.activeElement)) document.activeElement.blur();
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (focusBeforeOpen && typeof focusBeforeOpen.focus === "function") focusBeforeOpen.focus();
    focusBeforeOpen = null;
    status("");
  }
  function setBusy(value) {
    busy = value;
    [I.save,I.refresh,I.close,I.cancel].forEach(id => { if ($(id)) $(id).disabled = value; });
    if ($(I.save)) $(I.save).textContent = value ? "Saving..." : "Save";
  }
  function formData() {
    const id = $(I.id).value.trim();
    const name = $(I.name).value.trim();
    const price = Number($(I.price).value);
    const profit = Number($(I.profit).value);
    if (!name) throw new Error("Product name is required.");
    if ($(I.price).value === "" || !Number.isFinite(price) || price < 0) throw new Error("Enter a valid price.");
    if ($(I.profit).value === "" || !Number.isFinite(profit) || profit < 0) throw new Error("Enter a valid profit.");
    const product = {
      name, price, profit,
      description:$(I.description).value.trim(),
      url:$(I.url).value.trim(),
      image_url:$(I.image).value.trim(),
      enabled:$(I.enabled).checked,
      manual_only:$(I.manual).checked
    };
    if (id) product.id = id;
    return product;
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    let product;
    try { product = formData(); } catch (e) { status(e.message, "error"); return; }
    const editing = !!product.id;
    if (!window.U9AdminProducts || typeof window.U9AdminProducts.requestAdmin !== "function") {
      status("Page 2 JS is not loaded.", "error"); return;
    }
    setBusy(true);
    status(editing ? "Saving product changes..." : "Creating product...");
    try {
      // Backend must implement these actions and validate admin session server-side.
      // Send the fields in the shape expected by the Edge Function.
      // Updates use product_id; creates do not need a user_id.
      const payload = Object.assign({}, product);
      if (editing) payload.product_id = product.id;
      delete payload.id;

      const result = await window.U9AdminProducts.requestAdmin(
        editing ? "update_product" : "create_product",
        payload
      );
      status(editing ? "Product updated." : "Product created.", "success");
      document.dispatchEvent(new CustomEvent("u9:products-changed", {
        detail:{product:result.product || product, action:editing ? "update_product" : "create_product"}
      }));
      setTimeout(close, 350);
    } catch (e) {
      console.error("[U9 Product Modal] Save failed:", e);
      status(e.message || "Unable to save product.", "error");
    } finally { setBusy(false); }
  }
  async function refreshCurrent() {
    if (busy) return;
    const id = $(I.id).value.trim();
    if (!id) { status("New product form is ready.", "success"); return; }
    try {
      status("Refreshing product...");
      await window.U9AdminProducts.refresh();
      const product = window.U9AdminProducts.findProduct(id);
      if (!product) throw new Error("Product not found after refresh.");
      fill(product);
      status("Product refreshed.", "success");
    } catch (e) { status(e.message || "Unable to refresh product.", "error"); }
  }
  function bind() {
    $(I.form)?.addEventListener("submit", submit);
    $(I.close)?.addEventListener("click", close);
    $(I.cancel)?.addEventListener("click", close);
    $(I.refresh)?.addEventListener("click", refreshCurrent);
    $(I.modal)?.addEventListener("click", e => { if (e.target === $(I.modal)) close(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && $(I.modal)?.getAttribute("aria-hidden") === "false") close();
    });
  }
  function init() {
    if (initialized) return;
    initialized = true;
    if (!$(I.modal) || !$(I.form)) return;
    bind();
  }
  window.U9ProductEditModal = {open, close, refresh:refreshCurrent};
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
