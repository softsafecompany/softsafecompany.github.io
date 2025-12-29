import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, addDoc, query, orderBy, getDocs, where, runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- CONFIGURAÇÃO DO FIREBASE ---
// SUBSTITUA COM SUAS CREDENCIAIS REAIS DO CONSOLE DO FIREBASE
// O erro "auth/api-key-not-valid" ocorre porque estas chaves abaixo são exemplos.
const firebaseConfig = {
  apiKey: "AIzaSyBZtT7r-2m_4IXj_e3xXc0H5-zJS2G4FQ0",
  authDomain: "softsafe-company.firebaseapp.com",
  databaseURL: "https://softsafe-company-default-rtdb.firebaseio.com",
  projectId: "softsafe-company",
  storageBucket: "softsafe-company.firebasestorage.app",
  messagingSenderId: "660443243088",
  appId: "1:660443243088:web:8a2ad56dcea7c95cdd2755",
  measurementId: "G-HCTSMFD4N9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("firebase inicializado");
const auth = getAuth(app);

let currentUser = null;
let unsubscribeComments = null; // To manage real-time listener

document.addEventListener("DOMContentLoaded", () => {
  const productList = document.getElementById("product-list");
  const modal = document.getElementById("product-modal");
  const closeBtn = document.querySelector(".close");
  const searchBar = document.getElementById("search-bar");
  const searchButton = document.getElementById("search-button");
  const searchContainer = document.querySelector(".search-container");
  const productCountElem = document.getElementById("product-count");
  const carouselInner = document.getElementById("carousel-inner");
  const carouselContainer = document.getElementById("modal-carousel");
  const btnPrev = document.getElementById("carousel-prev");
  const btnNext = document.getElementById("carousel-next");
  const carouselDots = document.getElementById("carousel-dots");
  const zoomModal = document.getElementById("zoom-modal");
  const zoomImg = document.getElementById("zoom-img");
  const closeZoom = document.querySelector(".close-zoom");
  const zoomSpinner = document.getElementById("zoom-spinner");
  const themeToggleBtn = document.getElementById("theme-toggle");
  const suggestionsContainer = document.getElementById("suggestions-container");
  const resetZoomBtn = document.getElementById("reset-zoom");
  const progressBar = document.getElementById("progress-bar");
  const sobreSection = document.getElementById("sobre");
  const backToTopBtn = document.getElementById("back-to-top");
  const welcomeModal = document.getElementById("welcome-modal");
  const closeWelcomeBtn = document.querySelector(".close-welcome");
  const acceptWelcomeBtn = document.getElementById("accept-welcome");
  const burgerMenu = document.getElementById("burger-menu");
  const navMenu = document.getElementById("nav-menu");
  const menuOverlay = document.getElementById("menu-overlay");
  const scrollIndicator = document.getElementById("scroll-indicator");
  const newsList = document.getElementById("news-list");
  const newsModal = document.getElementById("news-modal");
  const closeNewsBtn = document.querySelector(".close-news");
  const newsCarousel = document.getElementById("news-carousel");
  const newsCarouselInner = document.getElementById("news-carousel-inner");
  const newsPrev = document.getElementById("news-carousel-prev");
  const newsNext = document.getElementById("news-carousel-next");
  const newsDots = document.getElementById("news-carousel-dots");
  const newsSearchInput = document.getElementById("news-search-input");
  const newsSearchBtn = document.getElementById("news-search-btn");
  const contactModal = document.getElementById("contact-modal");
  const closeContactBtn = document.querySelector(".close-contact");
  const contactForm = document.getElementById("contact-form");
  const stars = document.querySelectorAll('.star');
  const ratingCountElem = document.getElementById('rating-count');
  const privacyModal = document.getElementById("privacy-modal");

  // --- Custom Alert & Prompt System ---
  // Injeta o HTML do modal de alerta no corpo da página
  const customDialogHTML = `
    <div id="custom-dialog-overlay" class="custom-dialog-overlay">
      <div class="custom-dialog-box">
        <h3 id="custom-dialog-title">Aviso</h3>
        <p id="custom-dialog-message"></p>
        <div id="custom-dialog-input-container" style="display:none;">
          <input type="text" id="custom-dialog-input" class="custom-dialog-input">
        </div>
        <div class="custom-dialog-actions">
          <button id="custom-dialog-cancel" class="dialog-btn cancel-btn" style="display:none;">Cancelar</button>
          <button id="custom-dialog-ok" class="dialog-btn ok-btn">OK</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', customDialogHTML);

  const dialogOverlay = document.getElementById('custom-dialog-overlay');
  const dialogTitle = document.getElementById('custom-dialog-title');
  const dialogMessage = document.getElementById('custom-dialog-message');
  const dialogInputContainer = document.getElementById('custom-dialog-input-container');
  const dialogInput = document.getElementById('custom-dialog-input');
  const dialogOk = document.getElementById('custom-dialog-ok');
  const dialogCancel = document.getElementById('custom-dialog-cancel');

  window.customAlert = function (message, title = "Aviso") {
    return new Promise((resolve) => {
      dialogTitle.textContent = title;
      dialogMessage.textContent = message;
      dialogInputContainer.style.display = 'none';
      dialogCancel.style.display = 'none';
      dialogOverlay.classList.add('active');

      dialogOk.onclick = () => {
        dialogOverlay.classList.remove('active');
        resolve(true);
      };
    });
  };

  window.customPrompt = function (message, title = "Entrada") {
    return new Promise((resolve) => {
      dialogTitle.textContent = title;
      dialogMessage.textContent = message;
      dialogInputContainer.style.display = 'block';
      dialogInput.value = '';
      dialogCancel.style.display = 'inline-block';
      dialogOverlay.classList.add('active');
      dialogInput.focus();

      const close = (val) => {
        dialogOverlay.classList.remove('active');
        resolve(val);
      };

      dialogOk.onclick = () => close(dialogInput.value);
      dialogCancel.onclick = () => close(null);

      // Permitir Enter para confirmar
      dialogInput.onkeyup = (e) => {
        if (e.key === 'Enter') close(dialogInput.value);
      };
    });
  };

  // --- Toast Notification Logic ---
  function showToast(message, type = 'info') {
    let toast = document.getElementById("toast-notification");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast-notification";
      toast.className = "toast-notification";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = "toast-notification show";
    if (type === 'error') toast.classList.add("error");
    else if (type === 'success') toast.classList.add("success");

    setTimeout(() => {
      toast.className = toast.className.replace("show", "");
    }, 3000);
  }

  window.addEventListener('offline', () => {
    showToast("Você está offline. Algumas funcionalidades podem estar limitadas.", "error");
  });

  window.addEventListener('online', () => {
    showToast("Conexão restabelecida!", "success");
  });

  // Autenticação Anônima (Movido para dentro do DOMContentLoaded para usar o showToast)
  signInAnonymously(auth).catch((error) => {
    console.error("Erro Auth:", error);
    if (error.code === 'auth/configuration-not-found') {
      showToast("Configuração pendente: Ative a Autenticação Anônima no Firebase Console.", "error");
    } else {
      showToast("Erro ao conectar com o servidor.", "error");
    }
  });

  // --- Contact Modal Logic ---
  // Intercept links to #contato
  document.querySelectorAll('a[href="#contato"]').forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (contactModal) contactModal.style.display = "block";
      // Close mobile menu if open
      if (navMenu && navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
        if (menuOverlay) menuOverlay.classList.remove("active");
      }
    });
  });

  if (closeContactBtn) {
    closeContactBtn.addEventListener("click", () => {
      if (contactModal) closeModalWithFade(contactModal);
    });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("contact-name").value;
      const email = document.getElementById("contact-email").value;
      const message = document.getElementById("contact-message").value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        customAlert("Por favor, insira um endereço de email válido.", "Erro");
        return;
      }

      addDoc(collection(db, "messages"), {
        name, email, message, date: new Date().toISOString()
      }).then(() => {
        customAlert("Mensagem enviada com sucesso!", "Sucesso");
        contactForm.reset();
        closeModalWithFade(contactModal);
      }).catch((err) => {
        console.error(err);
        customAlert("Erro ao enviar mensagem.", "Erro");
      });
    });
  }

  // --- Lógica de Tema com Firebase ---
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      // Carregar tema salvo
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().theme === 'dark') {
          document.body.classList.add("dark-mode");
          if (themeToggleBtn) themeToggleBtn.textContent = "☀️";
        }
      });
    }
  });

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      themeToggleBtn.textContent = isDark ? "☀️" : "🌙";

      if (currentUser) {
        setDoc(doc(db, "users", currentUser.uid), { theme: isDark ? 'dark' : 'light' }, { merge: true });
      }
    });
  }

  // Burger Menu Logic
  if (burgerMenu && navMenu) {
    burgerMenu.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      document.body.classList.toggle("menu-open");
      if (menuOverlay) menuOverlay.classList.toggle("active");
    });

    // Close menu when clicking a link
    navMenu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
        if (menuOverlay) menuOverlay.classList.remove("active");
      });
    });

    // Close menu when clicking overlay
    if (menuOverlay) {
      menuOverlay.addEventListener("click", () => {
        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
        menuOverlay.classList.remove("active");
      });
    }
  }

  // Close burger menu on resize
  window.addEventListener("resize", () => {
    if (window.innerWidth > 620 && navMenu && navMenu.classList.contains("active")) {
      navMenu.classList.remove("active");
      document.body.classList.remove("menu-open");
      if (menuOverlay) menuOverlay.classList.remove("active");
    }
  });

  // Swipe to close menu (Mobile)
  let menuTouchStartX = 0;
  let menuTouchEndX = 0;

  document.addEventListener('touchstart', (e) => {
    if (navMenu && navMenu.classList.contains('active')) {
      menuTouchStartX = e.changedTouches[0].screenX;
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (navMenu && navMenu.classList.contains('active')) {
      menuTouchEndX = e.changedTouches[0].screenX;
      if (menuTouchEndX > menuTouchStartX + 50) { // Swipe Right to close
        navMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
        if (menuOverlay) menuOverlay.classList.remove("active");
      }
    }
  });

  // Parallax Effect for Hero
  const heroSection = document.querySelector(".hero");
  if (heroSection) {
    window.addEventListener("scroll", () => {
      const scrolled = window.scrollY;
      window.requestAnimationFrame(() => {
        heroSection.style.backgroundPositionY = `${scrolled * 0.5}px`;
      });
    });
  }

  // Typewriter Effect for Hero Title
  const heroTitle = document.querySelector(".hero h2");
  if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.textContent = "";

    const cursor = document.createElement("span");
    cursor.className = "typewriter-cursor";
    heroTitle.appendChild(cursor);

    let i = 0;
    function typeWriter() {
      if (i < text.length) {
        heroTitle.insertBefore(document.createTextNode(text.charAt(i)), cursor);
        i++;
        setTimeout(typeWriter, 150); // Velocidade da digitação
      }
    }
    setTimeout(typeWriter, 500); // Atraso inicial
  }

  // Scroll Indicator Logic
  if (scrollIndicator) {
    scrollIndicator.addEventListener("click", () => {
      const nextSection = document.getElementById("produtos");
      if (nextSection) nextSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Active Section Indicator
  const sections = document.querySelectorAll("section[id], footer[id]");
  const navLinks = document.querySelectorAll("#nav-menu a");

  function highlightNav() {
    let scrollY = window.scrollY;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 150;
      const sectionId = current.getAttribute("id");

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("href").includes(sectionId)) {
            link.classList.add("active");
          }
        });
      }
    });
  }

  window.addEventListener("scroll", highlightNav);

  // WhatsApp Shake Logic
  const whatsappBtn = document.querySelector(".whatsapp-float");
  if (whatsappBtn) {
    setInterval(() => {
      whatsappBtn.classList.add("shake-anim");
      setTimeout(() => {
        whatsappBtn.classList.remove("shake-anim");
      }, 1000);
    }, 30000);
  }

  // Confetti Logic
  function triggerConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti');
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
      document.body.appendChild(confetti);

      setTimeout(() => {
        confetti.remove();
      }, 5000);
    }
  }

  // Share Elements
  const shareModal = document.getElementById("share-modal");
  const closeShareBtn = document.querySelector(".close-share");
  const shareWhatsapp = document.getElementById("share-whatsapp");
  const shareFacebook = document.getElementById("share-facebook");
  const shareInstagram = document.getElementById("share-instagram");
  const shareX = document.getElementById("share-x");
  const shareCopy = document.getElementById("share-copy");

  let allProducts = [];
  let currentFilteredProducts = [];
  const ITEMS_PER_PAGE = 6;
  let currentPage = 1;
  let currentCarouselIndex = 0;
  let currentOpenProductId = null;
  let currentMedia = [];

  // Product Logic (Only if productList exists)
  function showSkeleton() {
    if (!productList) return;
    productList.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const skeletonHTML = `
          <div class="produto skeleton skeleton-anim">
            <div style="width: 100%; height: 150px; background-color: #ccc; margin-bottom: 10px; border-radius: 4px;"></div>
            <div style="width: 80%; height: 20px; background-color: #ccc; margin-bottom: 10px; border-radius: 4px;"></div>
            <div style="width: 100px; height: 35px; background-color: #ccc; border-radius: 4px;"></div>
          </div>
        `;
      productList.innerHTML += skeletonHTML;
    }
  }

  let paginationContainer;
  if (productList) {
    // Create Pagination Container
    paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-container";
    productList.parentNode.insertBefore(paginationContainer, productList.nextSibling);

    // Event Delegation for View More
    productList.addEventListener("click", (e) => {
      if (e.target.classList.contains("view-more-btn")) {
        const productId = parseInt(e.target.getAttribute("data-id"));
        const product = allProducts.find(p => p.id === productId);
        openModal(product);
      }
    });
  }

  function renderBatch() {
    if (!productList) return;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = currentPage * ITEMS_PER_PAGE;
    const productsToRender = currentFilteredProducts.slice(start, end);

    productList.innerHTML = "";
    let productsHTML = "";
    productsToRender.forEach((product, index) => {
      const productDate = new Date(product.date);
      const now = new Date();
      const diffTime = now - productDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const isNew = !isNaN(diffDays) && diffDays >= 0 && diffDays <= 30;

      const productCard = `
          <div class="produto fade-in" style="animation-delay: ${index * 0.1}s">
            ${isNew ? '<span class="new-badge">Novo</span>' : ''}
            <img src="${product.image}" alt="${product.name}">
            <h4>${product.name}</h4>
            <div class="product-views" id="product-views-${product.id}">
               👁️ <span class="view-count">0</span> visualizações
            </div>
            <button class="view-more-btn" data-id="${product.id}">Ver Mais</button>
          </div>
        `;
      productsHTML += productCard;
    });
    productList.innerHTML = productsHTML;

    productsToRender.forEach((product) => {
      // Ouvir atualizações de visualizações em tempo real
      onSnapshot(doc(db, "products", String(product.id)), (doc) => {
        if (doc.exists()) {
          const countElem = document.querySelector(`#product-views-${product.id} .view-count`);
          if (countElem) countElem.textContent = doc.data().clicks || 0;
        }
      }, (error) => {
        console.warn(`Permissão negada (Views): ${error.code}`);
      });
    });

    renderPaginationControls();
    updateCounter();
  }

  function renderPaginationControls() {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(currentFilteredProducts.length / ITEMS_PER_PAGE);

    if (totalPages <= 1) return;

    const createBtn = (text, page, active = false, disabled = false) => {
      const btn = document.createElement("button");
      btn.textContent = text;
      if (active) btn.classList.add("active");
      if (disabled) btn.disabled = true;
      btn.onclick = () => {
        if (page !== currentPage && !disabled) {
          currentPage = page;
          renderBatch();
          document.getElementById("produtos").scrollIntoView({ behavior: "smooth" });
        }
      };
      return btn;
    };

    paginationContainer.appendChild(createBtn("<", currentPage - 1, false, currentPage === 1));
    for (let i = 1; i <= totalPages; i++) {
      paginationContainer.appendChild(createBtn(i, i, i === currentPage));
    }
    paginationContainer.appendChild(createBtn(">", currentPage + 1, false, currentPage === totalPages));
  }

  function updateCounter() {
    const visibleCount = Math.min(currentPage * ITEMS_PER_PAGE, currentFilteredProducts.length);
    productCountElem.textContent = `Exibindo ${visibleCount} de ${currentFilteredProducts.length} produtos`;
  }

  function renderProducts(products) {
    if (!productList) return;
    productList.innerHTML = "";
    currentFilteredProducts = products;
    currentPage = 1;

    if (products.length === 0) {
      productList.innerHTML = '<p class="no-results" style="width: 100%; text-align: center; padding: 20px;">Nenhum produto encontrado.</p>';
      if (paginationContainer) paginationContainer.innerHTML = "";
      productCountElem.textContent = "";
      return;
    }
    renderBatch();
  }

  // Fetch product data with Cache
  showSkeleton();
  const CACHE_KEY = "softsafe_products_cache";
  const CACHE_DURATION = 3600000; // 1 hour

  const cachedData = localStorage.getItem(CACHE_KEY);
  const now = new Date().getTime();

  if (cachedData) {
    const { timestamp, data } = JSON.parse(cachedData);
    if (now - timestamp < CACHE_DURATION) {
      allProducts = data;
      renderProducts(allProducts);
    } else {
      fetchData();
    }
  } else {
    fetchData();
  }

  function fetchData() {
    fetch("content.json")
      .then(response => response.json())
      .then(data => {
        // Ordenar por data (mais recente primeiro)
        data.sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateB - dateA;
        });

        allProducts = data;
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: new Date().getTime(),
          data: data
        }));
        renderProducts(allProducts);
      });
  }

  // News Logic
  let allNews = [];
  let currentNewsPage = 1;
  let filteredNews = [];
  const NEWS_PER_PAGE = 3;
  let loadMoreNewsBtn;
  const commentSortPrefs = {};

  if (newsList) {
    // Create Load More Button for News
    loadMoreNewsBtn = document.createElement("button");
    loadMoreNewsBtn.textContent = "Carregar Mais";
    loadMoreNewsBtn.className = "load-more-btn";
    newsList.parentNode.insertBefore(loadMoreNewsBtn, newsList.nextSibling);

    loadMoreNewsBtn.addEventListener("click", () => {
      currentNewsPage++;
      renderNewsBatch();
    });

    fetch("news.json")
      .then(res => res.json())
      .then(data => {
        allNews = data;
        filteredNews = data;
        renderNewsBatch();
      });

    // News Search Logic
    if (newsSearchInput) {
      newsSearchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        filteredNews = allNews.filter(n =>
          n.title.toLowerCase().includes(term) ||
          n.text.toLowerCase().includes(term) ||
          (n.extra_text && n.extra_text.toLowerCase().includes(term))
        );
        currentNewsPage = 1;
        renderNewsBatch();
      });
    }

    if (newsSearchBtn && newsSearchInput) {
      newsSearchBtn.addEventListener("click", () => {
        // Disparar evento de input para reaproveitar a lógica de filtro existente
        const event = new Event('input');
        newsSearchInput.dispatchEvent(event);
      });
    }
  }

  function renderNewsBatch() {
    if (currentNewsPage === 1) newsList.innerHTML = "";

    const start = (currentNewsPage - 1) * NEWS_PER_PAGE;
    const end = currentNewsPage * NEWS_PER_PAGE;
    const newsToRender = filteredNews.slice(start, end);

    newsToRender.forEach(item => {
      const card = document.createElement("div");
      card.className = "news-card";

      let extraContent = "";
      if (item.extra_image) extraContent += `<img src="${item.extra_image}" alt="Extra">`;
      if (item.extra_text) extraContent += `<p>${item.extra_text}</p>`;
      extraContent += `<button class="news-link-btn" onclick="openNewsModal(${item.id})">Saiba Mais</button>`;

      card.innerHTML = `
        <h3>${item.title}</h3>
        ${item.date ? `<p style="color: #888; font-size: 0.9rem; margin-bottom: 15px;">📅 ${item.date}</p>` : ''}
        <img src="${item.image}" alt="${item.title}">
        <p>${item.text}</p>
        ${extraContent}
        <button class="like-btn" onclick="toggleNewsLike(${item.id})" id="news-like-btn-${item.id}">
          ❤️ <span id="news-like-count-${item.id}">0</span>
        </button>
      `;

      newsList.appendChild(card);

      // Carregar Likes do Firestore
      onSnapshot(doc(db, "news_stats", String(item.id)), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const countSpan = document.getElementById(`news-like-count-${item.id}`);
          if (countSpan) countSpan.textContent = data.likesCount || 0;

          // Verificar se usuário atual curtiu (requer subcoleção ou array, usando array simples para demo)
          // Para produção robusta, use subcoleção 'likes'. Aqui simplificado:
          // A verificação visual de "liked" depende de ler a subcoleção, faremos isso no toggle ou carga separada.
        }
      }, (error) => {
        console.warn(`Permissão negada (Likes): ${error.code}`);
      });
    });

    if (filteredNews.length > end) {
      loadMoreNewsBtn.style.display = "block";
    } else {
      loadMoreNewsBtn.style.display = "none";
    }
  }

  // News Carousel Logic
  let currentNewsMedia = [];
  let currentNewsIndex = 0;

  function renderNewsCarousel() {
    if (!newsCarouselInner) return;
    newsCarouselInner.innerHTML = "";
    if (newsDots) newsDots.innerHTML = "";

    currentNewsMedia.forEach((media, index) => {
      const item = document.createElement("div");
      item.className = "carousel-item";

      if (media.type === 'video') {
        // YouTube Embed
        item.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${media.src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      } else {
        const img = document.createElement("img");
        img.src = media.src;
        img.alt = "News Image";
        img.style.display = "block";
        img.onclick = () => openZoom(media.src);
        item.appendChild(img);
      }

      newsCarouselInner.appendChild(item);

      if (newsDots) {
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.onclick = () => {
          currentNewsIndex = index;
          updateNewsCarouselPosition();
        };
        newsDots.appendChild(dot);
      }
    });
    updateNewsCarouselPosition();
  }

  function updateNewsCarouselPosition() {
    if (!newsCarouselInner) return;
    newsCarouselInner.style.transform = `translateX(-${currentNewsIndex * 100}%)`;

    if (newsDots) {
      const dots = newsDots.getElementsByClassName("dot");
      for (let i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
      }
      if (dots[currentNewsIndex]) {
        dots[currentNewsIndex].className += " active";
      }
    }
  }

  if (newsPrev && newsNext) {
    newsPrev.addEventListener("click", () => {
      if (currentNewsMedia.length <= 1) return;
      currentNewsIndex = (currentNewsIndex > 0) ? currentNewsIndex - 1 : currentNewsMedia.length - 1;
      updateNewsCarouselPosition();
    });
    newsNext.addEventListener("click", () => {
      if (currentNewsMedia.length <= 1) return;
      currentNewsIndex = (currentNewsIndex < currentNewsMedia.length - 1) ? currentNewsIndex + 1 : 0;
      updateNewsCarouselPosition();
    });
  }

  // Helper para extrair ID do YouTube
  function getYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // News Modal Logic
  window.openNewsModal = function (id) {
    const item = allNews.find(n => n.id === id);
    if (!item) return;

    document.getElementById("news-modal-title").textContent = item.title;
    document.getElementById("news-modal-date").textContent = item.date ? `📅 ${item.date}` : "";

    // Prepare Media
    currentNewsMedia = [];
    if (item.image) currentNewsMedia.push({ type: 'image', src: item.image });
    if (item.extra_image) currentNewsMedia.push({ type: 'image', src: item.extra_image });

    // Check for Video (YouTube)
    if (item.video) {
      const ytId = getYoutubeId(item.video);
      if (ytId) currentNewsMedia.push({ type: 'video', src: ytId });
    }

    // Incrementar Views da Notícia no Firestore
    updateDoc(doc(db, "news_stats", String(id)), { views: increment(1) }).catch(() => {
      setDoc(doc(db, "news_stats", String(id)), { views: 1, likesCount: 0 }, { merge: true });
    });

    const imgElem = document.getElementById("news-modal-image");

    if (currentNewsMedia.length > 1) {
      // Show Carousel
      imgElem.style.display = "none";
      if (newsCarousel) newsCarousel.style.display = "block";
      currentNewsIndex = 0;
      renderNewsCarousel();
    } else {
      // Show Single Image
      if (newsCarousel) newsCarousel.style.display = "none";
      if (item.image) {
        imgElem.src = item.image;
        imgElem.style.display = "block";
      } else {
        imgElem.style.display = "none";
      }
    }

    let bodyContent = `<p style="margin-bottom: 15px;">${item.text}</p>`;
    if (item.extra_text) bodyContent += `<p style="margin-bottom: 15px;">${item.extra_text}</p>`;
    if (currentNewsMedia.length <= 1 && item.extra_image && !item.image) bodyContent += `<img src="${item.extra_image}" style="width:100%; border-radius:8px; margin-top:10px;">`;

    document.getElementById("news-modal-body").innerHTML = bodyContent;

    const actionsDiv = document.getElementById("news-modal-actions");
    actionsDiv.innerHTML = `<button class="download-btn" onclick="closeModalWithFade(document.getElementById('news-modal'))">Fechar</button>`;

    // --- Comments in Modal ---
    const commentsContainer = document.getElementById("news-modal-comments-container");
    if (commentsContainer) {
      commentsContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin:0;">Comentários</h3>
          <select class="sort-comments-select" onchange="sortComments(${id}, this.value)">
            <option value="newest">Mais Recentes</option>
            <option value="oldest">Mais Antigos</option>
            <option value="likes">Mais Curtidos</option>
          </select>
        </div>
        <div class="comment-list" id="modal-comments-list-${id}"></div>
        <form class="comment-form" id="modal-comment-form-${id}" style="margin-top:20px;">
          <input type="text" id="modal-comment-name-${id}" placeholder="Seu nome" required>
          <textarea id="modal-comment-text-${id}" placeholder="Seu comentário" required></textarea>
          <input type="file" id="modal-comment-file-${id}" accept="image/*">
          <button type="submit" class="download-btn" style="width: fit-content;">Comentar</button>
        </form>
      `;

      const form = document.getElementById(`modal-comment-form-${id}`);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById(`modal-comment-name-${id}`).value;
        const text = document.getElementById(`modal-comment-text-${id}`).value;
        const fileInput = document.getElementById(`modal-comment-file-${id}`);

        const callback = () => {
          // Limpar apenas texto e arquivo, manter o nome
          document.getElementById(`modal-comment-text-${id}`).value = "";
          document.getElementById(`modal-comment-file-${id}`).value = "";
        };
        if (fileInput.files.length > 0) {
          compressImage(fileInput.files[0], (img) => saveComment(id, name, text, img, null, callback));
        } else {
          saveComment(id, name, text, null, null, callback);
        }
      });

      loadComments(id, `modal-comments-list-${id}`);
    }

    if (newsModal) newsModal.style.display = "block";
  };

  if (closeNewsBtn) {
    closeNewsBtn.addEventListener("click", () => {
      if (newsModal) closeModalWithFade(newsModal);
    });
  }

  // Close contact modal on outside click
  window.addEventListener("click", (e) => { if (e.target == contactModal) closeModalWithFade(contactModal); });

  // Expose Like functions to window
  window.toggleNewsLike = function (id) {
    if (!currentUser) return customAlert("Aguarde a inicialização...", "Sistema");

    const likeRef = doc(db, "news_stats", String(id), "likes", currentUser.uid);
    const statsRef = doc(db, "news_stats", String(id));

    getDoc(likeRef).then((docSnap) => {
      const isLiked = docSnap.exists() && docSnap.data().active;

      if (isLiked) {
        // Remover Like
        updateDoc(likeRef, { active: false });
        setDoc(statsRef, { likesCount: increment(-1) }, { merge: true });
        document.getElementById(`news-like-btn-${id}`).classList.remove("liked");
      } else {
        // Adicionar Like
        setDoc(likeRef, { active: true }); // Cria ou sobrescreve
        setDoc(statsRef, { likesCount: increment(1) }, { merge: true });
        document.getElementById(`news-like-btn-${id}`).classList.add("liked");
      }
    });
  };

  window.sortComments = function (newsId, criteria) {
    commentSortPrefs[newsId] = criteria;
    // Re-render is handled by onSnapshot if we just update sort pref, but we might need to re-trigger render
    loadComments(newsId, `modal-comments-list-${newsId}`);
  };

  function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        // Quality 0.3 (approx 70% reduction/compression)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.3);
        callback(dataUrl);
      }
    }
  }

  function saveComment(newsId, name, text, image, parentId = null, callback = null) {
    const comment = {
      name,
      text,
      image,
      date: new Date().toLocaleDateString(),
      likes: 0,
      parentId: parentId,
      timestamp: new Date()
    };

    addDoc(collection(db, "news_stats", String(newsId), "comments"), comment)
      .then(() => { if (callback) callback(); });
  }

  function loadComments(newsId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (unsubscribeComments) unsubscribeComments(); // Detach previous listener

    const q = query(collection(db, "news_stats", String(newsId), "comments"), orderBy("timestamp", "desc"));

    unsubscribeComments = onSnapshot(q, (querySnapshot) => {
      const comments = [];
      querySnapshot.forEach((doc) => comments.push({ id: doc.id, ...doc.data() }));

      container.innerHTML = "";

      // Build Hierarchy
      const commentMap = {};
      const roots = [];

      // Initialize map
      comments.forEach(c => {
        c.replies = [];
        commentMap[c.id] = c;
      });

      // Link parents
      comments.forEach(c => {
        if (c.parentId && commentMap[c.parentId]) {
          commentMap[c.parentId].replies.push(c);
        } else {
          roots.push(c);
        }
      });

      const sortBy = commentSortPrefs[newsId] || 'newest';
      if (sortBy === 'newest') {
        roots.sort((a, b) => b.id - a.id);
      } else if (sortBy === 'oldest') {
        roots.sort((a, b) => a.id - b.id);
      } else if (sortBy === 'likes') {
        roots.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      }

      function renderCommentNode(c) {
        const isLiked = false; // Implementar verificação de like de comentário com subcoleção se necessário
        const div = document.createElement("div");
        div.className = "comment";
        div.id = `comment-${c.id}`;
        div.innerHTML = `
        <div class="comment-avatar">👤</div>
        <div class="comment-content">
          <h5>${c.name} <small style="font-weight:normal; color:#888;">${c.date}</small></h5>
          <p>${c.text}</p>
          ${c.image ? `<img src="${c.image}" class="comment-img" style="cursor:zoom-in">` : ''}
          <div class="comment-actions">
             <button class="comment-like-btn ${isLiked ? 'liked' : ''}" onclick="toggleCommentLike(${newsId}, ${c.id})">
               👍 <span id="comment-like-count-${c.id}">${c.likes || 0}</span>
             </button>
             <button class="reply-btn" onclick="toggleReplyForm(${c.id})">Responder</button>
          </div>
          
          <div id="reply-form-${c.id}" class="reply-form-container">
            <form class="comment-form" onsubmit="submitReply(event, ${newsId}, '${c.id}')">
              <input type="text" placeholder="Seu nome" required>
              <textarea placeholder="Sua resposta" required></textarea>
              <button type="submit" class="download-btn" style="width: fit-content; font-size: 0.8rem; padding: 8px 15px;">Enviar</button>
            </form>
          </div>

          <div class="comment-reply-container" id="replies-${c.id}"></div>
        </div>
      `;

        if (c.replies.length > 0) {
          c.replies.sort((a, b) => a.id - b.id); // Replies usually chronological
          const replyContainer = div.querySelector(`#replies-${c.id}`);
          c.replies.forEach(reply => {
            replyContainer.appendChild(renderCommentNode(reply));
          });
        }
        return div;
      }

      roots.forEach(c => {
        container.appendChild(renderCommentNode(c));
      });
    }, (error) => {
      console.warn("Erro ao carregar comentários:", error.code);
      container.innerHTML = `<p style="color: #888; font-size: 0.9rem;">Comentários indisponíveis (Verifique as regras do Firebase).</p>`;
    });
  }

  // Event delegation for comment image zoom
  document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('comment-img')) {
      openZoom(e.target.src);
    }
  });

  window.toggleReplyForm = function (commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (form) {
      form.classList.toggle('active');
    }
  };

  window.submitReply = function (e, newsId, parentId) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector("input").value;
    const text = form.querySelector("textarea").value;

    saveComment(newsId, name, text, null, parentId, () => form.reset());
  };

  window.toggleCommentLike = function (newsId, commentId) {
    // Simplificação: Apenas incrementa no Firestore. Para toggle real, precisa de subcoleção de likes por usuário.
    const commentRef = doc(db, "news_stats", String(newsId), "comments", String(commentId));
    updateDoc(commentRef, { likes: increment(1) });
  };

  // Search functionality
  function performSearch() {
    const query = searchBar.value.toLowerCase();
    const filteredProducts = allProducts.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    );
    renderProducts(filteredProducts);

    // Suggestions Logic
    if (suggestionsContainer) {
      suggestionsContainer.innerHTML = "";
      if (query.length > 0) {
        const suggestions = allProducts.filter(p => p.name.toLowerCase().includes(query));
        if (suggestions.length > 0) {
          suggestions.slice(0, 5).forEach(p => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.textContent = p.name;
            div.onclick = () => {
              searchBar.value = p.name;
              suggestionsContainer.innerHTML = "";
              performSearch();
            };
            suggestionsContainer.appendChild(div);
          });
        }
      }
    }
  }

  // Hide suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (suggestionsContainer && !e.target.closest(".input-wrapper")) {
      suggestionsContainer.innerHTML = "";
    }
  });

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  if (searchButton) {
    searchButton.addEventListener("click", performSearch);
  }

  if (searchBar) {
    searchBar.placeholder = "Pesquisar por nome ou descrição...";
    searchBar.addEventListener("input", debounce(performSearch, 300));
  }

  // Reading Progress Bar Logic
  window.addEventListener("scroll", () => {
    if (!sobreSection || !progressBar) return;
    const sectionTop = sobreSection.offsetTop;
    const sectionHeight = sobreSection.offsetHeight;
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;

    const distance = scrollTop - sectionTop;
    const total = sectionHeight - windowHeight;
    let percentage = 0;

    if (total > 0) {
      percentage = (distance / total) * 100;
    }
    progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
  });

  // Back to Top Logic
  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.display = "flex";
      } else {
        backToTopBtn.style.display = "none";
      }
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Welcome Modal Logic (Cookie/LocalStorage)
  if (welcomeModal && !localStorage.getItem("softsafe_welcome_seen")) {
    setTimeout(() => {
      welcomeModal.style.display = "block";
    }, 1000);
  }

  function closeWelcome() {
    if (welcomeModal) {
      welcomeModal.style.display = "none";
      localStorage.setItem("softsafe_welcome_seen", "true");
    }
  }

  if (closeWelcomeBtn) closeWelcomeBtn.addEventListener("click", closeWelcome);
  if (acceptWelcomeBtn) acceptWelcomeBtn.addEventListener("click", closeWelcome);

  // Carousel Logic
  function renderCarousel() {
    if (!carouselInner) return;
    carouselInner.innerHTML = "";
    if (carouselDots) carouselDots.innerHTML = "";
    currentMedia.forEach((media, index) => {
      const item = document.createElement("div");
      item.className = "carousel-item";
      if (media.type === "video") {
        item.innerHTML = `<video src="${media.src}" controls></video>`;
      } else {
        const spinner = document.createElement("div");
        spinner.className = "carousel-spinner";
        item.appendChild(spinner);

        const img = document.createElement("img");
        img.src = media.src;
        img.alt = "Product Image";
        img.loading = "eager";

        img.onload = () => {
          spinner.remove();
          img.style.display = "block";
        };
        img.onerror = () => {
          spinner.remove();
          const errorMsg = document.createElement("div");
          errorMsg.className = "carousel-error-msg";
          errorMsg.innerHTML = "<span>⚠️</span><p>Imagem indisponível</p>";
          item.appendChild(errorMsg);
        };

        img.onclick = () => openZoom(media.src);
        item.appendChild(img);
      }
      carouselInner.appendChild(item);

      // Create dot
      if (carouselDots) {
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.onclick = () => {
          currentCarouselIndex = index;
          updateCarouselPosition();
        };
        carouselDots.appendChild(dot);
      }
    });
    updateCarouselPosition();
  }

  function updateCarouselPosition() {
    if (!carouselInner) return;
    carouselInner.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
    // Pause videos when sliding away
    const videos = carouselInner.querySelectorAll("video");
    videos.forEach(v => v.pause());

    // Update dots
    if (carouselDots) {
      const dots = carouselDots.getElementsByClassName("dot");
      for (let i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
      }
      if (dots[currentCarouselIndex]) {
        dots[currentCarouselIndex].className += " active";
      }
    }

    // Preload next image
    if (currentMedia.length > 1) {
      const nextIndex = (currentCarouselIndex + 1) % currentMedia.length;
      if (currentMedia[nextIndex].type !== 'video') {
        const img = new Image();
        img.src = currentMedia[nextIndex].src;
      }
    }
  }

  if (btnPrev && btnNext) {
    btnPrev.addEventListener("click", () => {
      if (currentMedia.length <= 1) return;
      currentCarouselIndex = (currentCarouselIndex > 0) ? currentCarouselIndex - 1 : currentMedia.length - 1;
      updateCarouselPosition();
    });

    btnNext.addEventListener("click", () => {
      if (currentMedia.length <= 1) return;
      currentCarouselIndex = (currentCarouselIndex < currentMedia.length - 1) ? currentCarouselIndex + 1 : 0;
      updateCarouselPosition();
    });
  }

  // Swipe Support for Carousel
  let touchStartX = 0;
  let touchEndX = 0;

  if (carouselInner) {
    carouselInner.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselInner.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });
  }

  function handleSwipe() {
    if (currentMedia.length <= 1) return;
    const threshold = 50;
    if (touchEndX < touchStartX - threshold) {
      // Swipe Left -> Next
      currentCarouselIndex = (currentCarouselIndex < currentMedia.length - 1) ? currentCarouselIndex + 1 : 0;
      updateCarouselPosition();
    } else if (touchEndX > touchStartX + threshold) {
      // Swipe Right -> Prev
      currentCarouselIndex = (currentCarouselIndex > 0) ? currentCarouselIndex - 1 : currentMedia.length - 1;
      updateCarouselPosition();
    }
  }

  // Zoom Functionality with Pinch Support
  let initialDistance = 0;
  let initialScale = 1;
  let currentScale = 1;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;

  function updateZoomTransform() {
    zoomImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
  }

  function openZoom(src) {
    if (!zoomModal) return;
    zoomModal.style.display = "block";
    zoomImg.src = src;
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    zoomImg.style.transform = ""; // Limpa transformações inline para permitir animação CSS
    zoomImg.style.cursor = "grab";

    // Spinner Logic
    if (zoomSpinner) zoomSpinner.style.display = "block";
    zoomImg.style.display = "none";

    zoomImg.onload = () => {
      if (zoomSpinner) zoomSpinner.style.display = "none";
      zoomImg.style.display = "block";
    };
    zoomImg.onerror = () => {
      if (zoomSpinner) zoomSpinner.style.display = "none";
    };
  }

  // Expose openZoom to window for inline onclick handlers
  window.openZoom = function (src) {
    openZoom(src);
  };

  if (resetZoomBtn) {
    resetZoomBtn.onclick = () => {
      currentScale = 1;
      translateX = 0;
      translateY = 0;
      updateZoomTransform();
      zoomImg.style.cursor = "grab";
    };
  }

  if (closeZoom) {
    closeZoom.onclick = () => {
      closeModalWithFade(zoomModal, () => {
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        zoomImg.style.transform = "";
      });
    };
  }

  // Mouse Wheel Zoom
  if (zoomImg) {
    zoomImg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = Math.sign(e.deltaY) * -0.2;
      const newScale = Math.min(Math.max(1, currentScale + delta), 4);
      currentScale = newScale;
      updateZoomTransform();
    }, { passive: false });

    // Mouse Events for Pan (Desktop)
    zoomImg.addEventListener("mousedown", (e) => {
      if (currentScale > 1) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        zoomImg.style.cursor = "grabbing";
        e.preventDefault();
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (isDragging && currentScale > 1) {
        e.preventDefault();
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateZoomTransform();
      }
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        zoomImg.style.cursor = "grab";
      }
    });

    // Touch Events for Pinch & Pan (Mobile)
    zoomImg.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        initialScale = currentScale;
      } else if (e.touches.length === 1 && currentScale > 1) {
        isDragging = true;
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
      }
    });

    zoomImg.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        );
        const scaleChange = currentDistance / initialDistance;
        currentScale = Math.min(Math.max(1, initialScale * scaleChange), 4); // Min 1x, Max 4x
        updateZoomTransform();
      } else if (e.touches.length === 1 && isDragging && currentScale > 1) {
        e.preventDefault();
        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;
        updateZoomTransform();
      }
    });

    zoomImg.addEventListener("touchend", (e) => {
      if (e.touches.length === 0) isDragging = false;
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === zoomModal) {
      closeModalWithFade(zoomModal, () => {
        currentScale = 1;
        translateX = 0;
        translateY = 0;
        zoomImg.style.transform = "";
      });
    }
  });

  // Helper function to close modal with fade out
  window.closeModalWithFade = function (modalElement, callback) {
    if (!modalElement) return;
    modalElement.classList.add("fade-out");
    setTimeout(() => {
      modalElement.style.display = "none";
      modalElement.classList.remove("fade-out");
      if (callback) callback();
    }, 300); // Match animation duration
  };

  // Open modal with product details
  function openModal(product) {
    currentOpenProductId = product.id;
    document.getElementById("modal-title").textContent = product.title;
    document.getElementById("modal-size").textContent = product.size;
    document.getElementById("modal-version").textContent = product.version;
    document.getElementById("modal-compatibility").textContent = product.compatibility;
    document.getElementById("modal-description").innerHTML = product.description.replace(/\n/g, '<br>');

    // Incrementar contador de cliques (views) do produto no Firestore
    updateDoc(doc(db, "products", String(product.id)), { clicks: increment(1) }).catch(() => {
      setDoc(doc(db, "products", String(product.id)), { clicks: 1 }, { merge: true });
    });

    // Reset Stars
    stars.forEach(s => s.classList.remove('filled'));
    if (ratingCountElem) ratingCountElem.textContent = "(Carregando...)";

    // Listen for Rating Updates
    onSnapshot(doc(db, "products", String(product.id)), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const avg = data.averageRating || 0;
        const count = data.ratingCount || 0;

        stars.forEach(s => {
          s.classList.toggle('filled', parseInt(s.dataset.value) <= Math.round(avg));
        });
        if (ratingCountElem) ratingCountElem.textContent = `(${avg.toFixed(1)} / ${count} avaliações)`;
      } else {
        if (ratingCountElem) ratingCountElem.textContent = "(0 avaliações)";
      }
    }, (error) => {
      console.warn("Erro ao carregar avaliações:", error.code);
      if (ratingCountElem) ratingCountElem.textContent = "(Offline)";
    });

    // Setup Carousel
    currentCarouselIndex = 0;
    if (product.media && product.media.length > 0) {
      currentMedia = product.media;
      if (carouselContainer) carouselContainer.style.display = "block";
      // Show/Hide controls based on count
      if (currentMedia.length > 1) {
        if (btnPrev) btnPrev.style.display = "block";
        if (btnNext) btnNext.style.display = "block";
      } else {
        if (btnPrev) btnPrev.style.display = "none";
        if (btnNext) btnNext.style.display = "none";
      }
    } else {
      // Fallback to single image if no media array
      currentMedia = [{ type: 'image', src: product.image }];
      if (carouselContainer) carouselContainer.style.display = "block";
      if (btnPrev) btnPrev.style.display = "none";
      if (btnNext) btnNext.style.display = "none";
    }
    renderCarousel();

    const downloadBtn = document.querySelector(".download-btn");
    const shareActionBtn = document.querySelector(".share-action-btn");

    // Share Button Logic
    if (shareActionBtn) {
      shareActionBtn.onclick = () => {
        const shareUrl = window.location.href;
        const shareText = `Confira este software incrível: ${product.name}`;

        // Update Links
        if (shareWhatsapp) shareWhatsapp.href = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
        if (shareFacebook) shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        if (shareX) shareX.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        if (shareInstagram) shareInstagram.href = "https://www.instagram.com/";

        // Copy Link Logic
        if (shareCopy) {
          shareCopy.onclick = () => {
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
              const originalText = shareCopy.textContent;
              shareCopy.textContent = "Copiado!";
              setTimeout(() => {
                shareCopy.textContent = originalText;
              }, 2000);
            });
          };
        }

        if (shareModal) shareModal.style.display = "block";
      };
    }

    // Reset button state
    downloadBtn.classList.remove("downloading");
    downloadBtn.textContent = "Download";
    downloadBtn.disabled = false;

    downloadBtn.onclick = () => {
      triggerConfetti();
      downloadBtn.classList.add("downloading");
      downloadBtn.textContent = "Baixando...";
      downloadBtn.disabled = true;
      window.location.href = product.download_link;
    };

    modal.style.display = "block";
  }

  // Handle Star Click
  if (stars) {
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.value);
        if (!currentUser) {
          customAlert("Aguarde a autenticação para avaliar.", "Aviso");
          return;
        }
        if (!currentOpenProductId) return;

        const productRef = doc(db, "products", String(currentOpenProductId));
        const userRatingRef = doc(db, "products", String(currentOpenProductId), "ratings", currentUser.uid);

        runTransaction(db, async (transaction) => {
          const productDoc = await transaction.get(productRef);
          const userRatingDoc = await transaction.get(userRatingRef);

          let newRatingCount = 0;
          let newAverageRating = 0;

          if (!productDoc.exists()) {
            newRatingCount = 1;
            newAverageRating = rating;
            transaction.set(productRef, { averageRating: rating, ratingCount: 1, clicks: 1 });
          } else {
            const data = productDoc.data();
            const currentAvg = data.averageRating || 0;
            const currentCount = data.ratingCount || 0;

            // Verificação para impedir múltiplas avaliações (mesmo que as regras permitam update)
            if (userRatingDoc.exists()) {
              throw "Você já avaliou este produto.";
            }

            if (userRatingDoc.exists()) {
              const oldRating = userRatingDoc.data().rating;
              newRatingCount = currentCount;
              newAverageRating = ((currentAvg * currentCount) - oldRating + rating) / currentCount;
            } else {
              newRatingCount = currentCount + 1;
              newAverageRating = ((currentAvg * currentCount) + rating) / newRatingCount;
            }

            transaction.update(productRef, {
              averageRating: newAverageRating,
              ratingCount: newRatingCount
            });
          }
          transaction.set(userRatingRef, { rating: rating, timestamp: new Date() });
        }).then(() => {
          console.log("Avaliação salva!");
          customAlert("Obrigado pela sua avaliação!", "Sucesso");
        }).catch(err => customAlert(String(err), "Erro"));
      });
    });
  }

  // Close modal
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeModalWithFade(modal, () => {
      });
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      closeModalWithFade(modal, () => {
      });
    }
    if (event.target == shareModal) {
      closeModalWithFade(shareModal);
    }
    if (event.target == newsModal) {
      closeModalWithFade(newsModal);
    }
    if (event.target == welcomeModal) {
      closeWelcome();
    }
    if (event.target == privacyModal) {
      closeModalWithFade(privacyModal);
    }
  });

  if (closeShareBtn) {
    closeShareBtn.addEventListener("click", () => {
      if (shareModal) closeModalWithFade(shareModal);
    });
  }

  // Theme Toggle Logic
  // (Moved to top for Firebase integration)

  // Close modals on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modal && modal.style.display === "block") closeModalWithFade(modal);
      if (zoomModal && zoomModal.style.display === "block") closeModalWithFade(zoomModal);
      if (shareModal && shareModal.style.display === "block") closeModalWithFade(shareModal);
      if (newsModal && newsModal.style.display === "block") closeModalWithFade(newsModal);
      if (welcomeModal && welcomeModal.style.display === "block") closeWelcome();
      if (contactModal && contactModal.style.display === "block") closeModalWithFade(contactModal);
      if (privacyModal && privacyModal.style.display === "block") closeModalWithFade(privacyModal);

      // Close burger menu
      if (navMenu && navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
        if (menuOverlay) menuOverlay.classList.remove("active");
      }
    }
  });

  // Dynamic Footer Content (Copyright + Socials + Privacy)
  const footer = document.querySelector(".footer");
  if (footer) {
    const currentYear = new Date().getFullYear();
    footer.innerHTML = `
      <div class="footer-container">
        <p>&copy; ${currentYear} SoftSafe — Todos os direitos reservados</p>
        <div class="footer-socials">
          <a href="https://facebook.com" target="_blank" title="Facebook"><i class="fab fa-facebook-f"></i></a>
          <a href="https://instagram.com" target="_blank" title="Instagram"><i class="fab fa-instagram"></i></a>
          <a href="https://twitter.com" target="_blank" title="X (Twitter)"><i class="fab fa-x-twitter"></i></a>
        </div>
        <div class="footer-legal">
          <a href="#" id="privacy-link">Política de Privacidade</a>
        </div>
      </div>
    `;

    // Privacy Modal Logic
    const privacyLink = document.getElementById("privacy-link");
    if (privacyLink && privacyModal) {
      privacyLink.addEventListener("click", (e) => {
        e.preventDefault();
        privacyModal.style.display = "block";
      });
    }
  }

  // Close Privacy Modal Logic
  document.querySelectorAll(".close-privacy, .close-privacy-btn").forEach(el => {
    el.addEventListener("click", () => {
      if (privacyModal) closeModalWithFade(privacyModal);
    });
  });

  // Close privacy modal on outside click (handled by generic window click listener below)

  // FAQ Logic (Fetch JSON + Animation + Accordion)
  const faqContainer = document.querySelector(".faq-container");
  if (faqContainer) {
    // Event Delegation for Accordion
    faqContainer.addEventListener("click", (e) => {
      const button = e.target.closest(".faq-question");
      if (!button) return;

      const item = button.parentElement;
      const isActive = item.classList.contains("active");

      // Close all others (optional - remove if you want multiple open)
      document.querySelectorAll(".faq-item").forEach(i => {
        i.classList.remove("active");
        i.querySelector(".faq-answer").style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add("active");
        const answer = item.querySelector(".faq-answer");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });

    // Fetch Data & Setup Animation
    fetch("faq.json")
      .then(res => res.json())
      .then(data => {
        faqContainer.innerHTML = "";
        data.forEach((item, index) => {
          const div = document.createElement("div");
          div.className = "faq-item scroll-hidden";
          div.style.transitionDelay = `${index * 0.15}s`; // Stagger effect
          div.innerHTML = `
            <button class="faq-question">${item.question} <span class="faq-icon">+</span></button>
            <div class="faq-answer"><p>${item.answer}</p></div>
          `;
          faqContainer.appendChild(div);
        });

        // Intersection Observer for Fade-In
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              entry.target.classList.remove("scroll-hidden");
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });

        document.querySelectorAll(".faq-item").forEach(el => observer.observe(el));
      })
      .catch(err => console.error("Erro ao carregar FAQ:", err));
  }
});

function scrollToProducts() {
  document.getElementById("produtos").scrollIntoView({
    behavior: "smooth"
  });
}
