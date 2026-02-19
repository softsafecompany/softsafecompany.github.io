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
  });
})();
