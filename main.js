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
        setTimeout(typeWriter, 50); // Velocidade da digitação
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

  let loadMoreBtn;
  if (productList) {
    // Create Load More Button
    loadMoreBtn = document.createElement("button");
    loadMoreBtn.textContent = "Carregar Mais";
    loadMoreBtn.className = "load-more-btn";
    productList.parentNode.insertBefore(loadMoreBtn, productList.nextSibling);

    // Event Delegation for View More
    productList.addEventListener("click", (e) => {
      if (e.target.classList.contains("view-more-btn")) {
        const productId = parseInt(e.target.getAttribute("data-id"));
        const product = allProducts.find(p => p.id === productId);
        openModal(product);
      }
    });

    loadMoreBtn.addEventListener("click", () => {
      currentPage++;
      renderBatch();
    });
  }

  function renderBatch() {
    if (!productList) return;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = currentPage * ITEMS_PER_PAGE;
    const productsToRender = currentFilteredProducts.slice(start, end);

    let productsHTML = "";
    productsToRender.forEach((product, index) => {
      const productCard = `
          <div class="produto fade-in" style="animation-delay: ${index * 0.1}s">
            <img src="${product.image}" alt="${product.name}">
            <h4>${product.name}</h4>
            <button class="view-more-btn" data-id="${product.id}">Ver Mais</button>
          </div>
        `;
      productsHTML += productCard;
    });
    productList.insertAdjacentHTML('beforeend', productsHTML);

    if (currentFilteredProducts.length > end) {
      loadMoreBtn.style.display = "block";
    } else {
      loadMoreBtn.style.display = "none";
    }
    updateCounter();
  }

  function updateCounter() {
    const visibleCount = Math.min(currentPage * ITEMS_PER_PAGE, currentFilteredProducts.length);
    productCountElem.textContent = `Exibindo ${visibleCount} de ${currentFilteredProducts.length} produtos`;
  }

  function renderProducts(products) {
    productList.innerHTML = "";
    currentFilteredProducts = products;
    currentPage = 1;

    if (products.length === 0) {
      productList.innerHTML = '<p class="no-results" style="width: 100%; text-align: center; padding: 20px;">Nenhum produto encontrado.</p>';
      loadMoreBtn.style.display = "none";
      productCountElem.textContent = "";
      return;
    }
    renderBatch();
  }

  loadMoreBtn.addEventListener("click", () => {
    currentPage++;
    renderBatch();
  });

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
        renderNewsBatch();
      });
  }

  function renderNewsBatch() {
    if (currentNewsPage === 1) newsList.innerHTML = "";

    const start = (currentNewsPage - 1) * NEWS_PER_PAGE;
    const end = currentNewsPage * NEWS_PER_PAGE;
    const newsToRender = allNews.slice(start, end);

    newsToRender.forEach(item => {
      const likeData = getNewsLikeState(item.id);
      const likeClass = likeData.liked ? "liked" : "";

      const card = document.createElement("div");
      card.className = "news-card";

      let extraContent = "";
      if (item.extra_image) extraContent += `<img src="${item.extra_image}" alt="Extra">`;
      if (item.extra_text) extraContent += `<p>${item.extra_text}</p>`;
      if (item.link) extraContent += `<a href="${item.link}" class="news-link" target="_blank">Saiba Mais</a>`;

      card.innerHTML = `
        <h3>${item.title}</h3>
        <img src="${item.image}" alt="${item.title}">
        <p>${item.text}</p>
        ${extraContent}
        <button class="like-btn ${likeClass}" onclick="toggleNewsLike(${item.id})" id="news-like-btn-${item.id}">
          ❤️ <span id="news-like-count-${item.id}">${likeData.count}</span>
        </button>
        
        <div class="comments-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="margin:0;">Comentários</h4>
            <select class="sort-comments-select" onchange="sortComments(${item.id}, this.value)">
              <option value="newest">Mais Recentes</option>
              <option value="oldest">Mais Antigos</option>
              <option value="likes">Mais Curtidos</option>
            </select>
          </div>
          <div class="comment-list" id="comments-${item.id}"></div>
          <form class="comment-form" data-id="${item.id}">
            <input type="text" placeholder="Seu nome" required>
            <textarea placeholder="Seu comentário" required></textarea>
            <input type="file" accept="image/*">
            <button type="submit" class="download-btn" style="width: fit-content;">Comentar</button>
          </form>
        </div>
      `;
      newsList.appendChild(card);
      loadComments(item.id);
    });

    if (allNews.length > end) {
      loadMoreNewsBtn.style.display = "block";
    } else {
      loadMoreNewsBtn.style.display = "none";
    }

    // Handle Comment Submission
    document.querySelectorAll(".comment-form").forEach(form => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const newsId = form.getAttribute("data-id");
        const name = form.querySelector("input[type='text']").value;
        const text = form.querySelector("textarea").value;
        const fileInput = form.querySelector("input[type='file']");

        if (fileInput.files.length > 0) {
          compressImage(fileInput.files[0], (compressedImg) => {
            saveComment(newsId, name, text, compressedImg);
            form.reset();
          });
        } else {
          saveComment(newsId, name, text, null);
          form.reset();
        }
      });
    });
  }

  // Expose Like functions to window
  window.toggleNewsLike = function (id) {
    const storage = JSON.parse(localStorage.getItem("softsafe_news_likes_data") || "{}");
    if (!storage[id]) storage[id] = { count: 0, liked: false };

    if (storage[id].liked) {
      storage[id].count--;
      storage[id].liked = false;
    } else {
      storage[id].count++;
      storage[id].liked = true;
    }
    localStorage.setItem("softsafe_news_likes_data", JSON.stringify(storage));

    const btn = document.getElementById(`news-like-btn-${id}`);
    const countSpan = document.getElementById(`news-like-count-${id}`);
    if (btn) btn.classList.toggle("liked", storage[id].liked);
    if (countSpan) countSpan.textContent = storage[id].count;
  };

  window.sortComments = function (newsId, criteria) {
    commentSortPrefs[newsId] = criteria;
    loadComments(newsId);
  };

  function getNewsLikeState(id) {
    const storage = JSON.parse(localStorage.getItem("softsafe_news_likes_data") || "{}");
    return storage[id] || { count: 0, liked: false };
  }

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

  function saveComment(newsId, name, text, image, parentId = null) {
    const comment = { id: Date.now(), name, text, image, date: new Date().toLocaleDateString(), likes: 0, parentId: parentId };
    const key = `softsafe_comments_${newsId}`;
    const comments = JSON.parse(localStorage.getItem(key) || "[]");
    comments.push(comment);
    localStorage.setItem(key, JSON.stringify(comments));
    loadComments(newsId);
  }

  function loadComments(newsId) {
    const key = `softsafe_comments_${newsId}`;
    const comments = JSON.parse(localStorage.getItem(key) || "[]");
    const container = document.getElementById(`comments-${newsId}`);
    container.innerHTML = "";

    const userLikedComments = JSON.parse(localStorage.getItem("softsafe_user_liked_comments") || "[]");

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
      const isLiked = userLikedComments.includes(c.id);
      const div = document.createElement("div");
      div.className = "comment";
      div.id = `comment-${c.id}`;
      div.innerHTML = `
        <div class="comment-avatar">👤</div>
        <div class="comment-content">
          <h5>${c.name} <small style="font-weight:normal; color:#888;">${c.date}</small></h5>
          <p>${c.text}</p>
          ${c.image ? `<img src="${c.image}" class="comment-img" onclick="openZoom('${c.image}')" style="cursor:zoom-in">` : ''}
          <div class="comment-actions">
             <button class="comment-like-btn ${isLiked ? 'liked' : ''}" onclick="toggleCommentLike(${newsId}, ${c.id})">
               👍 <span id="comment-like-count-${c.id}">${c.likes || 0}</span>
             </button>
             <button class="reply-btn" onclick="toggleReplyForm(${c.id})">Responder</button>
          </div>
          
          <div id="reply-form-${c.id}" class="reply-form-container">
            <form class="comment-form" onsubmit="submitReply(event, ${newsId}, ${c.id})">
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
  }

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

    saveComment(newsId, name, text, null, parentId);
  };

  window.toggleCommentLike = function (newsId, commentId) {
    const key = `softsafe_comments_${newsId}`;
    const comments = JSON.parse(localStorage.getItem(key) || "[]");
    const commentIndex = comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) return;

    const userLikedKey = "softsafe_user_liked_comments";
    const userLiked = JSON.parse(localStorage.getItem(userLikedKey) || "[]");
    const hasLiked = userLiked.includes(commentId);

    if (hasLiked) {
      comments[commentIndex].likes = (comments[commentIndex].likes || 1) - 1;
      const idx = userLiked.indexOf(commentId);
      if (idx > -1) userLiked.splice(idx, 1);
    } else {
      comments[commentIndex].likes = (comments[commentIndex].likes || 0) + 1;
      userLiked.push(commentId);
    }

    localStorage.setItem(key, JSON.stringify(comments));
    localStorage.setItem(userLikedKey, JSON.stringify(userLiked));
    loadComments(newsId);
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
        backToTopBtn.style.display = "block";
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
    zoomModal.style.display = "block";
    zoomImg.src = src;
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    zoomImg.style.transform = ""; // Limpa transformações inline para permitir animação CSS
    zoomImg.style.cursor = "grab";
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
  function closeModalWithFade(modalElement, callback) {
    if (!modalElement) return;
    modalElement.classList.add("fade-out");
    setTimeout(() => {
      modalElement.style.display = "none";
      modalElement.classList.remove("fade-out");
      if (callback) callback();
    }, 300); // Match animation duration
  }

  // Open modal with product details
  function openModal(product) {
    document.getElementById("modal-title").textContent = product.title;
    document.getElementById("modal-size").textContent = product.size;
    document.getElementById("modal-version").textContent = product.version;
    document.getElementById("modal-compatibility").textContent = product.compatibility;
    document.getElementById("modal-description").innerHTML = product.description.replace(/\n/g, '<br>');

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

  // Close modal
  closeBtn.addEventListener("click", () => {
    closeModalWithFade(modal, () => {
    });
  });

  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      closeModalWithFade(modal, () => {
      });
    }
    if (event.target == shareModal) {
      closeModalWithFade(shareModal);
    }
    if (event.target == welcomeModal) {
      closeWelcome();
    }
  });

  if (closeShareBtn) {
    closeShareBtn.addEventListener("click", () => {
      if (shareModal) closeModalWithFade(shareModal);
    });
  }

  // Theme Toggle Logic
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      themeToggleBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
    });
  }

  // Close modals on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modal && modal.style.display === "block") closeModalWithFade(modal);
      if (zoomModal && zoomModal.style.display === "block") closeModalWithFade(zoomModal);
      if (shareModal && shareModal.style.display === "block") closeModalWithFade(shareModal);
      if (welcomeModal && welcomeModal.style.display === "block") closeWelcome();

      // Close burger menu
      if (navMenu && navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
        if (menuOverlay) menuOverlay.classList.remove("active");
      }
    }
  });

  // Dynamic Copyright Year
  const footerP = document.querySelector(".footer p");
  if (footerP) {
    const currentYear = new Date().getFullYear();
    footerP.innerHTML = `&copy; ${currentYear} SoftSafe — Todos os direitos reservados`;
  }
});

function scrollToProducts() {
  document.getElementById("produtos").scrollIntoView({
    behavior: "smooth"
  });
}
