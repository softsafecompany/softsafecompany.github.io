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

function getTabFromHash() {
  const raw = (window.location.hash || "#sobre").replace("#", "").toLowerCase();
  if (["sobre", "faq", "contato"].includes(raw)) return raw;
  return "sobre";
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
        <button class="info-faq-question" type="button">${item.question || "Pergunta"}</button>
        <div class="info-faq-answer">${item.answer || ""}</div>
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

async function renderCurrentTab() {
  const tab = getTabFromHash();

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
