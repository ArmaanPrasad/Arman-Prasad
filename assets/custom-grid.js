document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("product-popup");
  const popupDetails = document.getElementById("popup-details");
  const closeBtn = document.querySelector(".popup-close");

  // Handle Quick View
  document.querySelectorAll(".quick-view-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const handle = btn.dataset.handle;

      try {
        const res = await fetch(`/products/${handle}.js`);
        const product = await res.json();

        let variantsHtml = "";
        product.variants.forEach(variant => {
          variantsHtml += `
            <option value="${variant.id}">
              ${variant.title} - ${Shopify.formatMoney(variant.price)}
            </option>
          `;
        });

        popupDetails.innerHTML = `
          <h2>${product.title}</h2>
          <p>${Shopify.formatMoney(product.price)}</p>
          <p>${product.description}</p>
          <select id="variant-select">${variantsHtml}</select>
          <button id="add-to-cart">Add to Cart</button>
        `;

        popup.classList.remove("hidden");

        document.getElementById("add-to-cart").addEventListener("click", async () => {
          const variantId = document.getElementById("variant-select").value;

          // Add main product
          await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: variantId, quantity: 1 })
          });

          // Special rule: Add "Soft Winter Jacket" if Black + Medium chosen
          const chosenVariant = product.variants.find(v => v.id == variantId);
          if (chosenVariant && chosenVariant.title.includes("Black") && chosenVariant.title.includes("Medium")) {
            const winterJacket = window.allProducts?.find(p => p.title === "Soft Winter Jacket");
            if (winterJacket && winterJacket.variants.length > 0) {
              await fetch("/cart/add.js", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: winterJacket.variants[0].id, quantity: 1 })
              });
            }
          }

          alert("Product added to cart!");
          popup.classList.add("hidden");
        });

      } catch (err) {
        console.error("Error fetching product:", err);
      }
    });
  });

  // Close popup
  closeBtn.addEventListener("click", () => {
    popup.classList.add("hidden");
  });

  popup.addEventListener("click", e => {
    if (e.target === popup) popup.classList.add("hidden");
  });
});
