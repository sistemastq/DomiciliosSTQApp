// public/cart.js

document.addEventListener('DOMContentLoaded', () => {
  const DELIVERY_FEE = 8000; // COP, ajusta si quieres

  // ---- Elementos DOM ----
  const backButton = document.getElementById('cart-back-button');
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyMessage = document.getElementById('cart-empty-message');
  const addMoreItemsBtn = document.getElementById('add-more-items-btn');

  const summarySection = document.getElementById('order-summary');
  const subtotalEl = document.getElementById('summary-subtotal');
  const deliveryEl = document.getElementById('summary-delivery');
  const totalEl = document.getElementById('summary-total');

  const shippingDeliveryInput = document.getElementById('shipping-delivery');
  const shippingPickupInput = document.getElementById('shipping-pickup');

  const checkoutButton = document.getElementById('checkout-button');

  // Modal de eliminación
  const deleteModal = document.getElementById('delete-modal');
  const deleteCancelBtn = document.getElementById('delete-cancel');
  const deleteConfirmBtn = document.getElementById('delete-confirm');

  // ---- Estado ----
  let cartItems = [];
  let shippingMode = 'domicilio'; // 'domicilio' | 'recoger'
  let pendingDeleteIndex = null;

  // ---- Helpers ----
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
        cartItems = parsed.map((item) => ({
          ...item,
          quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
        }));
      } else {
        cartItems = [];
      }
    } catch (err) {
      console.error('[cart.js] Error leyendo burgerCart:', err);
      cartItems = [];
    }
  }

  function saveCart() {
    localStorage.setItem('burgerCart', JSON.stringify(cartItems));
  }

  function computeLineTotals(item) {
    const base = Number(item.basePrice || 0);
    const extrasTotal = Array.isArray(item.extras)
      ? item.extras.reduce(
          (acc, ex) => acc + Number(ex.precio || 0),
          0
        )
      : 0;
    const unitTotal = base + extrasTotal;
    const qty = Number(item.quantity || 1);
    const lineTotal = unitTotal * qty;

    return {
      base,
      extrasTotal,
      unitTotal,
      lineTotal,
    };
  }

  function computeSubtotal() {
    return cartItems.reduce(
      (acc, item) => acc + computeLineTotals(item).lineTotal,
      0
    );
  }

  // ---- Modal de eliminación ----
  function openDeleteModal(index) {
    pendingDeleteIndex = index;
    if (!deleteModal) return;
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
  }

  function closeDeleteModal() {
    pendingDeleteIndex = null;
    if (!deleteModal) return;
    deleteModal.classList.add('hidden');
    deleteModal.classList.remove('flex');
  }

  if (deleteCancelBtn) {
    deleteCancelBtn.addEventListener('click', () => {
      closeDeleteModal();
    });
  }

  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener('click', () => {
      if (pendingDeleteIndex !== null) {
        removeItem(pendingDeleteIndex);
      }
      closeDeleteModal();
    });
  }

  // ---- Render de lista de productos ----
  function renderCartItems() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (!cartItems.length) {
      if (emptyMessage) emptyMessage.classList.remove('hidden');
      if (summarySection) summarySection.classList.add('opacity-50');
      if (checkoutButton) {
        checkoutButton.disabled = true;
      }
      return;
    }

    if (emptyMessage) emptyMessage.classList.add('hidden');
    if (summarySection) summarySection.classList.remove('opacity-50');
    if (checkoutButton) {
      checkoutButton.disabled = false;
    }

    cartItems.forEach((item, index) => {
      const { unitTotal, lineTotal } = computeLineTotals(item);

      const row = document.createElement('div');
      row.className =
        'flex gap-4 py-3 border-b border-black/5 dark:border-white/10';

      // Columna izquierda: borrar + text
      const leftCol = document.createElement('div');
      leftCol.className = 'flex flex-1 items-start gap-4';

      const deleteBtn = document.createElement('button');
      deleteBtn.className =
        'flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/5 text-black/60 dark:bg:white/10 dark:text-white/60';
      deleteBtn.innerHTML =
        '<span class="material-symbols-outlined">delete</span>';
      deleteBtn.addEventListener('click', () => {
        openDeleteModal(index);
      });

      const textCol = document.createElement('div');
      textCol.className = 'flex flex-col justify-center text-sm';

      const nameP = document.createElement('p');
      nameP.className =
        'font-medium text-black line-clamp-1 dark:text-white';
      nameP.textContent = item.nombre || 'Producto';

      const priceLine = document.createElement('p');
      priceLine.className =
        'text-xs md:text-sm font-normal text-black/70 dark:text-white/70';
      priceLine.textContent = `Unitario: ${formatPrice(
        unitTotal
      )}  ·  x${item.quantity} = ${formatPrice(lineTotal)}`;

      textCol.appendChild(nameP);
      textCol.appendChild(priceLine);

      // Extras
      if (Array.isArray(item.extras) && item.extras.length > 0) {
        const extrasP = document.createElement('p');
        extrasP.className =
          'mt-1 text-xs text-black/70 dark:text-white/70';
        const extrasText = item.extras
          .map(
            (ex) =>
              `${ex.nombre} (${formatPrice(ex.precio || 0)})`
          )
          .join(', ');
        extrasP.textContent = `Adiciones: ${extrasText}`;
        textCol.appendChild(extrasP);
      }

      // Modificaciones
      if (Array.isArray(item.modifications) && item.modifications.length) {
        const modsP = document.createElement('p');
        modsP.className =
          'mt-1 text-xs text-black/70 dark:text-white/70';
        modsP.textContent = `Modificaciones: ${item.modifications.join(
          ', '
        )}`;
        textCol.appendChild(modsP);
      }

      // Término de carne
      if (item.tipo === 1 || item.tipo === 3) {
        const cookP = document.createElement('p');
        cookP.className =
          'mt-1 text-xs text-black/70 dark:text-white/70';
        let termLabel = 'Normal';
        if (item.cooking === 'medio') termLabel = 'Medio hecha';
        else if (item.cooking === 'bien_cocida') termLabel = 'Bien cocida';
        cookP.textContent = `Término: ${termLabel}`;
        textCol.appendChild(cookP);
      }

      leftCol.appendChild(deleteBtn);
      leftCol.appendChild(textCol);

      // Columna derecha: cantidad
      const rightCol = document.createElement('div');
      rightCol.className = 'shrink-0 flex items-center';

      const qtyWrapper = document.createElement('div');
      qtyWrapper.className =
        'flex items-center gap-3 text-black dark:text-white';

      const minusBtn = document.createElement('button');
      minusBtn.className =
        'flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-lg dark:bg-white/10';
      minusBtn.innerHTML =
        '<span class="material-symbols-outlined">remove</span>';
      minusBtn.addEventListener('click', () => {
        if (item.quantity > 1) {
          updateQuantity(index, item.quantity - 1);
        } else {
          // cantidad == 1, preguntar antes de eliminar
          openDeleteModal(index);
        }
      });

      const qtySpan = document.createElement('span');
      qtySpan.className = 'w-4 text-center text-base font-medium';
      qtySpan.textContent = String(item.quantity);

      const plusBtn = document.createElement('button');
      plusBtn.className =
        'flex h-8 w-8 items-center justify-center rounded-full bg-primary text-lg text-white';
      plusBtn.innerHTML =
        '<span class="material-symbols-outlined">add</span>';
      plusBtn.addEventListener('click', () => {
        updateQuantity(index, item.quantity + 1);
      });

      qtyWrapper.appendChild(minusBtn);
      qtyWrapper.appendChild(qtySpan);
      qtyWrapper.appendChild(plusBtn);

      rightCol.appendChild(qtyWrapper);

      row.appendChild(leftCol);
      row.appendChild(rightCol);

      cartItemsContainer.appendChild(row);
    });
  }

  // ---- Render resumen ----
  function renderSummary() {
    if (!subtotalEl || !deliveryEl || !totalEl) return;

    const subtotal = computeSubtotal();
    const deliveryFee =
      shippingMode === 'domicilio' && cartItems.length ? DELIVERY_FEE : 0;
    const total = subtotal + deliveryFee;

    subtotalEl.textContent = formatPrice(subtotal);
    deliveryEl.textContent = formatPrice(deliveryFee);
    totalEl.textContent = formatPrice(total);
  }

  // ---- Mutaciones ----
  function updateQuantity(index, newQty) {
    if (index < 0 || index >= cartItems.length) return;
    const safeQty = Math.max(1, Math.min(99, newQty));
    cartItems[index].quantity = safeQty;
    saveCart();
    renderCartItems();
    renderSummary();
  }

  function removeItem(index) {
    if (index < 0 || index >= cartItems.length) return;
    cartItems.splice(index, 1);
    saveCart();
    renderCartItems();
    renderSummary();
  }

  // ---- Eventos globales ----
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

  if (shippingDeliveryInput) {
    shippingDeliveryInput.addEventListener('change', () => {
      if (shippingDeliveryInput.checked) {
        shippingMode = 'domicilio';
        renderSummary();
      }
    });
  }

  if (shippingPickupInput) {
    shippingPickupInput.addEventListener('change', () => {
      if (shippingPickupInput.checked) {
        shippingMode = 'recoger';
        renderSummary();
      }
    });
  }

  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
      if (!cartItems.length) return;
      const subtotal = computeSubtotal();
      const deliveryFee =
        shippingMode === 'domicilio' && cartItems.length ? DELIVERY_FEE : 0;
      const total = subtotal + deliveryFee;

      console.log('[Checkout] carrito:', {
        cartItems,
        shippingMode,
        subtotal,
        deliveryFee,
        total,
      });

      alert(
        `Pedido listo para enviar.\n\nSubtotal: ${formatPrice(
          subtotal
        )}\nDomicilio: ${formatPrice(
          deliveryFee
        )}\nTotal: ${formatPrice(total)}`
      );
    });
  }

  // ---- init ----
  function init() {
    loadCart();
    renderCartItems();
    renderSummary();
  }

  init();
});
