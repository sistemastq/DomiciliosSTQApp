// public/cart.js

document.addEventListener('DOMContentLoaded', () => {
  const DELIVERY_FEE = 5000; // costo de domicilio (ajústalo si quieres)

  // ----- Elementos DOM -----
  const backButton = document.getElementById('cart-back-button');
  const cartEmptyMessage = document.getElementById('cart-empty-message');
  const cartItemsContainer = document.getElementById('cart-items');
  const addMoreItemsBtn = document.getElementById('add-more-items-btn');

  const orderSummarySection = document.getElementById('order-summary');
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryDelivery = document.getElementById('summary-delivery');
  const summaryTotal = document.getElementById('summary-total');

  const shippingDelivery = document.getElementById('shipping-delivery');
  const shippingPickup = document.getElementById('shipping-pickup');

  const checkoutButton = document.getElementById('checkout-button');

  // Modal eliminar
  const deleteModal = document.getElementById('delete-modal');
  const deleteCancelBtn = document.getElementById('delete-cancel');
  const deleteConfirmBtn = document.getElementById('delete-confirm');

  // ----- Estado -----
  let cartItems = [];
  let deleteIndex = null;

  // ----- Helpers -----
  function formatPrice(value) {
    const n = Number(value || 0);
    return '$' + n.toLocaleString('es-CO');
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem('burgerCart');
      if (!raw) {
        cartItems = [];
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cartItems = parsed;
      } else {
        cartItems = [];
      }
    } catch (err) {
      console.error('[cart.js] Error leyendo burgerCart:', err);
      cartItems = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem('burgerCart', JSON.stringify(cartItems));
    } catch (err) {
      console.error('[cart.js] Error guardando burgerCart:', err);
    }
  }

  function getUnitPrice(item) {
    const total = Number(item.total || 0);
    const qty = Number(item.quantity || 1) || 1;
    return total / qty;
  }

  function computeSubtotal() {
    return cartItems.reduce(
      (acc, item) => acc + Number(item.total || 0),
      0
    );
  }

  function isDeliverySelected() {
    return shippingDelivery && shippingDelivery.checked;
  }

  function updateSummary() {
    if (!summarySubtotal || !summaryDelivery || !summaryTotal) return;

    const subtotal = computeSubtotal();
    const delivery = isDeliverySelected() && cartItems.length > 0 ? DELIVERY_FEE : 0;
    const total = subtotal + delivery;

    summarySubtotal.textContent = formatPrice(subtotal);
    summaryDelivery.textContent = formatPrice(delivery);
    summaryTotal.textContent = formatPrice(total);
  }

  function updateCheckoutButtonState() {
    if (!checkoutButton) return;
    const hasItems = cartItems && cartItems.length > 0;
    checkoutButton.disabled = !hasItems;
  }

  function showEmptyState() {
    if (cartEmptyMessage) cartEmptyMessage.classList.remove('hidden');
    if (orderSummarySection) orderSummarySection.classList.add('hidden');
    updateCheckoutButtonState();
  }

  function hideEmptyState() {
    if (cartEmptyMessage) cartEmptyMessage.classList.add('hidden');
    if (orderSummarySection) orderSummarySection.classList.remove('hidden');
    updateCheckoutButtonState();
  }

  function openDeleteModal(index) {
    deleteIndex = index;
    if (deleteModal) {
      deleteModal.classList.remove('hidden');
      deleteModal.classList.add('flex');
    }
  }

  function closeDeleteModal() {
    deleteIndex = null;
    if (deleteModal) {
      deleteModal.classList.add('hidden');
      deleteModal.classList.remove('flex');
    }
  }

  function handleQtyMinus(index) {
    const item = cartItems[index];
    if (!item) return;

    const qty = Number(item.quantity || 1);

    if (qty > 1) {
      const newQty = qty - 1;
      const unitPrice = getUnitPrice(item);

      item.quantity = newQty;
      item.total = unitPrice * newQty;

      saveCart();
      renderCart();
    } else {
      // qty == 1 → pedir confirmación para eliminar
      openDeleteModal(index);
    }
  }

  function handleQtyPlus(index) {
    const item = cartItems[index];
    if (!item) return;

    const qty = Number(item.quantity || 1);
    const newQty = qty + 1;
    const unitPrice = getUnitPrice(item);

    item.quantity = newQty;
    item.total = unitPrice * newQty;

    saveCart();
    renderCart();
  }

  function deleteItemConfirmed() {
    if (deleteIndex === null || deleteIndex === undefined) return;

    cartItems.splice(deleteIndex, 1);
    saveCart();
    closeDeleteModal();
    renderCart();
  }

  function renderCart() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (!cartItems || cartItems.length === 0) {
      showEmptyState();
      return;
    }

    hideEmptyState();

    cartItems.forEach((item, index) => {
      const unitPrice = getUnitPrice(item);
      const qty = Number(item.quantity || 1);
      const lineTotal = Number(item.total || 0);

      const wrapper = document.createElement('div');
      wrapper.className =
        'flex items-start gap-4 py-3 border-b border-black/5 dark:border-white/10';

      wrapper.innerHTML = `
        <div class="flex flex-1 items-start gap-4">
          <button
            class="delete-item-btn flex size-12 shrink-0 items-center justify-center rounded-lg bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60"
            data-index="${index}"
          >
            <span class="material-symbols-outlined">delete</span>
          </button>
          <div class="flex flex-col justify-center text-sm">
            <p class="font-medium text-black dark:text-white line-clamp-1">
              ${item.nombre || 'Producto'}
            </p>
            <p class="text-xs text-black/60 dark:text-white/60 mt-0.5">
              Precio unitario: ${formatPrice(unitPrice)}
            </p>
            ${
              Array.isArray(item.extras) && item.extras.length
                ? `<p class="text-xs text-black/70 dark:text-white/70 mt-0.5">
                     Adiciones: ${item.extras
                       .map(
                         (ex) =>
                           `${ex.nombre} (${formatPrice(ex.precio || 0)})`
                       )
                       .join(', ')}
                   </p>`
                : ''
            }
            ${
              Array.isArray(item.modifications) && item.modifications.length
                ? `<p class="text-xs text-black/70 dark:text-white/70 mt-0.5">
                     Personalización: ${item.modifications.join(', ')}
                   </p>`
                : ''
            }
            ${
              item.tipo === 1 || item.tipo === 3
                ? `<p class="text-xs text-black/70 dark:text-white/70 mt-0.5">
                     Término de cocción: ${
                       item.cooking === 'medio'
                         ? 'Medio hecha'
                         : item.cooking === 'bien_cocida'
                         ? 'Bien cocida'
                         : 'Normal'
                     }
                   </p>`
                : ''
            }
            <p class="text-xs text-black/80 dark:text-white/80 mt-1">
              Subtotal de este producto: <span class="font-semibold">${formatPrice(
                lineTotal
              )}</span>
            </p>
          </div>
        </div>
        <div class="shrink-0 flex flex-col items-center gap-2">
          <div class="flex items-center gap-3 text-black dark:text-white">
            <button
              class="qty-minus-btn flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-lg dark:bg-white/10"
              data-index="${index}"
            >
              -
            </button>
            <span class="w-5 text-center text-base font-medium">${qty}</span>
            <button
              class="qty-plus-btn flex h-8 w-8 items-center justify-center rounded-full bg-primary text-lg text-white"
              data-index="${index}"
            >
              +
            </button>
          </div>
        </div>
      `;

      cartItemsContainer.appendChild(wrapper);
    });

    // Enlazar eventos de eliminar
    const deleteButtons = cartItemsContainer.querySelectorAll('.delete-item-btn');
    deleteButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        if (!target || !target.getAttribute) return;
        const indexAttr = target.getAttribute('data-index');
        const index = Number(indexAttr);
        if (Number.isNaN(index)) return;
        openDeleteModal(index);
      });
    });

    // Enlazar eventos de cantidad
    const minusButtons = cartItemsContainer.querySelectorAll('.qty-minus-btn');
    minusButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        if (!target || !target.getAttribute) return;
        const indexAttr = target.getAttribute('data-index');
        const index = Number(indexAttr);
        if (Number.isNaN(index)) return;
        handleQtyMinus(index);
      });
    });

    const plusButtons = cartItemsContainer.querySelectorAll('.qty-plus-btn');
    plusButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        if (!target || !target.getAttribute) return;
        const indexAttr = target.getAttribute('data-index');
        const index = Number(indexAttr);
        if (Number.isNaN(index)) return;
        handleQtyPlus(index);
      });
    });

    updateSummary();
    updateCheckoutButtonState();
  }

  // ----- Eventos generales -----
  if (backButton) {
    backButton.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    });
  }

  if (addMoreItemsBtn) {
    addMoreItemsBtn.addEventListener('click', () => {
      window.location.href = '/';
    });
  }

  if (shippingDelivery) {
    shippingDelivery.addEventListener('change', () => {
      updateSummary();
    });
  }

  if (shippingPickup) {
    shippingPickup.addEventListener('change', () => {
      updateSummary();
    });
  }

  // Modal eliminar
  if (deleteCancelBtn) {
    deleteCancelBtn.addEventListener('click', () => {
      closeDeleteModal();
    });
  }

  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener('click', () => {
      deleteItemConfirmed();
    });
  }

  // Confirmar pedido → ir a /confirm
  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
      if (!cartItems || cartItems.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de confirmar el pedido.');
        return;
      }
      // confirm.html lee burgerCart desde localStorage
      window.location.href = '/confirm';
    });
  }

  // ----- init -----
  function init() {
    loadCart();
    renderCart();
  }

  init();
});
