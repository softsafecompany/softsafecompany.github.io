document.addEventListener("DOMContentLoaded", () => {
  const productList = document.getElementById("product-list");
  const modal = document.getElementById("product-modal");
  const closeBtn = document.querySelector(".close");

  // Fetch product data
  fetch("content.json")
    .then(response => response.json())
    .then(data => {
      data.forEach(product => {
        const productCard = `
          <div class="produto">
            <img src="${product.image}" alt="${product.name}">
            <h4>${product.name}</h4>
            <button class="view-more-btn" data-id="${product.id}">Ver Mais</button>
          </div>
        `;
        productList.innerHTML += productCard;
      });

      // Add event listeners to "Ver Mais" buttons
      const viewMoreBtns = document.querySelectorAll(".view-more-btn");
      viewMoreBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          const productId = parseInt(btn.getAttribute("data-id"));
          const product = data.find(p => p.id === productId);
          openModal(product);
        });
      });
    });

  // Open modal with product details
  function openModal(product) {
    document.getElementById("modal-title").textContent = product.title;
    document.getElementById("modal-size").textContent = product.size;
    document.getElementById("modal-version").textContent = product.version;
    document.getElementById("modal-compatibility").textContent = product.compatibility;
    document.getElementById("modal-description").textContent = product.description;
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
