const infoTitle = document.getElementById("info-title");
const infoContent = document.getElementById("info-content");
const navMenu = document.getElementById("nav-menu");
const burgerMenu = document.getElementById("burger-menu");
const menuOverlay = document.getElementById("menu-overlay");
const loginBtn = document.getElementById("login-btn");
const notificationBtn = document.getElementById("notification-btn");
const notificationDropdown = document.getElementById("notification-dropdown");

const aboutHtml = `
  <div class="info-tab-links">
    <a class="info-tab-link" href="#sobre" data-tab-link="sobre">Sobre</a>
    <a class="info-tab-link" href="#faq" data-tab-link="faq">FAQ</a>
    <a class="info-tab-link" href="#contato" data-tab-link="contato">Contato</a>
    <a class="info-tab-link" href="#busca" data-tab-link="busca">Busca</a>
  </div>
  <p>
    Desenvolvemos software focado em sistemas operacionais, seguindo principios classicos de eficiencia,
    estabilidade e seguranca. Nossos produtos sao projetados para usuarios que buscam controle total do sistema,
    sem abrir mao de simplicidade, desempenho e confiabilidade.
  </p>
  <p>
    Com uma equipe dedicada e apaixonada por tecnologia, entregamos solucoes que ajudam no dia a dia:
    otimizar desempenho, reforcar seguranca e tornar a experiencia de uso mais agradavel.
    Na SoftSafe, software deve ser uma extensao natural do usuario.
  </p>
`;

function normalizeText(text) {
  return (text || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeHtml(value) {
  return (value || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function readHashState() {
  const hash = window.location.hash || "#sobre";
  const hashBody = hash.startsWith("#") ? hash.slice(1) : hash;
  const [tabRaw, queryRaw] = hashBody.split("?");
  const tab = (tabRaw || "sobre").toLowerCase();
  const params = new URLSearchParams(queryRaw || "");
  const query = (params.get("q") || "").trim();
  const validTab = ["sobre", "faq", "contato", "busca"].includes(tab)
    ? tab
    : "sobre";

  return { tab: validTab, query };
}

function setActiveNav(tab) {
  document.querySelectorAll("#nav-menu a[data-tab]").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("data-tab") === tab);
  });
  document.querySelectorAll("[data-tab-link]").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("data-tab-link") === tab);
  });
}

function renderAbout() {
  infoTitle.textContent = "Sobre a SoftSafe";
  infoContent.innerHTML = aboutHtml;
  setActiveNav("sobre");
}

function renderFaqLoading() {
  infoTitle.textContent = "Perguntas Frequentes";
  infoContent.innerHTML = '<p>Carregando FAQ...</p>';
  setActiveNav("faq");
}

function renderFaq(items) {
  const html = items
    .map(
      (item) => `
      <article class="info-faq-item">
        <button class="info-faq-question" type="button">${escapeHtml(item.question || "Pergunta")}</button>
        <div class="info-faq-answer">${escapeHtml(item.answer || "")}</div>
      </article>
    `
    )
    .join("");

  infoTitle.textContent = "Perguntas Frequentes";
  infoContent.innerHTML = `
    <div class="info-tab-links">
      <a class="info-tab-link" href="#sobre" data-tab-link="sobre">Sobre</a>
      <a class="info-tab-link" href="#faq" data-tab-link="faq">FAQ</a>
      <a class="info-tab-link" href="#contato" data-tab-link="contato">Contato</a>
      <a class="info-tab-link" href="#busca" data-tab-link="busca">Busca</a>
    </div>
    <div class="info-faq-list">${html}</div>
  `;
  setActiveNav("faq");

  infoContent.querySelectorAll(".info-faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.parentElement.classList.toggle("active");
    });
  });
}

