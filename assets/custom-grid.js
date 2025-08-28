document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".quick-view-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const handle = btn.dataset.handle;

      // Fetch product info from Shopify
      const res = await fetch(`/products/${handle}.js`);
      const product = await res.json();

      // Build popup HTML
      const popup = document.createElement("div");
      popup.classList.add("popup");
      popup.innerHTML = `
        <div class="popup-content">
          <span class="popup-close">&times;</span>
          <h2>${product.title}</h2>
          <p>${(product.price / 100).toFixed(2)} ${Shopify.currency.active}</p>
          <p>${product.description}</p>
          <form id="add-to-cart-form">
            <select name="id">
              ${product.variants.map(v => `
                <option value="${v.id}">${v.title} - ${(v.price / 100).toFixed(2)} ${Shopify.currency.active}</option>
              `).join("")}
            </select>
            <button type="submit">Add to Cart</button>
          </form>
        </div>
      `;
      document.body.appendChild(popup);

      // Close popup
      popup.querySelector(".popup-close").addEventListener("click", () => popup.remove());

      // Add to cart handler
      popup.querySelector("#add-to-cart-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const variantId = e.target.querySelector("select").value;

        // Add selected product
        await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: variantId, quantity: 1 })
        });

        // Check special condition: Black + Medium => add Soft Winter Jacket
        const selectedVariant = product.variants.find(v => v.id == variantId);
        if (selectedVariant && selectedVariant.title.includes("Black") && selectedVariant.title.includes("Medium")) {
          // Add Soft Winter Jacket (replace with actual variant ID of jacket)
          const softWinterJacketVariantId = 1234567890; // TODO: update
          await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: softWinterJacketVariantId, quantity: 1 })
          });
        }

        alert("Added to cart!");
        popup.remove();
      });
    });
  });
});
