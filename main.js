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

  let allProducts = [];
  let currentFilteredProducts = [];
  const ITEMS_PER_PAGE = 6;
  let currentPage = 1;
  let currentCarouselIndex = 0;
  let currentMedia = [];

  // Inject CSS for animations
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes skeleton-pulse {
      0% { opacity: 0.6; }
      50% { opacity: 0.3; }
      100% { opacity: 0.6; }
    }
    .skeleton-anim {
      animation: skeleton-pulse 1.5s infinite ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
    /* Carousel & Counter CSS */
    .product-count { text-align: right; margin-bottom: 10px; font-size: 0.9rem; color: #e2e2e2ff; font-weight: 500; }
    .carousel { position: relative; width: 100%; margin-bottom: 20px; overflow: hidden; border-radius: 8px; background:transparent; height: 300px; }
    .carousel-inner { display: flex; transition: transform 0.4s ease-in-out; height: 100%; }
    .carousel-item { min-width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
    .carousel-item img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .carousel-item video { max-width: 100%; max-height: 100%; }
    .carousel-control { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); color: white; border: none; padding: 10px 15px; cursor: pointer; z-index: 10; font-size: 18px; user-select: none; }
    .carousel-control:hover { background: rgba(0,0,0,0.8); }
    .carousel-control.prev { left: 0; }
    .carousel-control.next { right: 0; }
    /* Dots & Zoom */
    .carousel-dots { text-align: center; position: absolute; bottom: 10px; width: 100%; z-index: 15; }
    .dot { cursor: pointer; height: 10px; width: 10px; margin: 0 5px; background-color: #bbb; border-radius: 50%; display: inline-block; transition: background-color 0.6s ease; }
    .dot.active, .dot:hover { background-color: #717171; }
    .zoom-modal { display: none; position: fixed; z-index: 2000; padding-top: 50px; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.9); }
    .zoom-content { margin: auto; display: block; width: 80%; max-width: 700px; animation: zoom 0.6s; }
    @keyframes zoom { from {transform:scale(0)} to {transform:scale(1)} }
    .close-zoom { position: absolute; top: 15px; right: 35px; color: #f1f1f1; font-size: 40px; font-weight: bold; transition: 0.3s; cursor: pointer; }
    .close-zoom:hover, .close-zoom:focus { color: #bbb; text-decoration: none; cursor: pointer; }
  `;
  document.head.appendChild(style);

  function showSkeleton() {
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

  // Create Clear Button
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Limpar";
  clearBtn.style.cssText = "display: none; margin-left: 10px; padding: 10px 15px; background-color: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;";
  if (searchContainer) searchContainer.appendChild(clearBtn);

  // Create Load More Button
  const loadMoreBtn = document.createElement("button");
  loadMoreBtn.textContent = "Carregar Mais";
  loadMoreBtn.style.cssText = "display: none; margin: 20px auto; padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;";
  productList.parentNode.insertBefore(loadMoreBtn, productList.nextSibling);

  // Event Delegation for View More
  productList.addEventListener("click", (e) => {
    if (e.target.classList.contains("view-more-btn")) {
      const productId = parseInt(e.target.getAttribute("data-id"));
      const product = allProducts.find(p => p.id === productId);
      openModal(product);
    }
  });

  function renderBatch() {
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

  clearBtn.addEventListener("click", () => {
    searchBar.value = "";
    performSearch();
  });

  // Fetch product data
  showSkeleton();
  fetch("content.json")
    .then(response => response.json())
    .then(data => {
      allProducts = data;
      renderProducts(allProducts);
    });

  // Search functionality
  function performSearch() {
    const query = searchBar.value.toLowerCase();
    clearBtn.style.display = query.length > 0 ? "inline-block" : "none";
    const filteredProducts = allProducts.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    );
    renderProducts(filteredProducts);
  }

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

  // Carousel Logic
  function renderCarousel() {
    carouselInner.innerHTML = "";
    carouselDots.innerHTML = "";
    currentMedia.forEach((media, index) => {
      const item = document.createElement("div");
      item.className = "carousel-item";
      if (media.type === "video") {
        item.innerHTML = `<video src="${media.src}" controls></video>`;
      } else {
        const img = document.createElement("img");
        img.src = media.src;
        img.alt = "Product Image";
        img.style.cursor = "zoom-in";
        img.onclick = () => openZoom(media.src);
        item.appendChild(img);
      }
      carouselInner.appendChild(item);

      // Create dot
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.onclick = () => {
        currentCarouselIndex = index;
        updateCarouselPosition();
      };
      carouselDots.appendChild(dot);
    });
    updateCarouselPosition();
  }

  function updateCarouselPosition() {
    carouselInner.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
    // Pause videos when sliding away
    const videos = carouselInner.querySelectorAll("video");
    videos.forEach(v => v.pause());

    // Update dots
    const dots = carouselDots.getElementsByClassName("dot");
    for (let i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
    }
    if (dots[currentCarouselIndex]) {
      dots[currentCarouselIndex].className += " active";
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

  carouselInner.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  carouselInner.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

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

  // Zoom Functionality
  function openZoom(src) {
    zoomModal.style.display = "block";
    zoomImg.src = src;
  }

  if (closeZoom) {
    closeZoom.onclick = () => {
      zoomModal.style.display = "none";
    };
  }

  window.addEventListener("click", (e) => {
    if (e.target === zoomModal) {
      zoomModal.style.display = "none";
    }
  });

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
      carouselContainer.style.display = "block";
      // Show/Hide controls based on count
      if (currentMedia.length > 1) {
        btnPrev.style.display = "block";
        btnNext.style.display = "block";
      } else {
        btnPrev.style.display = "none";
        btnNext.style.display = "none";
      }
    } else {
      // Fallback to single image if no media array
      currentMedia = [{ type: 'image', src: product.image }];
      carouselContainer.style.display = "block";
      btnPrev.style.display = "none";
      btnNext.style.display = "none";
    }
    renderCarousel();

    const downloadBtn = document.querySelector(".download-btn");

    // Reset button state
    downloadBtn.classList.remove("downloading");
    downloadBtn.textContent = "Download";
    downloadBtn.disabled = false;

    downloadBtn.onclick = () => {
      downloadBtn.classList.add("downloading");
      downloadBtn.textContent = "Baixando...";
      downloadBtn.disabled = true;
      window.location.href = product.download_link;
    };

    modal.style.display = "block";
  }

  // Close modal
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  });
});

function scrollToProducts() {
  document.getElementById("produtos").scrollIntoView({
    behavior: "smooth"
  });
}
