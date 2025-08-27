
document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("custom-popup");
  const popupBody = document.getElementById("popup-body");
  const closeBtn = document.getElementById("popup-close");

  // Open popup when product clicked
  document.querySelectorAll(".grid-item").forEach(item => {
    item.addEventListener("click", async () => {
      const handle = item.dataset.handle;
      const product = await fetch(`/products/${handle}.js`).then(res => res.json());

      // Build product HTML
      let variants = "";
      product.variants.forEach(v => {
        variants += `<option value="${v.id}">${v.title} - ${Shopify.formatMoney(v.price)}</option>`;
      });

      popupBody.innerHTML = `
        <h2>${product.title}</h2>
        <p>${Shopify.formatMoney(product.price)}</p>
        <p>${product.description}</p>
        <select id="variant-select">${variants}</select>
        <button id="add-to-cart">Add to Cart</button>
      `;

      // Add to cart handler
      document.getElementById("add-to-cart").addEventListener("click", async () => {
        const variantId = document.getElementById("variant-select").value;

        // Add selected product
        await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: variantId, quantity: 1 })
        });

        // Special rule: if Black + Medium → auto add Soft Winter Jacket
        const selectedVariant = product.variants.find(v => v.id == variantId);
        if (selectedVariant && selectedVariant.title.includes("Black") && selectedVariant.title.includes("Medium")) {
          const jacket = await fetch("/products/soft-winter-jacket.js").then(res => res.json());
          await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: jacket.variants[0].id, quantity: 1 })
          });
        }

        alert("Added to cart!");
        popup.classList.add("hidden");
      });

      popup.classList.remove("hidden");
    });
  });

  // Close popup
  closeBtn.addEventListener("click", () => popup.classList.add("hidden"));
  popup.addEventListener("click", e => { if (e.target === popup) popup.classList.add("hidden"); });
});