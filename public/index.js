document.addEventListener('DOMContentLoaded', () => {
  // =============================
  // HEADER: botones usuario / carrito
  // =============================
  const userButton = document.getElementById('user-icon');
  const cartButton = document.getElementById('cart-icon');
  const menuIcon = document.getElementById('menu-icon');
  const menu = document.getElementById('menu');
  const overlay = document.getElementById('overlay');
  const cartCount = document.getElementById('cart-count');
  const logoutLink = document.getElementById('logout-link');
  const closeMenuButton = document.getElementById('close-menu');

  // Función para abrir y cerrar el menú
  function toggleMenu() {
    menu.classList.toggle('open');
    overlay.classList.toggle('active');
  }

  // Función para cerrar el menú cuando se hace clic fuera de él
  function closeMenuOnClickOutside(event) {
    if (menu.classList.contains('open') && !menu.contains(event.target) && !menuIcon.contains(event.target)) {
      toggleMenu();
    }
  }

  // Función para actualizar el contador del carrito
  function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('burgerCart')) || [];
    cartCount.textContent = cartItems.length;
  }

  // Función para mostrar u ocultar el enlace de cerrar sesión
  function toggleLogoutLink() {
    const userData = JSON.parse(localStorage.getItem('burgerUser'));
    if (userData) {
      logoutLink.style.display = 'block';
    } else {
      logoutLink.style.display = 'none';
    }
  }

  // Event listeners
  menuIcon.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', toggleMenu);
  closeMenuButton.addEventListener('click', toggleMenu);
  document.addEventListener('click', closeMenuOnClickOutside);
  cartButton.addEventListener('click', () => {
    window.location.href = '/cart';
  });

  if (userButton) {
    userButton.addEventListener('click', () => {
      // Por ahora siempre va a login
      window.location.href = '/login';
    });
  }

  if (cartButton) {
    cartButton.addEventListener('click', () => {
      try {
        const raw = localStorage.getItem('burgerCart');
        if (!raw) {
          alert('Tu carrito está vacío. Agrega un producto desde el menú.');
          return;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          alert('Tu carrito está vacío. Agrega un producto desde el menú.');
          return;
        }
        window.location.href = '/cart';
      } catch (err) {
        console.error('[index.js] Error leyendo carrito:', err);
        alert(
          'Hubo un problema leyendo tu carrito. Intenta agregar un producto de nuevo.'
        );
      }
    });
  }

  // =============================
  // CARRUSEL DE IMÁGENES HERO
  // =============================
  const heroImages = [
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASEb-HyXI6AJNvlivFv0Qp7nWz0FsGB4PuFIgOa46zbaQ2yZXx8x9piDRUnfXOZuee2ni2gf1RvTerVysshQ4ZQPusSy2H4zr-dNwTI-UYaS8hnsPq38o3uId47Lf_jQmHQLe0SZ3SMaadkC29NjD0_zp-Ui8wMCDwHqiJ7o7uqbJRWnKtFB7pgWwHJGm5kEA9n4LPu9ru_1fs6jtwgA6jupWr9PuzC070KqTxw6CIdmZ5XqSIofKuRx2nrvKW7pkk7BMvhZvqamo',
      alt: 'Hamburguesa clásica',
    },
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCIJdajBCiOGKvR6jQFEAA5D8TeOdEQz-KCoWOZvboPDAvf-mSb8_DGtiJKTjvxzFDBoRsyqMOcWIUaOrVLHn5JK07YHXo6Zpw1umMVCb8B2E4ol66ZDg_97kUjAsG_0CImrHnppTvtEDhdSMj4OUiBFP1lz-zLWiodNhrkAFgtiaK1qbEUQ7sycUIgYoU2T-rKeHg1bVgy808NyTZf2oyS_qHH66lXfJPaKvEBowgcRDaEhWWb_P53HapQMDtzyUU3XLNgGwsOME',
      alt: 'Hamburguesa crispy',
    },
    {
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlDqWB6Fwl4shFIrDQwpKwhJejim4QrnPrqqOVGFp75VMzQ6m5-Dw_wxRHpw96gxRSMuSyrsBE37Yy9RAEvSsj8XpSzn583CniqYPOOaCMoZiyt_vWrOpBuxOm084mO7tWyQY_D03FZTwDefpfTjvpYXzxjsH9u6c45UsK9dlZDHF4hIo-RLspFLhJCqujRKn9n5TtBKGlbWZAJEkUgeGBGbaRo1H_BSORim6r_A0_pgbAOH_4H_j9K4K5EjYAga_elG1EQY-t9v8',
      alt: 'Hamburguesa gourmet',
    },
  ];

  const heroCarousel = document.getElementById('hero-carousel');
  const heroDots = document.getElementById('hero-dots');
  const heroPrev = document.getElementById('hero-prev');
  const heroNext = document.getElementById('hero-next');

  let currentSlide = 0;
  let heroInterval;

  // Modal elementos
  const modal = document.getElementById('image-modal');
  const modalBackdrop = modal?.querySelector('.modal-backdrop');
  const modalClose = modal?.querySelector('.modal-close');
  const modalImage = document.getElementById('modal-image');
  const modalCaption = document.getElementById('modal-caption');

  function openModal(url, alt) {
    if (!modal || !modalImage || !modalCaption) return;
    modalImage.src = url;
    modalImage.alt = alt;
    modalCaption.textContent = alt;
    modal.classList.add('open');
    modal.classList.remove('hidden');
  }

  function closeModal() {
    if (!modal || !modalImage) return;
    modal.classList.remove('open');
    modal.classList.add('hidden');
    modalImage.src = '';
    modalImage.alt = '';
    modalImage.classList.remove('zoomed');
  }

  function renderHeroSlides() {
    if (!heroCarousel || !heroDots) return;

    heroCarousel.innerHTML = '';
    heroDots.innerHTML = '';

    heroImages.forEach((img, index) => {
      const slide = document.createElement('div');
      slide.className =
        'absolute inset-0 bg-center bg-cover transition-opacity duration-700 cursor-zoom-in';
      slide.style.backgroundImage = `url('${img.url}')`;
      slide.style.opacity = index === 0 ? '1' : '0';
      slide.dataset.index = index.toString();
      slide.setAttribute('aria-label', img.alt);

      slide.addEventListener('click', () => openModal(img.url, img.alt));

      heroCarousel.appendChild(slide);

      const dot = document.createElement('button');
      dot.className =
        'w-2.5 h-2.5 rounded-full bg-white/40 hover:bg-white focus:outline-none';
      dot.dataset.index = index.toString();
      dot.addEventListener('click', () => {
        goToSlide(index);
        restartAutoSlide();
      });
      heroDots.appendChild(dot);
    });

    updateDots();
  }

  function goToSlide(index) {
    if (!heroCarousel) return;
    const slides = heroCarousel.querySelectorAll('div');
    slides.forEach((slide, i) => {
      slide.style.opacity = i === index ? '1' : '0';
    });
    currentSlide = index;
    updateDots();
  }

  function updateDots() {
    if (!heroDots) return;
    const dots = heroDots.querySelectorAll('button');
    dots.forEach((dot, i) => {
      dot.className =
        'w-2.5 h-2.5 rounded-full transition-colors ' +
        (i === currentSlide ? 'bg-white' : 'bg-white/40');
    });
  }

  function startHeroAutoSlide() {
    if (heroInterval) {
      window.clearInterval(heroInterval);
    }
    heroInterval = window.setInterval(() => {
      const next = (currentSlide + 1) % heroImages.length;
      goToSlide(next);
    }, 5000);
  }

  function restartAutoSlide() {
    startHeroAutoSlide();
  }

  heroPrev?.addEventListener('click', () => {
    const prev = (currentSlide - 1 + heroImages.length) % heroImages.length;
    goToSlide(prev);
    restartAutoSlide();
  });

  heroNext?.addEventListener('click', () => {
    const next = (currentSlide + 1) % heroImages.length;
    goToSlide(next);
    restartAutoSlide();
  });

  modalClose?.addEventListener('click', () => {
    closeModal();
  });

  modalBackdrop?.addEventListener('click', () => {
    if (window.innerWidth >= 1024) {
      closeModal();
    }
  });

  modalImage?.addEventListener('click', () => {
    modalImage.classList.toggle('zoomed');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  renderHeroSlides();
  startHeroAutoSlide();

  // =============================
  // PRODUCTOS DESDE SUPABASE
  // =============================
  const zonaPrecio = 'PrecioOriente'; // puedes cambiar según la zona que uses
  const productsContainer = document.getElementById('products-container');
  const tabButtons = document.querySelectorAll('.tab-btn');

  async function fetchMenu(tipo) {
    const url = typeof tipo === 'number' ? `/api/menu?tipo=${tipo}` : '/api/menu';
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Error al cargar menú', res.status);
      if (productsContainer) {
        productsContainer.innerHTML =
          '<p class="text-center text-sm text-red-500 mt-4">Error al cargar el menú. Intenta de nuevo.</p>';
      }
      return [];
    }
    return await res.json();
  }

  function renderProducts(products) {
    if (!productsContainer) return;

    productsContainer.innerHTML = '';

    if (!products || products.length === 0) {
      productsContainer.innerHTML =
        '<p class="text-center text-sm text-gray-500 mt-4">No hay productos disponibles en esta categoría.</p>';
      return;
    }

    products.forEach((item) => {
      const price = item[zonaPrecio] ?? 0;

      const card = document.createElement('div');
      card.className =
        'product-card flex h-full flex-col gap-4 rounded-xl bg-white dark:bg-black/20 shadow-md';

      card.innerHTML = `
        <div
          class="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-t-xl flex flex-col"
          style="background-image: url('${item.imagen || ''}');"
        ></div>
        <div class="flex flex-col flex-1 justify-between p-4 pt-0 gap-4">
          <div>
            <p class="text-black dark:text-white text-base md:text-lg font-semibold leading-normal">
              ${item.Nombre}
            </p>
            <p class="text-gray-600 dark:text-gray-400 text-xs md:text-sm leading-normal mb-1 line-clamp-2">
              ${item.Descripcion}
            </p>
            <p class="text-gray-800 dark:text-gray-200 text-sm md:text-base font-semibold leading-normal">
              $${Number(price).toLocaleString('es-CO')}
            </p>
          </div>
          <button
            class="product-go-detail flex min-w-[110px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-4 bg-primary text-white text-sm md:text-base font-bold leading-normal tracking-[0.015em]"
          >
            <span class="truncate">Agregar al carrito</span>
          </button>
        </div>
      `;

      // Ir al detalle de producto al hacer clic en el botón
      const detailBtn = card.querySelector('.product-go-detail');
      if (detailBtn) {
        detailBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.location.href = `/product?id=${item.id}`;
        });
      }

      productsContainer.appendChild(card);
    });
  }

  async function loadCategory(tipo) {
    const products = await fetchMenu(tipo);
    renderProducts(products);
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('tab-btn--active'));
      btn.classList.add('tab-btn--active');

      const tipoAttr = btn.dataset.tipo;
      const tipo = tipoAttr ? Number(tipoAttr) : undefined;
      loadCategory(tipo);
    });
  });

  // cargar hamburguesas por defecto
  loadCategory(1);

  // Inicialización
  updateCartCount();
  toggleLogoutLink();
}); 