function renderContato() {
  infoTitle.textContent = "Contato";
  infoContent.innerHTML = `
    <div class="info-tab-links">
      <a class="info-tab-link" href="#sobre" data-tab-link="sobre">Sobre</a>
      <a class="info-tab-link" href="#faq" data-tab-link="faq">FAQ</a>
      <a class="info-tab-link" href="#contato" data-tab-link="contato">Contato</a>
      <a class="info-tab-link" href="#busca" data-tab-link="busca">Busca</a>
    </div>
    <div class="info-contact-grid">
      <article class="info-card">
        <h3>WhatsApp</h3>
        <p>Atendimento direto e rapido.</p>
        <a href="https://wa.me/258842539668" target="_blank" rel="noopener">Abrir WhatsApp</a>
      </article>
      <article class="info-card">
        <h3>Apoio / Suporte</h3>
        <p>Contribuicao e suporte oficial da plataforma.</p>
        <a href="https://www.paypal.com/ncp/payment/984SMG97UGV6N" target="_blank" rel="noopener">Abrir suporte</a>
      </article>
    </div>
    <form id="info-contact-form" class="info-form">
      <input id="info-name" type="text" placeholder="Seu nome" required>
      <input id="info-email" type="email" placeholder="Seu email" required>
      <textarea id="info-msg" placeholder="Sua mensagem" required></textarea>
      <button type="submit">Enviar pelo WhatsApp</button>
    </form>
  `;
  setActiveNav("contato");

  const form = document.getElementById("info-contact-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("info-name").value.trim();
    const email = document.getElementById("info-email").value.trim();
    const msg = document.getElementById("info-msg").value.trim();
    const text = `Nome: ${name}%0AEmail: ${email}%0AMensagem: ${msg}`;
    window.open(`https://wa.me/258842539668?text=${text}`, "_blank", "noopener");
  });
}

function productMatches(product, normalizedQuery) {
  const haystack = normalizeText(
    [
      product.name,
      product.title,
      product.description,
      product.compatibility,
      product.version
    ].join(" ")
  );
  return haystack.includes(normalizedQuery);
}

function faqMatches(item, normalizedQuery) {
  const haystack = normalizeText([item.question, item.answer].join(" "));
  return haystack.includes(normalizedQuery);
}

function highlightText(text, rawQuery) {
  const safeText = escapeHtml(text || "");
  const q = (rawQuery || "").trim();
  if (!q) return safeText;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  return safeText.replace(regex, "<mark>$1</mark>");
}

function renderSearchLoading(query) {
  infoTitle.textContent = "Resultados da busca";
  infoContent.innerHTML = `
    <div class="info-tab-links">
      <a class="info-tab-link" href="#sobre" data-tab-link="sobre">Sobre</a>
      <a class="info-tab-link" href="#faq" data-tab-link="faq">FAQ</a>
      <a class="info-tab-link" href="#contato" data-tab-link="contato">Contato</a>
      <a class="info-tab-link active" href="#busca" data-tab-link="busca">Busca</a>
    </div>
    <p>Buscando por: <strong>${escapeHtml(query || "-")}</strong></p>
    <p>Carregando resultados...</p>
  `;
  setActiveNav("busca");
}

