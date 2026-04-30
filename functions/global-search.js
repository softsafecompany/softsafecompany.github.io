(() => {
  function runGlobalSearch(event) {
    const searchBar = document.getElementById("search-bar");
    if (!searchBar) return;

    const raw = searchBar.value || "";
    const query = raw.trim();

    if (!query) return;

    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
    }

    const targetUrl = `info.html#busca?q=${encodeURIComponent(query)}`;
    window.location.href = targetUrl;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const searchBar = document.getElementById("search-bar");
    const searchButton = document.getElementById("search-button");

    if (!searchBar || !searchButton) return;

    searchButton.addEventListener("click", runGlobalSearch, true);
    searchBar.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          runGlobalSearch(event);
        }
      },
      true
    );

    const moreItems = document.querySelectorAll(".nav-more");
    moreItems.forEach((item) => {
      const btn = item.querySelector(".nav-more-btn");
      if (!btn) return;

      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !item.classList.contains("open");
        moreItems.forEach((m) => m.classList.remove("open"));
        item.classList.toggle("open", willOpen);
        btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });
    });

    document.addEventListener("click", (event) => {
      moreItems.forEach((item) => {
        if (!item.contains(event.target)) {
          item.classList.remove("open");
          const btn = item.querySelector(".nav-more-btn");
          if (btn) btn.setAttribute("aria-expanded", "false");
        }
      });
    });
  });
})();
