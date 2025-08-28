(function() {
  'use strict';

  // Utilities
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Money formatting: try Shopify.formatMoney, else fallback
  const formatMoney = (cents) => {
    try { return Shopify.formatMoney(cents, Theme && Theme.moneyFormat ? Theme.moneyFormat : '${{amount}}'); }
    catch(e){ return (cents/100).toLocaleString(undefined, { style: 'currency', currency: (Shopify && Shopify.currency && Shopify.currency.active) || 'USD' }); }
  };

  // DOM
  const section = $('.c-grid'); // current section instance
  if (!section) return;

  const modal = $('[data-popup]', section) || $('[data-popup]');
  const imgEl = $('[data-popup-image]', modal);
  const titleEl = $('[data-popup-title]', modal);
  const priceEl = $('[data-popup-price]', modal);
  const descEl = $('[data-popup-desc]', modal);
  const optionsWrap = $('[data-popup-options]', modal);
  const formEl = $('[data-popup-form]', modal);
  const statusEl = $('[data-popup-status]', modal);

  // Bonus rule settings from section data-*
  const bonusHandle = section.getAttribute('data-bonus-handle') || '';
  const triggerColor = (section.getAttribute('data-trigger-color') || 'Black').toLowerCase();
  const triggerSize  = (section.getAttribute('data-trigger-size')  || 'Medium').toLowerCase();

  let currentProduct = null;       // product JSON
  let currentVariant = null;       // selected variant

  // Open/close modal
  const openModal = () => { modal.hidden = false; modal.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { modal.hidden = true; modal.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; statusEl.textContent=''; };

  modal.addEventListener('click', (e) => {
    if (e.target.hasAttribute('data-popup-close')) closeModal();
  });
  document.addEventListener('keydown', (e) => { if (!modal.hidden && e.key === 'Escape') closeModal(); });

  // Build option selectors (select elements, dynamic)
  function buildOptions(product){
    optionsWrap.innerHTML = '';
    product.options.forEach((optName, idx) => {
      const optId = `opt-${idx}`;
      const wrap = document.createElement('div');
      wrap.className = 'c-popup__opt';
      const label = document.createElement('label');
      label.setAttribute('for', optId);
      label.textContent = optName;
      const select = document.createElement('select');
      select.id = optId;
      select.dataset.index = idx + 1;

      // Unique values for this option from all variants
      const values = [...new Set(product.variants.map(v => v.options[idx]))];
      values.forEach(val => {
        const o = document.createElement('option');
        o.value = val; o.textContent = val;
        select.appendChild(o);
      });

      wrap.appendChild(label);
      wrap.appendChild(select);
      optionsWrap.appendChild(wrap);
    });
  }

  // Find variant from current selects
  function resolveVariant(product){
    const chosen = $$('.c-popup__options select', modal).map(s => s.value);
    const v = product.variants.find(v => v.options.every((val, i) => val === chosen[i]));
    return v || null;
  }

  function render(product){
    currentProduct = product;
    titleEl.textContent = product.title;
    descEl.innerHTML = product.description || '';
    const img = product.images && product.images.length ? product.images[0] : product.featured_image;
    if (imgEl) imgEl.src = img ? (img.src || img) : '';
    buildOptions(product);
    currentVariant = resolveVariant(product) || product.variants.find(v => v.available) || product.variants[0];
    priceEl.textContent = currentVariant ? formatMoney(currentVariant.price) : formatMoney(product.price || 0);
  }

  // When option changes → update price/variant
  optionsWrap.addEventListener('change', () => {
    if (!currentProduct) return;
    currentVariant = resolveVariant(currentProduct);
    if (currentVariant) priceEl.textContent = formatMoney(currentVariant.price);
  });

  // Click on grid item → open popup
  $$('.c-grid__item', section).forEach(card => {
    card.addEventListener('click', (e) => {
      // ignore if clicking the Quick view button container (still ok)
      const handle = card.getAttribute('data-handle');
      if (!handle) return;
      fetch(`/products/${handle}.js`)
        .then(r => r.json())
        .then(prod => { render(prod); openModal(); })
        .catch(() => { /* fail silently */ });
    });
  });

  // Add to cart (AJAX, no jQuery)
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    // Re-resolve to be safe
    currentVariant = resolveVariant(currentProduct) || currentVariant || currentProduct.variants[0];
    if (!currentVariant) return;

    statusEl.textContent = 'Adding…';

    try {
      // 1) Add main product
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentVariant.id, quantity: 1 })
      }).then(r => r.json());

      // 2) Check trigger (Color = Black AND Size = Medium by value)
      const colorMatches = currentVariant.options.map(o => o.toLowerCase()).includes(triggerColor);
      const sizeMatches  = currentVariant.options.map(o => o.toLowerCase()).includes(triggerSize);

      if (bonusHandle && colorMatches && sizeMatches) {
        try {
          const bonus = await fetch(`/products/${bonusHandle}.js`).then(r => r.json());
          const bonusVariant = bonus.variants.find(v => v.available) || bonus.variants[0];
          if (bonusVariant) {
            await fetch('/cart/add.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: bonusVariant.id, quantity: 1 })
            }).then(r => r.json());
          }
        } catch(_) {}
      }

      statusEl.textContent = 'Added to cart';
      setTimeout(closeModal, 700);
      // Optionally show cart drawer if your theme uses it (Dawn listens to cart-notification events)
      document.dispatchEvent(new CustomEvent('cart:refresh'));
    } catch (err) {
      statusEl.textContent = 'Error adding to cart';
    }
  });
})();
