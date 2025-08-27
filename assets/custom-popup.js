document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("custom-popup");
  const popupBody = document.getElementById("popup-body");
  const closeBtn = document.getElementById("popup-close");

  // Open popup when product clicked
  document.querySelectorAll(".grid-item, .grid__item, [data-product-handle]").forEach(item => {
    item.addEventListener("click", async () => {
      const handle = item.dataset.handle || item.dataset.productHandle;
      if (!handle) return;
      const product = await fetch(`/products/${handle}.js`).then(res => res.json());

      let variants = product.variants.map(v => `<option value="${v.id}">${v.title} — ${Shopify.formatMoney(v.price)}</option>`).join("");

      popupBody.innerHTML = `
        <h2 id="popup-title">${product.title}</h2>
        <p id="popup-price">${Shopify.formatMoney(product.variants[0].price)}</p>
        <div id="popup-description">${product.description || ""}</div>
        <label for="variant-select">Choose an option:</label>
        <select id="variant-select" aria-label="Variant selector">${variants}</select>
        <button id="add-to-cart">Add to Cart</button>
      `;

      // Add to cart handler
      document.getElementById("add-to-cart").addEventListener("click", async () => {
        const variantId = document.getElementById("variant-select").value;

        await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: variantId, quantity: 1 })
        });

        // Special rule: if Black + Medium → auto add Soft Winter Jacket
        const selectedVariant = product.variants.find(v => String(v.id) === String(variantId));
        if (selectedVariant && /black/i.test(selectedVariant.title) && /medium/i.test(selectedVariant.title)) {
          const jacket = await fetch("/products/soft-winter-jacket.js").then(res => res.json());
          await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: jacket.variants[0].id, quantity: 1 })
          });
        }

        // Close popup after adding
        closePopup();
        alert("Added to cart!");
      });

      // Open popup
      popup.classList.remove("hidden");
      document.body.classList.add("no-scroll"); // NEW
    });
  });

  function closePopup() {
    popup.classList.add("hidden");
    document.body.classList.remove("no-scroll"); // NEW
  }

  // Close interactions
  closeBtn.addEventListener("click", closePopup);
  popup.addEventListener("click", e => { if (e.target === popup) closePopup(); });

  // Optional: live price update when variant changes
  document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "variant-select") {
      const select = e.target;
      const priceEl = document.getElementById("popup-price");
      const productTitle = document.getElementById("popup-title")?.textContent || "";
      // We don't have the product object here; derive price from option text:
      const opt = select.options[select.selectedIndex].text;
      const match = opt.split("—").pop(); // text after em dash is formatted price
      if (priceEl && match) priceEl.textContent = match.trim();
    }
  });
});
