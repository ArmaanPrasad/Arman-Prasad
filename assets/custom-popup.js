document.addEventListener("DOMContentLoaded", function() {
  const popup = document.getElementById("quickViewPopup");
  const popupClose = document.querySelector(".popup-close");
  const popupImage = document.getElementById("popupProductImage");
  const popupTitle = document.getElementById("popupProductTitle");
  const popupPrice = document.getElementById("popupProductPrice");
  const popupDescription = document.getElementById("popupProductDescription");
  const popupLink = document.getElementById("popupProductLink");

  // Quick view buttons
  document.querySelectorAll(".quick-view-btn").forEach(button => {
    button.addEventListener("click", function() {
      const handle = this.dataset.handle;

      // Fetch product JSON (Shopify provides this at /products/{handle}.js)
      fetch(`/products/${handle}.js`)
        .then(res => res.json())
        .then(product => {
          popupTitle.textContent = product.title;
          popupPrice.textContent = Shopify.formatMoney(product.price, "{{ shop.money_format }}");
          popupDescription.innerHTML = product.description;
          popupImage.src = product.images.length > 0 ? product.images[0] : "{{ 'placeholder.png' | asset_url }}";
          popupImage.width = 500;
          popupImage.height = 500;
          popupLink.href = `/products/${handle}`;
          popup.classList.remove("hidden");
        });
    });
  });

  // Close popup
  popupClose.addEventListener("click", () => {
    popup.classList.add("hidden");
  });

  // Close when clicking outside content
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.classList.add("hidden");
    }
  });
});