function renderSearchResults(query, products, faqItems) {
  const safeQuery = escapeHtml(query);
  const normalized = normalizeText(query);

  const productResults = products.filter((p) => productMatches(p, normalized));
  const faqResults = faqItems.filter((f) => faqMatches(f, normalized));

  const productHtml =
    productResults.length > 0
      ? productResults
          .map((product) => {
            const title = product.name || "Produto";
            const desc =
              (product.description || "").replace(/\s+/g, " ").trim().slice(0, 190) +
              ((product.description || "").length > 190 ? "..." : "");
            return `
              <article class="info-result-item">
                <p class="info-result-type">Produto</p>
                <h3><a href="index.html?produto=${encodeURIComponent(product.id || "")}">${highlightText(title, query)}</a></h3>
                <p>${highlightText(desc, query)}</p>
              </article>
            `;
          })
          .join("")
      : '<p class="info-result-empty">Nenhum produto encontrado para essa busca.</p>';

  const faqHtml =
    faqResults.length > 0
      ? faqResults
          .map(
            (item) => `
              <article class="info-result-item">
                <p class="info-result-type">FAQ</p>
                <h3>${highlightText(item.question || "Pergunta", query)}</h3>
                <p>${highlightText(item.answer || "", query)}</p>
              </article>
            `
          )
          .join("")
      : '<p class="info-result-empty">Nenhuma pergunta do FAQ encontrada para essa busca.</p>';

  infoTitle.textContent = "Resultados da busca";
  infoContent.innerHTML = `
    <div class="info-tab-links">
      <a class="info-tab-link" href="#sobre" data-tab-link="sobre">Sobre</a>
      <a class="info-tab-link" href="#faq" data-tab-link="faq">FAQ</a>
      <a class="info-tab-link" href="#contato" data-tab-link="contato">Contato</a>
      <a class="info-tab-link active" href="#busca" data-tab-link="busca">Busca</a>
    </div>
    <p class="info-search-summary">Busca por: <strong>${safeQuery}</strong></p>
    <section class="info-search-group">
      <h2>Produtos (${productResults.length})</h2>
      ${productHtml}
    </section>
    <section class="info-search-group">
      <h2>FAQ (${faqResults.length})</h2>
      ${faqHtml}
    </section>
  `;
  setActiveNav("busca");
}

async function renderCurrentTab() {
  const { tab, query } = readHashState();

  if (tab === "sobre") {
    renderAbout();
    return;
  }

  if (tab === "faq") {
    renderFaqLoading();
    try {
      const resp = await fetch("functions/faq.json", { cache: "no-store" });
      const data = await resp.json();
      renderFaq(Array.isArray(data) ? data : []);
    } catch (error) {
      infoContent.innerHTML = '<p>Nao foi possivel carregar o FAQ.</p>';
    }
    return;
  }

  if (tab === "busca") {
    if (!query) {
      infoTitle.textContent = "Resultados da busca";
      infoContent.innerHTML = `
        <div class="info-tab-links">
          <a class="info-tab-link" href="#sobre" data-tab-link="sobre">Sobre</a>
          <a class="info-tab-link" href="#faq" data-tab-link="faq">FAQ</a>
          <a class="info-tab-link" href="#contato" data-tab-link="contato">Contato</a>
          <a class="info-tab-link active" href="#busca" data-tab-link="busca">Busca</a>
        </div>
        <p>Digite algo na barra de pesquisa para buscar em Produtos e FAQ.</p>
      `;
      setActiveNav("busca");
      return;
    }

    renderSearchLoading(query);
    try {
      const [productsResp, faqResp] = await Promise.all([
        fetch("functions/content.json", { cache: "no-store" }),
        fetch("functions/faq.json", { cache: "no-store" })
      ]);
      const [productsData, faqData] = await Promise.all([
        productsResp.json(),
        faqResp.json()
      ]);

      renderSearchResults(
        query,
        Array.isArray(productsData) ? productsData : [],
        Array.isArray(faqData) ? faqData : []
      );
    } catch (error) {
      infoContent.innerHTML = "<p>Nao foi possivel carregar os resultados da busca.</p>";
    }
    return;
  }

  renderContato();
}

if (burgerMenu && navMenu) {
  burgerMenu.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    document.body.classList.toggle("menu-open");
    if (menuOverlay) menuOverlay.classList.toggle("active");
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      document.body.classList.remove("menu-open");
      if (menuOverlay) menuOverlay.classList.remove("active");
    });
  });

  if (menuOverlay) {
    menuOverlay.addEventListener("click", () => {
      navMenu.classList.remove("active");
      document.body.classList.remove("menu-open");
      menuOverlay.classList.remove("active");
    });
  }
}

window.addEventListener("hashchange", renderCurrentTab);
renderCurrentTab();

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    window.location.href = "perfil.html";
  });
}

if (notificationBtn && notificationDropdown) {
  notificationBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    notificationDropdown.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
      notificationDropdown.classList.remove("active");
    }
  });
}
