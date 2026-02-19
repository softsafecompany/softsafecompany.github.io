import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, increment, onSnapshot, addDoc, query, orderBy, getDocs, where, runTransaction, deleteDoc, collectionGroup, writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, updatePassword, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref, uploadString, getDownloadURL, uploadBytesResumable, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

// --- CONFIGURAÇÃO DO FIREBASE ---

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
const storage = getStorage(app);
const functions = getFunctions(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Erro ao definir persistência:", error);
});

let currentUser = null;
let unsubscribeComments = null; // To manage real-time listener
let unsubscribeNotifications = null; // For reply notifications
let unsubscribeProduct = null; // Listener do produto aberto
let unsubscribeProductComments = null; // Listener de comentários do produto
let unsubscribeUserProfile = null; // Listener do perfil do usuário logado
let userRatingSelection = 0; // Nota selecionada pelo usuário
let isUserRating = false; // Se o usuário está interagindo com as estrelas

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
  const suggestionsContainer = document.getElementById("suggestions-container");
  const resetZoomBtn = document.getElementById("reset-zoom");
  const progressBar = document.getElementById("progress-bar");
  const sobreSection = document.getElementById("sobre");
  const backToTopBtn = document.getElementById("back-to-top");
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
  const notificationBtn = document.getElementById("notification-btn");
  const notificationDropdown = document.getElementById("notification-dropdown");
  const notificationList = document.getElementById("notification-list");
  const notificationCount = document.getElementById("notification-count");
  const markAllReadBtn = document.getElementById("mark-all-read");
  const loginBtn = document.getElementById("login-btn");
  const loginModal = document.getElementById("login-modal");
  const closeLoginBtn = document.querySelector(".close-login");
  const googleLoginBtn = document.getElementById("google-login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const profileName = document.getElementById("profile-name");
  const profileEmail = document.getElementById("profile-email");
  const profileImg = document.getElementById("profile-img");
  const profileImgContainer = document.getElementById("profile-img-container");
  const profileUpload = document.getElementById("profile-upload");
  const editNameBtn = document.getElementById("edit-name-btn");
  const resetPasswordBtn = document.getElementById("reset-password-btn");
  const deleteAccountBtn = document.getElementById("delete-account-btn");
  const signupPassInput = document.getElementById("signup-pass");
  const signupStrengthBar = document.getElementById("signup-strength-bar");
  const signupStrengthText = document.getElementById("signup-strength-text");
  const forgotPasswordLink = document.getElementById("forgot-password-link");

  // --- Product Page (Dynamic) ---
  const productPageHTML = `
    <section id="product-page" class="product-page" style="display:none;">
      <div class="product-page-header">
        <button id="product-page-back" class="product-page-back">
          <i class="fas fa-arrow-left"></i> Voltar
        </button>
      </div>
      <div class="product-page-content">
        <div class="product-page-media">
          <div class="carousel product-page-carousel" id="product-page-carousel" style="display:none;">
            <div class="carousel-inner" id="product-page-carousel-inner"></div>
            <button class="carousel-control prev" id="product-page-carousel-prev">&#10094;</button>
            <button class="carousel-control next" id="product-page-carousel-next">&#10095;</button>
            <div class="carousel-dots" id="product-page-carousel-dots"></div>
          </div>
          <div id="product-page-thumbnails" class="product-page-thumbnails"></div>
          <div id="product-page-media-fallback"></div>
        </div>
        <div class="product-page-info">
          <h1 id="product-page-title"></h1>
          <p id="product-page-subtitle" class="product-page-subtitle"></p>
          <div class="product-page-meta" id="product-page-meta"></div>
          <p id="product-page-description" class="product-page-description"></p>
          <div class="rating-container product-page-rating-container">
            <div id="product-page-star-rating" class="stars">
              <span class="star product-page-star" data-value="1">★</span>
              <span class="star product-page-star" data-value="2">★</span>
              <span class="star product-page-star" data-value="3">★</span>
              <span class="star product-page-star" data-value="4">★</span>
              <span class="star product-page-star" data-value="5">★</span>
            </div>
            <span id="product-page-rating-count">(0 avaliacoes)</span>
          </div>
          <div class="rating-form product-page-rating-form">
            <textarea id="product-page-rating-comment" placeholder="Escreva um comentario sobre o produto (opcional)"></textarea>
            <button id="product-page-submit-rating-btn" class="download-btn" style="font-size: 0.9rem; padding: 8px 15px; margin-top: 5px">Enviar</button>
          </div>
          <div id="product-page-comments-container" class="product-page-comments-container">
            <h3>Avaliacoes</h3>
            <div id="product-page-comments-list" class="comment-list"></div>
          </div>
          <div class="product-page-actions">
            <a id="product-page-download" class="download-btn" target="_blank" rel="noopener">Download</a>
            <div class="product-page-share-group">
              <span class="product-page-share-label">Compartilhar</span>
              <div class="product-page-share-buttons">
                <button id="product-page-whatsapp" class="whatsapp-share-btn">
                  <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <a id="product-page-facebook" class="product-share-btn facebook" target="_blank" rel="noopener">
                  <i class="fab fa-facebook-f"></i> Facebook
                </a>
                <a id="product-page-x" class="product-share-btn x" target="_blank" rel="noopener">
                  <i class="fab fa-x-twitter"></i> X
                </a>
                <button id="product-page-copy-link" class="share-action-btn">Copiar link</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
  if (document.querySelector(".header")) {
    document.querySelector(".header").insertAdjacentHTML("afterend", productPageHTML);
  }
  const productPage = document.getElementById("product-page");
  const productPageBack = document.getElementById("product-page-back");
  const productPageCarousel = document.getElementById("product-page-carousel");
  const productPageCarouselInner = document.getElementById("product-page-carousel-inner");
  const productPageCarouselPrev = document.getElementById("product-page-carousel-prev");
  const productPageCarouselNext = document.getElementById("product-page-carousel-next");
  const productPageCarouselDots = document.getElementById("product-page-carousel-dots");
  const productPageThumbnails = document.getElementById("product-page-thumbnails");
  const productPageMediaFallback = document.getElementById("product-page-media-fallback");
  const productPageTitle = document.getElementById("product-page-title");
  const productPageSubtitle = document.getElementById("product-page-subtitle");
  const productPageMeta = document.getElementById("product-page-meta");
  const productPageDescription = document.getElementById("product-page-description");
  const productPageDownload = document.getElementById("product-page-download");
  const productPageWhatsapp = document.getElementById("product-page-whatsapp");
  const productPageFacebook = document.getElementById("product-page-facebook");
  const productPageX = document.getElementById("product-page-x");
  const productPageCopyLink = document.getElementById("product-page-copy-link");
  const productPageStars = document.querySelectorAll(".product-page-star");
  const productPageRatingCount = document.getElementById("product-page-rating-count");
  const productPageRatingComment = document.getElementById("product-page-rating-comment");
  const productPageSubmitRatingBtn = document.getElementById("product-page-submit-rating-btn");
  const productPageCommentsList = document.getElementById("product-page-comments-list");

  // State for Filters and Cart
  let currentFilter = 'all';

  // Auth Elements
  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");
  const formLogin = document.getElementById("form-login");
  const formSignup = document.getElementById("form-signup");
  const manualLoginBtn = document.getElementById("manual-login-btn");
  const manualSignupBtn = document.getElementById("manual-signup-btn");
  const signupPhoto = document.getElementById("signup-photo");

  // Configurar ação padrão do botão de login (fallback antes do Auth carregar)
  if (loginBtn) {
    loginBtn.onclick = () => {
      if (loginModal) loginModal.style.display = "block";
    };
  }

  function getDefaultDisplayName(user) {
    if (!user) return "Usuário";
    if (user.displayName) return user.displayName;
    if (user.email) return user.email.split("@")[0];
    return "Usuário";
  }

  function setLoginBtnGuest() {
    if (!loginBtn) return;
    loginBtn.innerHTML = '<i class="fa-solid fa-user login-icon"></i>';
    loginBtn.onclick = () => { if (loginModal) loginModal.style.display = "block"; };
  }

  function setLoginBtnUser(displayName, photoURL) {
    if (!loginBtn) return;
    loginBtn.innerHTML = "";

    const chip = document.createElement("span");
    chip.className = "login-user-chip";

    const avatar = document.createElement("img");
    avatar.className = "login-user-avatar";
    avatar.src = photoURL || "assets/default-avatar.png";
    avatar.alt = "Foto de perfil";
    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = "assets/default-avatar.png";
    };

    const name = document.createElement("span");
    name.className = "login-user-name";
    name.textContent = displayName || "Usuário";

    chip.appendChild(avatar);
    chip.appendChild(name);
    loginBtn.appendChild(chip);
    loginBtn.onclick = () => window.location.href = "perfil.html";
  }

  // Idioma fixo em Português
  let currentLang = "pt";

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

  window.customPrompt = function (message, title = "Entrada", isPassword = false) {
    return new Promise((resolve) => {
      dialogTitle.textContent = title;
      dialogMessage.textContent = message;
      dialogInputContainer.style.display = 'block';
      dialogInput.value = '';
      dialogInput.type = isPassword ? 'password' : 'text';
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

  // --- Loading Overlay ---
  const loadingOverlayHTML = `
    <div id="loading-overlay" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Processando...</p>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', loadingOverlayHTML);
  const loadingOverlay = document.getElementById("loading-overlay");
  const toggleLoading = (show) => { if (loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none'; };

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

  // Garantir que o spinner seja removido quando a página carregar completamente
  window.addEventListener('load', () => toggleLoading(false));
  setTimeout(() => toggleLoading(false), 8000); // Timeout de segurança

  // --- Filters UI Injection ---
  if (productList) {
    const filterHTML = `
      <div class="filter-container">
        <button class="filter-btn active" data-filter="all">Todos</button>
        <button class="filter-btn" data-filter="free">Gratuitos</button>
        <button class="filter-btn" data-filter="paid">Pagos</button>
      </div>
    `;
    productList.insertAdjacentHTML('beforebegin', filterHTML);

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.getAttribute('data-filter');
        applyFilters();
      });
    });
  }

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

  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    renderFooter();
    if (user) {
      // Listen for notifications
      listenForNotifications(user.uid);

      // Update Login Button Logic
      if (!user.isAnonymous) {
        if (unsubscribeUserProfile) {
          unsubscribeUserProfile();
          unsubscribeUserProfile = null;
        }

        const fallbackName = getDefaultDisplayName(user);
        const fallbackPhoto = user.photoURL || "assets/default-avatar.png";
        setLoginBtnUser(fallbackName, fallbackPhoto);

        unsubscribeUserProfile = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const resolvedName = data.displayName || fallbackName;
            const resolvedPhoto = data.photoURL || fallbackPhoto;

            setLoginBtnUser(resolvedName, resolvedPhoto);
            if (profileName) profileName.textContent = resolvedName;
            if (profileImg) profileImg.src = resolvedPhoto;
          } else {
            setLoginBtnUser(fallbackName, fallbackPhoto);
            if (profileName) profileName.textContent = fallbackName;
            if (profileImg) profileImg.src = fallbackPhoto;
            setDoc(
              doc(db, "users", user.uid),
              { displayName: fallbackName, photoURL: user.photoURL || "", email: user.email || "" },
              { merge: true }
            );
          }

          if (profileEmail) profileEmail.textContent = user.email || "";
        }, () => {
          setLoginBtnUser(fallbackName, fallbackPhoto);
          if (profileName) profileName.textContent = fallbackName;
          if (profileImg) profileImg.src = fallbackPhoto;
          if (profileEmail) profileEmail.textContent = user.email || "";
        });
      } else {
        // Usuário Anônimo -> Botão Login
        if (unsubscribeUserProfile) {
          unsubscribeUserProfile();
          unsubscribeUserProfile = null;
        }
        setLoginBtnGuest();
        // Redirect anonymous from profile
        if (profileName) window.location.href = "index.html";
      }
    } else {
      // Se nenhum usuário estiver logado (nem Google, nem Anônimo), autenticar anonimamente (apenas se não estiver na página de perfil)
      signInAnonymously(auth).catch((error) => {
        console.error("Erro Auth:", error);
      });

      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }
      if (unsubscribeUserProfile) {
        unsubscribeUserProfile();
        unsubscribeUserProfile = null;
      }
      setLoginBtnGuest();
      // Redirect logged out from profile
      if (profileName) window.location.href = "index.html";
    }
  });

  // --- Auth Tabs Logic ---
  if (tabLogin && tabSignup) {
    tabLogin.addEventListener("click", () => {
      tabLogin.classList.add("active");
      tabSignup.classList.remove("active");
      formLogin.style.display = "flex";
      formSignup.style.display = "none";
    });
    tabSignup.addEventListener("click", () => {
      tabSignup.classList.add("active");
      tabLogin.classList.remove("active");
      formSignup.style.display = "flex";
      formLogin.style.display = "none";
    });
  }

  // --- Manual Login Logic ---
  if (manualLoginBtn) {
    manualLoginBtn.addEventListener("click", () => {
      const email = document.getElementById("login-email").value;
      const pass = document.getElementById("login-pass").value;
      if (!email || !pass) return showToast("Preencha todos os campos.", "error");

      toggleLoading(true);
      signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
          toggleLoading(false);
          showToast("Login realizado!", "success");
          if (loginModal) closeModalWithFade(loginModal);
        })
        .catch((error) => {
          toggleLoading(false);
          console.error(error);
          if (error.code === 'auth/invalid-credential') showToast("E-mail ou senha incorretos.", "error");
          else showToast("Erro ao fazer login.", "error");
        });
    });
  }

  // --- Manual Signup Logic ---
  if (manualSignupBtn) {
    manualSignupBtn.addEventListener("click", () => {
      const email = document.getElementById("signup-email").value;
      const pass = document.getElementById("signup-pass").value;
      const confirm = document.getElementById("signup-confirm").value;
      const age = document.getElementById("signup-age").value;
      const country = document.getElementById("signup-country").value;
      const file = signupPhoto ? signupPhoto.files[0] : null;

      if (!email || !pass || !confirm || !age || !country) return showToast("Preencha todos os campos obrigatórios.", "error");
      if (pass !== confirm) return showToast("As senhas não coincidem.", "error");

      toggleLoading(true);
      createUserWithEmailAndPassword(auth, email, pass)
        .then(async (userCredential) => {
          const user = userCredential.user;
          let photoURL = "";

          // Upload Photo if exists
          if (file) {
            await new Promise((resolve) => {
              resizeImage(file, 500, 500, (base64) => {
                const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
                uploadString(storageRef, base64, 'data_url')
                  .then(() => getDownloadURL(storageRef))
                  .then((url) => {
                    photoURL = url;
                    resolve();
                  })
                  .catch((err) => {
                    console.error("Erro upload imagem signup:", err);
                    resolve(); // Continua mesmo se falhar o upload
                  });
              });
            });
          }

          // Update Profile
          const signupDisplayName = email.split('@')[0];
          await updateProfile(user, {
            photoURL: photoURL,
            displayName: signupDisplayName
          });

          // Save extra data to Firestore
          await setDoc(doc(db, "users", user.uid), {
            email: email,
            age: age,
            country: country,
            photoURL: photoURL,
            displayName: signupDisplayName, // Default display name
            createdAt: new Date()
          }, { merge: true });

          toggleLoading(false);
          showToast("Conta criada com sucesso!", "success");
          if (loginModal) closeModalWithFade(loginModal);
        })
        .catch((error) => {
          toggleLoading(false);
          console.error(error);
          if (error.code === 'auth/email-already-in-use') showToast("Este e-mail já está em uso.", "error");
          else if (error.code === 'auth/weak-password') showToast("A senha é muito fraca.", "error");
          else showToast("Erro ao criar conta.", "error");
        });
    });
  }

  // --- Require Login Helper ---
  function requireLogin(callback) {
    if (currentUser && !currentUser.isAnonymous) {
      callback();
    } else {
      customConfirmLogin("Iniciar sessão para interagir", "Aviso").then((shouldLogin) => {
        if (shouldLogin) {
          if (loginModal) loginModal.style.display = "block";
        }
      });
    }
  }

  // Custom Confirm for Login
  window.customConfirmLogin = function (message, title) {
    return new Promise((resolve) => {
      dialogTitle.textContent = title;
      dialogMessage.textContent = message;
      dialogInputContainer.style.display = 'none';

      dialogOk.textContent = "Iniciar sessão";
      dialogCancel.textContent = "Fechar";
      dialogCancel.style.display = 'inline-block';

      dialogOverlay.classList.add('active');

      dialogOk.onclick = () => {
        dialogOverlay.classList.remove('active');
        // Reset buttons
        dialogOk.textContent = "OK";
        dialogCancel.textContent = "Cancelar";
        resolve(true);
      };
      dialogCancel.onclick = () => {
        dialogOverlay.classList.remove('active');
        dialogOk.textContent = "OK";
        dialogCancel.textContent = "Cancelar";
        resolve(false);
      };
    });
  };

  // Profile Image Upload & Resize Logic
  function resizeImage(file, maxWidth, maxHeight, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Quality 0.8 JPEG
        callback(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (profileImgContainer && profileUpload) {
    // --- Profile Image Logic (Preview, Delete, Crop) ---
    const profileModalsHTML = `
      <div id="profile-preview-modal" class="profile-preview-modal">
        <div class="profile-preview-content">
          <h3 class="profile-preview-title">Foto de Perfil</h3>
          <div class="profile-preview-image-box">
            <img id="profile-preview-img" src="" class="profile-preview-img">
          </div>
          <div id="preview-actions-default" class="profile-action-row">
            <button id="btn-delete-photo" class="btn-danger">Apagar</button>
            <button id="btn-change-photo" class="btn-primary">Alterar</button>
          </div>
          <div id="preview-actions-confirm" class="profile-action-row" style="display:none;">
             <button id="btn-cancel-confirm" class="btn-secondary">Cancelar</button>
             <button id="btn-confirm-photo" class="btn-success">Salvar Foto</button>
          </div>
          <div id="upload-progress-container" class="upload-progress-container">
            <div class="upload-progress-track">
              <div id="upload-progress-bar" class="upload-progress-bar"></div>
            </div>
            <p id="upload-progress-text" class="upload-progress-text">0%</p>
          </div>
          <button id="close-profile-preview" class="close-preview-btn">&times;</button>
        </div>
      </div>

      <div id="crop-modal" class="crop-modal">
        <div id="crop-modal-content" class="crop-modal-content">
          <h3 class="crop-title">Ajustar Foto</h3>
          <div id="crop-area" class="crop-area">
            <img id="crop-img" src="" class="crop-img">
            <div id="crop-drop-zone" class="crop-drop-zone">Solte a imagem aqui</div>
          </div>
          <div class="crop-controls">
            <label class="crop-label">Zoom: <input type="range" id="crop-zoom-range" min="0.5" max="3" step="0.1" value="1"></label>
          </div>
          <div class="crop-actions">
            <button id="btn-cancel-crop" class="btn-secondary">Cancelar</button>
            <button id="btn-save-crop" class="btn-success">Pré-visualizar</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', profileModalsHTML);

    const profilePreviewModal = document.getElementById("profile-preview-modal");
    const profilePreviewImg = document.getElementById("profile-preview-img");
    const btnDeletePhoto = document.getElementById("btn-delete-photo");
    const btnChangePhoto = document.getElementById("btn-change-photo");
    const btnConfirmPhoto = document.getElementById("btn-confirm-photo");
    const btnCancelConfirm = document.getElementById("btn-cancel-confirm");
    const previewActionsDefault = document.getElementById("preview-actions-default");
    const previewActionsConfirm = document.getElementById("preview-actions-confirm");
    const closeProfilePreview = document.getElementById("close-profile-preview");

    const cropModal = document.getElementById("crop-modal");
    const cropModalContent = document.getElementById("crop-modal-content");
    const cropImg = document.getElementById("crop-img");
    const cropArea = document.getElementById("crop-area");
    const cropDropZone = document.getElementById("crop-drop-zone");
    const cropZoomRange = document.getElementById("crop-zoom-range");
    const btnCancelCrop = document.getElementById("btn-cancel-crop");
    const btnSaveCrop = document.getElementById("btn-save-crop");

    let cropState = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };
    let pendingBlob = null;

    profileImgContainer.addEventListener("click", () => {
      if (profileImg) {
        profilePreviewImg.src = profileImg.src;
        previewActionsDefault.style.display = "flex";
        previewActionsConfirm.style.display = "none";
        profilePreviewModal.style.display = "flex";
      }
    });

    closeProfilePreview.addEventListener("click", () => profilePreviewModal.style.display = "none");
    profilePreviewModal.addEventListener("click", (e) => { if (e.target === profilePreviewModal) profilePreviewModal.style.display = "none"; });

    btnDeletePhoto.addEventListener("click", () => {
      customConfirm("Tem certeza que deseja remover sua foto de perfil?", "Remover Foto").then((confirmed) => {
        if (confirmed && currentUser) {
          toggleLoading(true);
          deleteObject(ref(storage, `users/${currentUser.uid}/profile.jpg`)).catch(() => { });
          updateDoc(doc(db, "users", currentUser.uid), { photoURL: "" })
            .then(() => { toggleLoading(false); showToast("Foto removida!", "success"); profilePreviewModal.style.display = "none"; })
            .catch((err) => { toggleLoading(false); console.error(err); showToast("Erro ao remover foto.", "error"); });
        }
      });
    });

    btnChangePhoto.addEventListener("click", () => {
      profilePreviewModal.style.display = "none";
      profileUpload.click();
    });

    const handleFileSelect = (file) => {
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast("Arquivo muito grande (Max 5MB).", "error");
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          cropImg.src = evt.target.result;
          cropModal.style.display = "flex";
          cropState = { scale: 1, x: 0, y: 0, isDragging: false, startX: 0, startY: 0 };
          cropZoomRange.value = 1;
          cropImg.onload = () => {
            // Ajustar imagem ao tamanho do modal (300x300)
            const containerSize = 300;
            const w = cropImg.naturalWidth;
            const h = cropImg.naturalHeight;
            let scale = w > h ? containerSize / w : containerSize / h;

            cropState.scale = scale;
            cropState.x = (containerSize - w * scale) / 2;
            cropState.y = (containerSize - h * scale) / 2;

            cropZoomRange.min = scale * 0.5;
            cropZoomRange.max = scale * 3;
            cropZoomRange.step = scale * 0.1;
            cropZoomRange.value = scale;
            updateCropTransform();
          };
        };
        reader.readAsDataURL(file);
      }
    };

    profileUpload.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
      profileUpload.value = "";
    });

    // Drag and Drop Logic for Crop Modal
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      cropModalContent.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
      cropModalContent.addEventListener(eventName, () => cropDropZone.style.display = 'flex', false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      cropModalContent.addEventListener(eventName, () => cropDropZone.style.display = 'none', false);
    });
    cropModalContent.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt.files && dt.files[0]) handleFileSelect(dt.files[0]);
    }, false);

    function updateCropTransform() { cropImg.style.transform = `translate(${cropState.x}px, ${cropState.y}px) scale(${cropState.scale})`; }

    cropZoomRange.addEventListener("input", (e) => { cropState.scale = parseFloat(e.target.value); updateCropTransform(); });
    cropArea.addEventListener("mousedown", (e) => { cropState.isDragging = true; cropState.startX = e.clientX - cropState.x; cropState.startY = e.clientY - cropState.y; cropArea.style.cursor = "grabbing"; });
    window.addEventListener("mousemove", (e) => { if (cropState.isDragging) { e.preventDefault(); cropState.x = e.clientX - cropState.startX; cropState.y = e.clientY - cropState.startY; updateCropTransform(); } });
    window.addEventListener("mouseup", () => { cropState.isDragging = false; cropArea.style.cursor = "grab"; });
    btnCancelCrop.addEventListener("click", () => cropModal.style.display = "none");

    btnSaveCrop.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = 300; canvas.height = 300;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(cropImg, cropState.x, cropState.y, cropImg.naturalWidth * cropState.scale, cropImg.naturalHeight * cropState.scale);

      canvas.toBlob((blob) => {
        if (blob) {
          pendingBlob = blob;
          const url = URL.createObjectURL(blob);
          profilePreviewImg.src = url;
          cropModal.style.display = "none";
          profilePreviewModal.style.display = "flex";
          previewActionsDefault.style.display = "none";
          previewActionsConfirm.style.display = "flex";
        }
      }, "image/jpeg", 0.8);
    });

    btnCancelConfirm.addEventListener("click", () => {
      profilePreviewModal.style.display = "none";
      pendingBlob = null;
    });

    btnConfirmPhoto.addEventListener("click", () => {
      if (currentUser && pendingBlob) {
        const storageRef = ref(storage, `users/${currentUser.uid}/profile.jpg`);
        const uploadTask = uploadBytesResumable(storageRef, pendingBlob);

        const progressContainer = document.getElementById("upload-progress-container");
        const progressBar = document.getElementById("upload-progress-bar");
        const progressText = document.getElementById("upload-progress-text");

        progressContainer.style.display = "block";
        btnConfirmPhoto.disabled = true;
        btnCancelConfirm.disabled = true;

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.style.width = progress + "%";
            progressText.textContent = Math.round(progress) + "%";
          },
          (error) => {
            console.error(error);
            showToast("Erro no upload.", "error");
            progressContainer.style.display = "none";
            btnConfirmPhoto.disabled = false;
            btnCancelConfirm.disabled = false;
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((url) => {
              updateDoc(doc(db, "users", currentUser.uid), { photoURL: url })
                .then(() => {
                  showToast("Foto atualizada!", "success");
                  profilePreviewModal.style.display = "none";
                  progressContainer.style.display = "none";
                  btnConfirmPhoto.disabled = false;
                  btnCancelConfirm.disabled = false;
                  pendingBlob = null;
                });
            });
          }
        );
      }
    });
  }

  if (editNameBtn) {
    editNameBtn.addEventListener("click", () => {
      customPrompt("Digite seu novo nome:", "Alterar Nome").then((newName) => {
        if (newName && currentUser) {
          updateDoc(doc(db, "users", currentUser.uid), { displayName: newName })
            .then(() => showToast("Nome atualizado!", "success"))
            .catch((err) => console.error(err));
        }
      });
    });
  }

  // Logout Logic
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      signOut(auth).then(() => {
        window.location.href = "index.html";
      }).catch((error) => {
        console.error("Erro ao sair:", error);
      });
    });
  }

  // Notification UI Logic
  if (notificationBtn) {
    notificationBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notificationDropdown.classList.toggle("active");
    });
  }

  document.addEventListener("click", (e) => {
    if (notificationDropdown && notificationDropdown.classList.contains("active")) {
      if (!notificationDropdown.contains(e.target) && e.target !== notificationBtn) {
        notificationDropdown.classList.remove("active");
      }
    }
  });

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

  // Typewriter Logic (Encapsulated)
  const heroTitle = document.querySelector(".hero h2");
  let typewriterTimeout;

  function startTypewriter(element, text) {
    if (!element) return;
    clearTimeout(typewriterTimeout);
    element.textContent = "";
    const cursor = document.createElement("span");
    cursor.className = "typewriter-cursor";
    element.appendChild(cursor);

    let i = 0;
    function type() {
      if (element && cursor.parentNode === element && i < text.length) {
        element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
        i++;
        typewriterTimeout = setTimeout(type, 150);
      }
    }
    typewriterTimeout = setTimeout(type, 500);
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
  let currentProductPageCarouselIndex = 0;
  let currentOpenProductId = null;
  let currentMedia = [];
  let currentProductPageMedia = [];
  let newestProductDateValue = null;

  // Helper for localization
  // Agora suporta tradução automática armazenada em propriedades _en
  function getLocalized(data, key) {
    if (!data || !key) return "";
    if (currentLang === 'en' && data[key + '_en']) {
      return data[key + '_en'];
    }
    // Fallback para o texto original (PT)
    return data[key] || "";
  }

  const mainSections = document.querySelectorAll(".hero, #produtos, #sobre, #faq, footer");
  let pendingProductId = null;

  function setMainSectionsVisible(visible) {
    mainSections.forEach(el => {
      el.style.display = visible ? "" : "none";
    });
  }

  function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("produto");
    return id ? parseInt(id, 10) : null;
  }

  function getProductDateValue(product) {
    if (!product || !product.date) return null;
    const parsed = new Date(product.date).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  function openProductPage(product, pushState = true) {
    if (!productPage || !product) return;
    currentOpenProductId = product.id;

    // Registrar visualizacao tambem no layout "Ver mais" (pagina dinamica).
    const registerView = httpsCallable(functions, 'registerView');
    registerView({ productId: product.id }).catch(console.error);

    const title = getLocalized(product, "name");
    const subtitle = getLocalized(product, "title");
    const description = (getLocalized(product, "description") || "").replace(/\n/g, "<br>");
    const downloadLink = product.download_link || "#";

    productPageTitle.textContent = title;
    productPageSubtitle.textContent = subtitle;

    const metaParts = [];
    if (product.author) metaParts.push(`<span>Autor: ${product.author}</span>`);
    if (product.version) metaParts.push(`<span>Versão: ${product.version}</span>`);
    if (product.size) metaParts.push(`<span>Tamanho: ${product.size}</span>`);
    if (product.compatibility) metaParts.push(`<span>Compatibilidade: ${product.compatibility}</span>`);
    productPageMeta.innerHTML = metaParts.map(m => `<div class="product-page-meta-item">${m}</div>`).join("");

    productPageDescription.innerHTML = description;
    productPageDownload.href = downloadLink;

    const shareText = `Confira: ${title}`;
    const basePath = window.location.pathname.endsWith("/") ? window.location.pathname : window.location.pathname;
    const shareUrl = window.location.origin + basePath + `?produto=${product.id}`;
    productPageWhatsapp.onclick = () => {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
      window.open(whatsappUrl, "_blank");
    };
    if (productPageFacebook) {
      productPageFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    }
    if (productPageX) {
      productPageX.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    }
    if (productPageCopyLink) {
      productPageCopyLink.onclick = async () => {
        try {
          await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          showToast("Link copiado!", "success");
        } catch (error) {
          customAlert("Nao foi possivel copiar o link.", "Erro");
        }
      };
    }

    // Media carousel
    const mediaList = Array.isArray(product.media) ? product.media : [];
    currentProductPageMedia = mediaList.length > 0 ? mediaList : [{ type: "image", src: product.image }];
    currentProductPageCarouselIndex = 0;
    renderProductPageCarousel(title);

    if (productPageRatingComment) productPageRatingComment.value = "";
    userRatingSelection = 0;
    isUserRating = false;
    updateStarsUI(0, productPageStars);
    loadProductRatingAndComments(product.id, {
      ratingCountElem: productPageRatingCount,
      commentsListElem: productPageCommentsList,
      starsElem: productPageStars
    });

    if (productPageDownload) {
      const price = product.price || "00";
      const isPaid = price !== "00";
      productPageDownload.textContent = isPaid ? "Comprar" : "Download";
    }

    setMainSectionsVisible(false);
    productPage.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (pushState) {
      const newUrl = `?produto=${product.id}`;
      history.pushState({ produto: product.id }, "", newUrl);
    }
  }

  function closeProductPage(pushState = true) {
    if (!productPage) return;
    productPage.style.display = "none";
    setMainSectionsVisible(true);
    if (unsubscribeProduct) {
      unsubscribeProduct();
      unsubscribeProduct = null;
    }
    if (unsubscribeProductComments) {
      unsubscribeProductComments();
      unsubscribeProductComments = null;
    }
    if (pushState) history.pushState({}, "", window.location.pathname);
  }

  function renderProductPageCarousel(title) {
    if (!productPageCarouselInner || !productPageCarouselDots || !productPageCarousel || !productPageMediaFallback || !productPageThumbnails) return;

    productPageCarouselInner.innerHTML = "";
    productPageCarouselDots.innerHTML = "";
    productPageThumbnails.innerHTML = "";
    productPageMediaFallback.innerHTML = "";

    if (!currentProductPageMedia.length) {
      productPageCarousel.style.display = "none";
      return;
    }

    productPageCarousel.style.display = "block";
    currentProductPageMedia.forEach((media, index) => {
      const item = document.createElement("div");
      item.className = "carousel-item";
      const mediaSrc = (media && media.src) ? String(media.src).trim() : "";
      const youtubeId = media.type === "video" ? getYoutubeId(mediaSrc) : null;

      if (media.type === "video" && youtubeId) {
        const embedSrc = `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1`;
        item.innerHTML = `<iframe src="${embedSrc}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen data-yt="1"></iframe>`;
      } else if (media.type === "video") {
        item.innerHTML = `<video src="${mediaSrc}" controls preload="metadata"></video>`;
      } else {
        item.innerHTML = `<img src="${mediaSrc}" alt="${title}">`;
      }
      productPageCarouselInner.appendChild(item);

      const dot = document.createElement("span");
      dot.className = "dot";
      dot.onclick = () => {
        currentProductPageCarouselIndex = index;
        updateProductPageCarouselPosition();
      };
      productPageCarouselDots.appendChild(dot);

      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "product-page-thumb";
      thumb.setAttribute("aria-label", `Miniatura ${index + 1}`);
      if (media.type === "video" && youtubeId) {
        thumb.innerHTML = `
          <img src="https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg" alt="Miniatura de video">
          <span class="thumb-type-badge yt"><i class="fab fa-youtube"></i></span>
          <span class="thumb-duration">YouTube</span>
        `;
      } else if (media.type === "video") {
        thumb.innerHTML = `
          <span class="thumb-video-fallback">VIDEO</span>
          <span class="thumb-type-badge video"><i class="fas fa-video"></i></span>
          <span class="thumb-duration" id="product-thumb-duration-${index}">--:--</span>
        `;
        const itemVideo = item.querySelector("video");
        if (itemVideo) {
          itemVideo.addEventListener("loadedmetadata", () => {
            const durationTag = document.getElementById(`product-thumb-duration-${index}`);
            if (!durationTag || !Number.isFinite(itemVideo.duration)) return;
            durationTag.textContent = formatDuration(itemVideo.duration);
          }, { once: true });
        }
      } else {
        thumb.innerHTML = `<img src="${mediaSrc}" alt="Miniatura ${index + 1}">`;
      }
      thumb.onclick = () => {
        currentProductPageCarouselIndex = index;
        updateProductPageCarouselPosition();
      };
      productPageThumbnails.appendChild(thumb);
    });

    const showControls = currentProductPageMedia.length > 1;
    if (productPageCarouselPrev) productPageCarouselPrev.style.display = showControls ? "block" : "none";
    if (productPageCarouselNext) productPageCarouselNext.style.display = showControls ? "block" : "none";
    productPageThumbnails.style.display = showControls ? "grid" : "none";
    updateProductPageCarouselPosition();
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  function setProductPageCarouselTransform(offsetPx = 0, animate = true) {
    if (!productPageCarouselInner || !productPageCarousel) return;
    const viewportWidth = productPageCarousel.clientWidth || 1;
    productPageCarouselInner.style.transition = animate ? "" : "none";
    const baseTranslate = -(currentProductPageCarouselIndex * viewportWidth);
    productPageCarouselInner.style.transform = `translateX(${baseTranslate + offsetPx}px)`;
  }

  function updateProductPageCarouselPosition(animate = true) {
    if (!productPageCarouselInner) return;
    setProductPageCarouselTransform(0, animate);

    if (productPageCarouselDots) {
      const dots = productPageCarouselDots.getElementsByClassName("dot");
      for (let i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
      }
      if (dots[currentProductPageCarouselIndex]) {
        dots[currentProductPageCarouselIndex].className += " active";
      }
    }

    const videos = productPageCarouselInner.querySelectorAll("video");
    videos.forEach((video, index) => {
      if (index === currentProductPageCarouselIndex) return;
      video.pause();
      video.currentTime = 0;
    });

    const youtubeIframes = productPageCarouselInner.querySelectorAll("iframe[data-yt='1']");
    youtubeIframes.forEach((iframe, index) => {
      if (index === currentProductPageCarouselIndex) return;
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo", args: "" }),
        "*"
      );
    });

    if (productPageThumbnails) {
      const thumbs = productPageThumbnails.querySelectorAll(".product-page-thumb");
      thumbs.forEach((thumb, index) => {
        thumb.classList.toggle("active", index === currentProductPageCarouselIndex);
      });
    }
  }

  if (productPageCarouselPrev && productPageCarouselNext) {
    productPageCarouselPrev.addEventListener("click", () => {
      if (currentProductPageMedia.length <= 1) return;
      currentProductPageCarouselIndex =
        currentProductPageCarouselIndex > 0
          ? currentProductPageCarouselIndex - 1
          : currentProductPageMedia.length - 1;
      updateProductPageCarouselPosition();
    });
    productPageCarouselNext.addEventListener("click", () => {
      if (currentProductPageMedia.length <= 1) return;
      currentProductPageCarouselIndex =
        currentProductPageCarouselIndex < currentProductPageMedia.length - 1
          ? currentProductPageCarouselIndex + 1
          : 0;
      updateProductPageCarouselPosition();
    });
  }

  if (productPageCarouselInner) {
    let productTouchStartX = 0;
    let productTouchCurrentX = 0;
    let productTouchStartY = 0;
    let productTouchCurrentY = 0;
    let isProductDragging = false;
    let isProductHorizontalSwipe = false;
    const swipeThreshold = 45;

    productPageCarouselInner.addEventListener("touchstart", (e) => {
      if (!e.touches || e.touches.length !== 1 || currentProductPageMedia.length <= 1) return;
      const targetTag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
      if (targetTag === "video" || targetTag === "iframe") return;
      productTouchStartX = e.touches[0].clientX;
      productTouchCurrentX = productTouchStartX;
      productTouchStartY = e.touches[0].clientY;
      productTouchCurrentY = productTouchStartY;
      isProductDragging = true;
      isProductHorizontalSwipe = false;
      setProductPageCarouselTransform(0, false);
    }, { passive: true });

    productPageCarouselInner.addEventListener("touchmove", (e) => {
      if (!isProductDragging || !e.touches || e.touches.length !== 1) return;
      productTouchCurrentX = e.touches[0].clientX;
      productTouchCurrentY = e.touches[0].clientY;
      const deltaX = productTouchCurrentX - productTouchStartX;
      const deltaY = productTouchCurrentY - productTouchStartY;

      if (!isProductHorizontalSwipe && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        isProductHorizontalSwipe = true;
      }

      if (isProductHorizontalSwipe) {
        e.preventDefault();
        setProductPageCarouselTransform(deltaX, false);
      }
    }, { passive: false });

    productPageCarouselInner.addEventListener("touchend", () => {
      if (!isProductDragging) return;
      const delta = productTouchCurrentX - productTouchStartX;

      if (isProductHorizontalSwipe && Math.abs(delta) >= swipeThreshold) {
        if (delta < 0) {
          currentProductPageCarouselIndex =
            currentProductPageCarouselIndex < currentProductPageMedia.length - 1
              ? currentProductPageCarouselIndex + 1
              : 0;
        } else {
          currentProductPageCarouselIndex =
            currentProductPageCarouselIndex > 0
              ? currentProductPageCarouselIndex - 1
              : currentProductPageMedia.length - 1;
        }
      }

      isProductDragging = false;
      isProductHorizontalSwipe = false;
      updateProductPageCarouselPosition(true);
    });

    productPageCarouselInner.addEventListener("touchcancel", () => {
      if (!isProductDragging) return;
      isProductDragging = false;
      isProductHorizontalSwipe = false;
      updateProductPageCarouselPosition(true);
    });
  }

  window.addEventListener("resize", () => {
    if (!productPage || productPage.style.display !== "block") return;
    updateProductPageCarouselPosition(false);
  });

  function updateStarsUI(value, starsElem) {
    if (!starsElem || !starsElem.forEach) return;
    starsElem.forEach((star) => {
      star.classList.toggle("filled", parseInt(star.dataset.value, 10) <= value);
    });
  }

  function loadProductRatingAndComments(productId, { ratingCountElem, commentsListElem, starsElem }) {
    if (unsubscribeProduct) unsubscribeProduct();
    if (unsubscribeProductComments) unsubscribeProductComments();

    if (ratingCountElem) ratingCountElem.textContent = "(Carregando...)";
    unsubscribeProduct = onSnapshot(doc(db, "products", String(productId)), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const avg = data.averageRating || 0;
        const count = data.ratingCount || 0;
        if (!isUserRating) updateStarsUI(Math.round(avg), starsElem);
        if (ratingCountElem) ratingCountElem.textContent = `(${avg.toFixed(1)} / ${count} avaliacoes)`;
      } else if (ratingCountElem) {
        ratingCountElem.textContent = "(0 avaliacoes)";
      }
    }, () => {
      if (ratingCountElem) ratingCountElem.textContent = "(Offline)";
    });

    if (!commentsListElem) return;
    commentsListElem.innerHTML = "<p>Carregando avaliacoes...</p>";

    const ratingsQuery = query(
      collection(db, "products", String(productId), "ratings"),
      orderBy("timestamp", "desc")
    );

    unsubscribeProductComments = onSnapshot(ratingsQuery, (snapshot) => {
      commentsListElem.innerHTML = "";
      if (snapshot.empty) {
        commentsListElem.innerHTML = '<p style="color:#666; font-style:italic; font-size: 0.9rem;">Seja o primeiro a avaliar!</p>';
        return;
      }

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const starsText = "★★★★★☆☆☆☆☆".slice(5 - (data.rating || 0), 10 - (data.rating || 0));
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `
          <div class="comment-avatar">👤</div>
          <div class="comment-content">
            <h5>${data.userName || "Usuario"} <small class="comment-date">${data.timestamp ? data.timestamp.toDate().toLocaleDateString() : ""}</small></h5>
            <div class="comment-rating">${starsText}</div>
            <p>${data.comment || ""}</p>
          </div>
        `;
        commentsListElem.appendChild(div);
      });
    }, () => {
      commentsListElem.innerHTML = "<p>Erro ao carregar comentarios.</p>";
    });
  }

  async function submitProductRating(commentValue, starsElem, commentInputElem) {
    if (!currentUser) {
      customAlert("Faca login para avaliar.", "Erro");
      return;
    }
    if (!currentOpenProductId) return;
    if (userRatingSelection === 0) {
      customAlert("Por favor, selecione uma nota (estrelas).", "Aviso");
      return;
    }

    const productRef = doc(db, "products", String(currentOpenProductId));
    const ratingRef = doc(db, "products", String(currentOpenProductId), "ratings", currentUser.uid);

    toggleLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const ratingDoc = await transaction.get(ratingRef);
        const productDoc = await transaction.get(productRef);

        let currentRatingCount = 0;
        let currentAverage = 0;

        if (productDoc.exists()) {
          const data = productDoc.data();
          currentRatingCount = data.ratingCount || 0;
          currentAverage = data.averageRating || 0;
        }

        let newSum = currentAverage * currentRatingCount;
        let newCount = currentRatingCount;

        if (ratingDoc.exists()) {
          const oldRating = ratingDoc.data().rating;
          newSum -= oldRating;
        } else {
          newCount++;
        }

        newSum += userRatingSelection;
        const newAverage = newCount > 0 ? newSum / newCount : 0;

        transaction.set(ratingRef, {
          rating: userRatingSelection,
          comment: commentValue,
          userId: currentUser.uid,
          userName: currentUser.displayName || "Usuario",
          timestamp: new Date()
        }, { merge: true });

        transaction.set(productRef, { averageRating: newAverage, ratingCount: newCount }, { merge: true });
      });

      isUserRating = false;
      if (commentInputElem) commentInputElem.value = "";
      if (starsElem) updateStarsUI(0, starsElem);
      userRatingSelection = 0;
      customAlert("Obrigado pela sua avaliacao!", "Sucesso");
    } catch (err) {
      customAlert("Erro ao salvar avaliacao: " + err.message, "Erro");
    } finally {
      toggleLoading(false);
    }
  }

  function handleRoute() {
    const id = getProductIdFromUrl();
    if (!id) {
      closeProductPage(false);
      return;
    }
    const product = allProducts.find(p => p.id === id);
    if (product) {
      openProductPage(product, false);
    } else {
      pendingProductId = id;
    }
  }

  window.addEventListener("popstate", handleRoute);
  if (productPageBack) {
    productPageBack.addEventListener("click", () => closeProductPage(true));
  }

  if (productPageStars && productPageStars.length) {
    productPageStars.forEach((star) => {
      star.addEventListener("click", () => {
        if (!currentUser) {
          customAlert("Aguarde a autenticacao para avaliar.", "Aviso");
          return;
        }
        userRatingSelection = parseInt(star.dataset.value, 10);
        isUserRating = true;
        updateStarsUI(userRatingSelection, productPageStars);
      });
    });
  }

  if (productPageSubmitRatingBtn) {
    productPageSubmitRatingBtn.addEventListener("click", () => {
      submitProductRating(
        productPageRatingComment ? productPageRatingComment.value : "",
        productPageStars,
        productPageRatingComment
      );
    });
  }

  // Product Logic (Only if productList exists)
  function showSpinner() {
    if (!productList) return;
    productList.innerHTML = '<div class="main-spinner"></div>';
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
        openProductPage(product, true);
      }
    });
  }

  // --- Filter Logic ---
  function applyFilters() {
    const query = searchBar ? searchBar.value.toLowerCase() : "";

    const filtered = allProducts.filter(product => {
      const name = getLocalized(product, 'name').toLowerCase();
      const desc = getLocalized(product, 'description') ? getLocalized(product, 'description').toLowerCase() : "";
      const matchesSearch = name.includes(query) || desc.includes(query);

      const price = product.price || "00";
      const isPaid = price !== "00";

      let matchesFilter = true;
      if (currentFilter === 'free') matchesFilter = !isPaid;
      if (currentFilter === 'paid') matchesFilter = isPaid;

      return matchesSearch && matchesFilter;
    });

    renderProducts(filtered);
  }

  function renderBatch() {
    if (!productList) return;
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = currentPage * ITEMS_PER_PAGE;
    const productsToRender = currentFilteredProducts.slice(start, end);

    productList.innerHTML = "";
    let productsHTML = "";
    productsToRender.forEach((product, index) => {
      const productDateValue = getProductDateValue(product);
      const isNew = newestProductDateValue !== null && productDateValue === newestProductDateValue;

      const name = getLocalized(product, 'name');
      const price = product.price || "00";
      const isPaid = price !== "00";
      const priceHtml = `<p class="product-price ${isPaid ? 'paid' : 'free'}">${isPaid ? 'Preço: ' + price + ' MZN' : 'Grátis'}</p>`;

      let actionButtons = `<button class="view-more-btn" data-id="${product.id}">Ver Mais</button>`;

      const productCard = `
          <div class="produto fade-in" style="animation-delay: ${index * 0.1}s">
            ${isNew ? '<span class="new-badge">Novo</span>' : ''}
            <img src="${product.image}" alt="${product.name}">
            <h4>${name}</h4>
            <p class="product-version">Versão: ${product.version}</p>
            <div class="product-rating-list" id="product-rating-${product.id}">
               <span class="stars-display">☆☆☆☆☆</span> <span class="rating-value">(0.0)</span>
            </div>
            <div class="product-views" id="product-views-${product.id}">
               👁️ <span class="view-count">0</span> visualizações
            </div>
            ${priceHtml}
            ${actionButtons}
          </div>
        `;
      productsHTML += productCard;
    });
    productList.innerHTML = productsHTML;

    productsToRender.forEach((product) => {
      // Ouvir atualizações de visualizações em tempo real
      onSnapshot(doc(db, "products", String(product.id)), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const countElem = document.querySelector(`#product-views-${product.id} .view-count`);
          if (countElem) countElem.textContent = data.clicks || 0;

          const ratingElem = document.querySelector(`#product-rating-${product.id} .stars-display`);
          const valElem = document.querySelector(`#product-rating-${product.id} .rating-value`);
          if (ratingElem && valElem) {
            const avg = data.averageRating || 0;
            const stars = "★★★★★☆☆☆☆☆".slice(5 - Math.round(avg), 10 - Math.round(avg));
            ratingElem.textContent = stars;
            valElem.textContent = `(${avg.toFixed(1)})`;
          }
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
      productList.innerHTML = '<p class="no-results-msg">Nenhum produto encontrado.</p>';
      if (paginationContainer) paginationContainer.innerHTML = "";
      productCountElem.textContent = "";
      return;
    }
    renderBatch();
  }

  // Fetch product data with Cache
  showSpinner();

  // Cache removido para garantir que alterações no JSON (links, preços) apareçam imediatamente
  localStorage.removeItem("softsafe_products_cache"); // Limpa cache antigo se existir
  fetchData();

  function fetchData() {
    // Adicionado timestamp (?t=...) para evitar cache do navegador
    fetch(`functions/content.json?t=${new Date().getTime()}`)
      .then(response => response.json())
      .then(data => {
        // Ordenar por data (mais recente primeiro)
        data.sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateB - dateA;
        });

        newestProductDateValue = data.reduce((max, product) => {
          const dateValue = getProductDateValue(product);
          if (dateValue === null) return max;
          return max === null ? dateValue : Math.max(max, dateValue);
        }, null);

        allProducts = data;
        renderProducts(allProducts);
        if (pendingProductId) {
          const product = allProducts.find(p => p.id === pendingProductId);
          if (product) openProductPage(product, false);
          pendingProductId = null;
        }
        handleRoute();
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

    // Adicionar spinner enquanto carrega
    newsList.innerHTML = '<div class="main-spinner"></div>';

    loadMoreNewsBtn.addEventListener("click", () => {
      currentNewsPage++;
      renderNewsBatch();
    });

    const fetchNews = () => {
      fetch(`functions/news.json?t=${new Date().getTime()}`)
        .then(res => res.json())
        .then(data => {
          allNews = data;
          filteredNews = data;
          renderNewsBatch();
          localStorage.setItem("softsafe_news_cache", JSON.stringify(data));
          localStorage.setItem("softsafe_news_ts", Date.now());
        })
        .catch(err => {
          console.error(err);
          newsList.innerHTML = '<p class="no-results-msg">Erro ao carregar notícias.</p>';
        });
    };

    const cachedNews = localStorage.getItem("softsafe_news_cache");
    const cachedTs = localStorage.getItem("softsafe_news_ts");
    const CACHE_DURATION = 3600000; // 1 hora

    if (cachedNews && cachedTs && (Date.now() - cachedTs < CACHE_DURATION)) {
      try {
        allNews = JSON.parse(cachedNews);
        filteredNews = allNews;
        renderNewsBatch();
      } catch (e) {
        fetchNews();
      }
    } else {
      fetchNews();
    }

    // News Search Logic
    if (newsSearchInput) {
      newsSearchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        filteredNews = allNews.filter(n => {
          const title = getLocalized(n, 'title').toLowerCase();
          const text = getLocalized(n, 'text').toLowerCase();
          const extra = getLocalized(n, 'extra_text') ? getLocalized(n, 'extra_text').toLowerCase() : "";
          return title.includes(term) || text.includes(term) || extra.includes(term);
        });
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

      const title = getLocalized(item, 'title');
      const text = getLocalized(item, 'text');

      // Lógica de Expansão
      const isLong = text.length > 150 || item.extra_image || item.extra_text;
      const truncatedText = text.length > 150 ? text.substring(0, 150) + "..." : text;

      const extraText = getLocalized(item, 'extra_text');
      let extraContentHTML = "";
      if (item.extra_image) extraContentHTML += `<img src="${item.extra_image}" alt="Extra" class="news-extra-image">`;
      if (extraText) extraContentHTML += `<p class="news-extra-text">${extraText}</p>`;

      let expandBtn = "";
      if (isLong) {
        expandBtn = `<button class="news-link-btn" id="news-btn-${item.id}" onclick="toggleNewsExpand(${item.id})">Ler Mais</button>`;
      }

      card.innerHTML = `
        <h3>${title}</h3>
        ${item.date ? `<p class="news-date">📅 ${item.date}</p>` : ''}
        <img src="${item.image}" alt="${item.title}">
        
        <div id="news-content-${item.id}">
            <p class="short-text">${truncatedText}</p>
            <div class="full-text" style="display:none;">
                <p>${text}</p>
                ${extraContentHTML}
            </div>
        </div>
        ${expandBtn}
        
        <div class="news-actions">
          <button class="like-btn" onclick="toggleNewsLike(${item.id})" id="news-like-btn-${item.id}">
            ❤️ <span id="news-like-count-${item.id}">0</span>
          </button>
          <button class="like-btn" onclick="openNewsModal(${item.id})">
            💬 <span id="news-comment-count-${item.id}">0</span>
          </button>
          <button class="like-btn" onclick="shareNews(${item.id})">
            🔗
          </button>
        </div>
      `;

      newsList.appendChild(card);

      // Carregar Likes do Firestore
      onSnapshot(doc(db, "news_stats", String(item.id)), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const countSpan = document.getElementById(`news-like-count-${item.id}`);
          if (countSpan) countSpan.textContent = data.likesCount || 0;

          const commentCountSpan = document.getElementById(`news-comment-count-${item.id}`);
          if (commentCountSpan) commentCountSpan.textContent = data.commentsCount || 0;

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
        if (index > 0) {
          img.loading = "lazy"; // Otimização de carregamento
        }
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

  // Função para expandir/colapsar texto da notícia
  window.toggleNewsExpand = function (id) {
    const content = document.getElementById(`news-content-${id}`);
    const btn = document.getElementById(`news-btn-${id}`);
    if (!content || !btn) return;

    // Evitar cliques múltiplos durante a animação
    if (btn.dataset.animating === "true") return;
    btn.dataset.animating = "true";

    const shortText = content.querySelector('.short-text');
    const fullText = content.querySelector('.full-text');

    const isExpanded = fullText.style.display === "block";

    if (!isExpanded) {
      // EXPANDIR (Slide Down)
      shortText.style.opacity = '0';

      setTimeout(() => {
        shortText.style.display = 'none';

        fullText.style.display = 'block';
        fullText.style.height = '0';
        fullText.style.opacity = '0';

        void fullText.offsetWidth; // Forçar reflow para ativar transição

        fullText.style.height = fullText.scrollHeight + 'px';
        fullText.style.opacity = '1';

        setTimeout(() => {
          fullText.style.height = 'auto'; // Permitir redimensionamento responsivo
          btn.dataset.animating = "false";
        }, 500);
      }, 200);

      btn.textContent = "Ler Menos";
    } else {
      // COLAPSAR (Slide Up)
      fullText.style.height = fullText.scrollHeight + 'px';
      void fullText.offsetWidth; // Forçar reflow

      fullText.style.height = '0';
      fullText.style.opacity = '0';

      setTimeout(() => {
        fullText.style.display = 'none';
        shortText.style.display = 'block';
        void shortText.offsetWidth;
        shortText.style.opacity = '1';
        btn.dataset.animating = "false";
      }, 500);

      btn.textContent = "Ler Mais";
    }
  };

  // News Modal Logic
  window.openNewsModal = function (id) {
    if (!newsModal) return;
    const item = allNews.find(n => n.id === id);
    if (!item) return;

    document.getElementById("news-modal-title").textContent = getLocalized(item, 'title');
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

    const text = getLocalized(item, 'text');
    const extraText = getLocalized(item, 'extra_text');
    let bodyContent = `<p class="news-modal-body-text">${text}</p>`;
    if (extraText) bodyContent += `<p class="news-modal-body-text">${extraText}</p>`;
    if (currentNewsMedia.length <= 1 && item.extra_image && !item.image) bodyContent += `<img src="${item.extra_image}" class="news-extra-image">`;

    document.getElementById("news-modal-body").innerHTML = bodyContent;

    const actionsDiv = document.getElementById("news-modal-actions");
    actionsDiv.innerHTML = `<button class="download-btn" onclick="closeModalWithFade(document.getElementById('news-modal'))">Fechar</button>`;

    // --- Comments in Modal ---
    const commentsContainer = document.getElementById("news-modal-comments-container");
    if (commentsContainer) {
      commentsContainer.innerHTML = `
        <div class="comments-header">
          <h3>Comentários</h3>
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
          <button type="submit" class="download-btn comment-form-submit">Comentar</button>
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

  window.shareNews = function (id) {
    const item = allNews.find(n => n.id === id);
    if (!item) return;

    const title = getLocalized(item, 'title');
    const text = getLocalized(item, 'text');
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: title,
        text: text,
        url: url
      }).catch(console.error);
    } else {
      const shareModal = document.getElementById("share-modal");
      if (shareModal) {
        const shareWhatsapp = document.getElementById("share-whatsapp");
        const shareFacebook = document.getElementById("share-facebook");
        const shareX = document.getElementById("share-x");
        const shareCopy = document.getElementById("share-copy");
        const shareText = `Confira: ${title}`;

        if (shareWhatsapp) shareWhatsapp.href = `https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`;
        if (shareFacebook) shareFacebook.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        if (shareX) shareX.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;

        if (shareCopy) {
          shareCopy.onclick = () => {
            navigator.clipboard.writeText(`${shareText} ${url}`).then(() => {
              customAlert("Link copiado!", "Sucesso");
            });
          };
        }
        shareModal.style.display = "block";
      }
    }
  };

  // Expose Like functions to window
  window.toggleNewsLike = function (id) {
    requireLogin(() => {
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

  async function createReplyNotification(newsId, parentCommentId, newCommentId, replierName) {
    if (!currentUser) return;

    const parentCommentRef = doc(db, "news_stats", String(newsId), "comments", parentCommentId);
    try {
      const parentCommentSnap = await getDoc(parentCommentRef);
      if (parentCommentSnap.exists()) {
        const parentCommentData = parentCommentSnap.data();
        const recipientId = parentCommentData.userId;

        // Don't notify user if they reply to themselves
        if (recipientId && recipientId !== currentUser.uid) {
          await addDoc(collection(db, "notifications"), {
            recipientId: recipientId,
            type: 'reply',
            newsId: newsId,
            parentCommentId: parentCommentId,
            newCommentId: newCommentId,
            read: false,
            timestamp: new Date(),
            message: `${replierName} respondeu ao seu comentário.`
          });
        }
      }
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
    }
  }

  function listenForNotifications(userId) {
    if (unsubscribeNotifications) unsubscribeNotifications();

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userId),
      orderBy("timestamp", "desc")
    );

    unsubscribeNotifications = onSnapshot(q, (snapshot) => {
      const notifications = [];
      let unreadCount = 0;

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const notification = change.doc.data();
          // Only show toast if it's very recent (e.g., last 10 seconds) to avoid toast spam on load
          const notifTime = notification.timestamp ? notification.timestamp.toDate() : new Date();
          if (new Date() - notifTime < 10000 && !notification.read) {
            showToast(notification.message, "success");
          }
        }
      });

      snapshot.forEach(doc => {
        const data = doc.data();
        notifications.push({ id: doc.id, ...data });
        if (!data.read) unreadCount++;
      });

      // Update Badge
      if (notificationCount) {
        notificationCount.textContent = unreadCount;
        notificationCount.style.display = unreadCount > 0 ? "block" : "none";
      }

      // Render List
      if (notificationList) {
        notificationList.innerHTML = "";
        if (notifications.length === 0) {
          notificationList.innerHTML = '<div class="empty-notifications">Nenhuma notificação.</div>';
        } else {
          notifications.forEach(notif => {
            const div = document.createElement("div");
            div.className = `notification-item ${notif.read ? '' : 'unread'}`;
            div.textContent = notif.message;
            div.onclick = () => {
              // Mark as read
              updateDoc(doc(db, "notifications", notif.id), { read: true });
              // Open News Modal (if applicable)
              if (notif.newsId && typeof window.openNewsModal === "function" && document.getElementById("news-modal")) {
                openNewsModal(parseInt(notif.newsId));
              }
            };
            notificationList.appendChild(div);
          });
        }
      }

      if (markAllReadBtn) {
        markAllReadBtn.onclick = () => {
          notifications.forEach(n => {
            if (!n.read) updateDoc(doc(db, "notifications", n.id), { read: true });
          });
        };
      }
    });
  }

  function saveComment(newsId, name, text, image, parentId = null, callback = null) {
    requireLogin(() => {
      const comment = {
        userId: currentUser.uid,
        name,
        text,
        image,
        date: new Date().toLocaleDateString(),
        likes: 0,
        parentId: parentId,
        timestamp: new Date()
      };

      addDoc(collection(db, "news_stats", String(newsId), "comments"), comment)
        .then((docRef) => {
          const statsRef = doc(db, "news_stats", String(newsId));
          setDoc(statsRef, { commentsCount: increment(1) }, { merge: true });

          // If it's a reply, create a notification
          if (parentId) {
            createReplyNotification(newsId, parentId, docRef.id, name);
          }

          if (callback) callback();
        });
    });
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
        const safeName = escapeHTML(c.name);
        const safeText = escapeHTML(c.text);
        const div = document.createElement("div");
        div.className = "comment";
        div.id = `comment-${c.id}`;
        div.innerHTML = `
        <div class="comment-avatar">👤</div>
        <div class="comment-content">
          <h5>${safeName} <small class="comment-date">${c.date}</small></h5>
          <p>${safeText}</p>
          ${c.image ? `<img src="${c.image}" class="comment-img">` : ''}
          <div class="comment-actions">
             <button id="comment-like-btn-${c.id}" class="comment-like-btn" onclick="toggleCommentLike(${newsId}, '${c.id}')">
               👍 <span id="comment-like-count-${c.id}">${c.likes || 0}</span>
             </button>
             <button class="reply-btn" onclick="toggleReplyForm('${c.id}')">Responder</button>
          </div>
          
          <div id="reply-form-${c.id}" class="reply-form-container">
            <form class="comment-form" onsubmit="submitReply(event, ${newsId}, '${c.id}')">
              <input type="text" placeholder="Seu nome" required>
              <textarea placeholder="Sua resposta" required></textarea>
              <button type="submit" class="download-btn reply-submit-btn">Enviar</button>
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

      // Check likes for current user
      if (currentUser) {
        comments.forEach(c => {
          const likeRef = doc(db, "news_stats", String(newsId), "comments", String(c.id), "likes", currentUser.uid);
          getDoc(likeRef).then(snap => {
            const btn = document.getElementById(`comment-like-btn-${c.id}`);
            if (btn && snap.exists() && snap.data().active) btn.classList.add('liked');
          });
        });
      }
    }, (error) => {
      console.warn("Erro ao carregar comentários:", error.code);
      container.innerHTML = `<p class="comments-unavailable">Comentários indisponíveis (Verifique as regras do Firebase).</p>`;
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
    requireLogin(() => {
      const likeRef = doc(db, "news_stats", String(newsId), "comments", String(commentId), "likes", currentUser.uid);
      const commentRef = doc(db, "news_stats", String(newsId), "comments", String(commentId));

      getDoc(likeRef).then((docSnap) => {
        const isLiked = docSnap.exists() && docSnap.data().active;

        if (isLiked) {
          updateDoc(likeRef, { active: false });
          updateDoc(commentRef, { likes: increment(-1) });
          document.getElementById(`comment-like-btn-${commentId}`).classList.remove("liked");
        } else {
          setDoc(likeRef, { active: true }, { merge: true });
          updateDoc(commentRef, { likes: increment(1) });
          document.getElementById(`comment-like-btn-${commentId}`).classList.add("liked");
        }
      }).catch((error) => {
        console.error("Erro ao curtir comentário:", error);
        customAlert("Erro ao curtir. Verifique sua conexão ou login.", "Erro");
      });
    });
  };

  // Search functionality
  function performSearch() {
    const query = searchBar ? searchBar.value.toLowerCase() : "";
    // Now delegates to applyFilters to combine search + category
    applyFilters();

    // Suggestions Logic
    if (suggestionsContainer) {
      suggestionsContainer.innerHTML = "";
      if (query.length > 0) {
        const suggestions = allProducts.filter(p => getLocalized(p, 'name').toLowerCase().includes(query));
        if (suggestions.length > 0) {
          suggestions.slice(0, 5).forEach(p => {
            const div = document.createElement("div");
            const name = getLocalized(p, 'name');
            div.className = "suggestion-item";
            div.textContent = name;
            div.onclick = () => {
              searchBar.value = name;
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
    if (!progressBar) return;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(100, percentage)}%`;
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

  // Open modal with product details right
  function openModal(product) {
    currentOpenProductId = product.id;
    document.getElementById("modal-title").textContent = getLocalized(product, 'title');
    document.getElementById("modal-size").textContent = product.size;
    document.getElementById("modal-version").textContent = product.version;
    document.getElementById("modal-compatibility").textContent = product.compatibility;
    document.getElementById("modal-description").innerHTML = getLocalized(product, 'description').replace(/\n/g, '<br>');

    // Reset Rating Form
    userRatingSelection = 0;
    isUserRating = false;
    document.getElementById('rating-comment').value = '';

    // Incrementar contador de cliques (views) do produto no Firestore
    const registerView = httpsCallable(functions, 'registerView');
    registerView({ productId: product.id }).catch(console.error);

    updateStarsUI(0, stars);
    loadProductRatingAndComments(product.id, {
      ratingCountElem: ratingCountElem,
      commentsListElem: document.getElementById("product-comments-list"),
      starsElem: stars
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

    const downloadBtn = modal ? modal.querySelector(".modal-actions .download-btn") : null;
    const shareActionBtn = modal ? modal.querySelector(".share-action-btn") : null;

    // Share Button Logic
    if (shareActionBtn) {
      shareActionBtn.onclick = () => {
        const shareUrl = window.location.href;
        const shareText = `Confira este software incrível: ${getLocalized(product, 'name')}`;

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
    if (downloadBtn) {
      downloadBtn.classList.remove("downloading");
      const price = product.price || "00";
      const isPaid = price !== "00";
      downloadBtn.textContent = isPaid ? "Comprar" : "Download";
      downloadBtn.disabled = false;

      downloadBtn.onclick = () => {
        triggerConfetti();
        // downloadBtn.classList.add("downloading");
        // downloadBtn.textContent = "Baixando...";
        // downloadBtn.disabled = true;

        const width = 800;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(product.download_link, 'DownloadPopup', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
      };
    }

    modal.style.display = "block";
  }

  // Handle Star Click
  if (stars) {
    stars.forEach(star => {
      star.addEventListener('click', () => {
        if (!currentUser) {
          customAlert("Aguarde a autenticação para avaliar.", "Aviso");
          return;
        }

        // Apenas atualiza visualmente e salva o estado
        userRatingSelection = parseInt(star.dataset.value);
        isUserRating = true;
        updateStarsUI(userRatingSelection, stars);
      });
    });
  }

  // Handle Rating Submit Button
  const submitRatingBtn = document.getElementById('submit-rating-btn');
  if (submitRatingBtn) {
    submitRatingBtn.addEventListener('click', () => {
      submitProductRating(
        document.getElementById('rating-comment').value,
        stars,
        document.getElementById('rating-comment')
      );
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
      if (contactModal && contactModal.style.display === "block") closeModalWithFade(contactModal);
      if (privacyModal && privacyModal.style.display === "block") closeModalWithFade(privacyModal);
      if (loginModal && loginModal.style.display === "block") closeModalWithFade(loginModal);

      // Close burger menu
      if (navMenu && navMenu.classList.contains("active")) {
        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
        if (menuOverlay) menuOverlay.classList.remove("active");
      }
    }
  });

  // Dynamic Footer Content (Copyright + Socials + Privacy)
  function renderFooter() {
    const footer = document.querySelector(".footer");
    if (footer) {
      const currentYear = new Date().getFullYear();
      const ceoName = "Francisco Armando Chico | Kas Cranky";
      const ceoContent = `<a href="https://www.instagram.com/kascranky" target="_blank" class="ceo-link">${ceoName}</a>`;

      footer.innerHTML = `
        <div class="footer-container">
          <p>&copy; ${currentYear} SoftSafe — Todos os direitos reservados</p>
          <p class="footer-ceo">CEO: ${ceoContent}</p>
          <div class="footer-partners">
            <h4>Parceiros</h4>
            <div class="partners-logos">
              <img src="assets/softsafe.png" alt="SoftSafe Partner" class="partner-logo">
            </div>
          </div>
          <div class="footer-socials">
            <a href="https://www.facebook.com/softsafecore" target="_blank" title="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="https://www.instagram.com/softsafecore" target="_blank" title="Instagram"><i class="fab fa-instagram"></i></a>
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
  }

  renderFooter();

  // Close Privacy Modal Logic
  document.querySelectorAll(".close-privacy, .close-privacy-btn").forEach(el => {
    el.addEventListener("click", () => {
      if (privacyModal) closeModalWithFade(privacyModal);
    });
  });

  // Login Modal Logic
  if (closeLoginBtn) {
    closeLoginBtn.addEventListener("click", () => {
      if (loginModal) closeModalWithFade(loginModal);
    });
  }

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => {
      toggleLoading(true);
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          toggleLoading(false);
          showToast("Login realizado com sucesso!", "success");
          if (loginModal) closeModalWithFade(loginModal);
        })
        .catch((error) => {
          toggleLoading(false);
          console.error("Erro no login Google:", error);
          showToast("Erro ao fazer login com Google.", "error");
        });
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target == loginModal) {
      closeModalWithFade(loginModal);
    }
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
    fetch(`functions/faq.json?t=${new Date().getTime()}`)
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

  window.customConfirm = function (message, title = "Confirmação", okText = "Sim", cancelText = "Não") {
    return new Promise((resolve) => {
      dialogTitle.textContent = title;
      dialogMessage.textContent = message;
      dialogInputContainer.style.display = 'none';

      dialogOk.textContent = okText;
      dialogCancel.textContent = cancelText;
      dialogCancel.style.display = 'inline-block';

      dialogOverlay.classList.add('active');

      dialogOk.onclick = () => {
        dialogOverlay.classList.remove('active');
        dialogOk.textContent = "OK"; // Reset
        resolve(true);
      };
      dialogCancel.onclick = () => {
        dialogOverlay.classList.remove('active');
        dialogOk.textContent = "OK"; // Reset
        resolve(false);
      };
    });
  };

  // --- Reset Password Logic (Profile Page) ---
  if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener("click", () => {
      // "OTP" System Implementation:
      // Since Firebase does not support sending a numeric OTP via email for password changes without a backend,
      // we implement the Secure Re-authentication Flow. This requires the user to prove their identity
      // (confirm current password) before setting a new one. This is the standard security practice.

      if (!currentUser) return;

      // Check if user is logged in with password provider
      const isPasswordAuth = currentUser.providerData.some(p => p.providerId === 'password');

      if (!isPasswordAuth) {
        showToast("Faça login com e-mail/senha para alterar a senha.", "info");
        return;
      }

      customPrompt("Para sua segurança, confirme sua senha atual:", "Verificação de Segurança", true).then((currentPass) => {
        if (!currentPass) return;

        toggleLoading(true);
        const credential = EmailAuthProvider.credential(currentUser.email, currentPass);

        reauthenticateWithCredential(currentUser, credential).then(() => {
          toggleLoading(false);
          // Re-auth successful, now ask for new password
          customPrompt("Digite a nova senha:", "Nova Senha", true).then((newPass) => {
            if (newPass && newPass.length >= 6) {
              toggleLoading(true);
              updatePassword(currentUser, newPass).then(() => {
                toggleLoading(false);
                showToast("Senha alterada com sucesso!", "success");
              }).catch(err => { toggleLoading(false); showToast("Erro ao alterar: " + err.message, "error"); });
            } else if (newPass) { showToast("A senha deve ter no mínimo 6 caracteres.", "error"); }
          });
        }).catch((error) => {
          toggleLoading(false);
          showToast("Senha atual incorreta.", "error");
        });
      });
    });
  }

  // --- Delete Account Logic ---
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", () => {
      customConfirm("Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus dados serão perdidos.", "Excluir Conta", "Excluir", "Cancelar").then((confirmed) => {
        if (confirmed) {
          if (currentUser) {
            const performDelete = () => {
              toggleLoading(true);
              const batch = writeBatch(db);

              // 1. Preparar exclusão do perfil
              batch.delete(doc(db, "users", currentUser.uid));

              // Deletar foto do Storage
              deleteObject(ref(storage, `users/${currentUser.uid}/profile.jpg`)).catch(() => { });

              // 2. Tentar buscar e excluir comentários (Requer índice 'userId' em collectionGroup 'comments')
              const commentsQuery = query(collectionGroup(db, 'comments'), where('userId', '==', currentUser.uid));

              getDocs(commentsQuery)
                .then((snapshot) => {
                  snapshot.forEach((doc) => batch.delete(doc.ref));
                  return batch.commit();
                })
                .catch((err) => {
                  console.warn("Erro ao limpar comentários (provavelmente falta índice):", err);
                  // Se falhar a busca de comentários, tenta excluir apenas o usuário
                  return deleteDoc(doc(db, "users", currentUser.uid));
                })
                .then(() => deleteUser(currentUser))
                .then(() => {
                  toggleLoading(false);
                  showToast("Conta excluída com sucesso.", "success");
                  window.location.href = "index.html";
                })
                .catch((error) => {
                  toggleLoading(false);
                  console.error("Erro ao excluir conta:", error);
                  if (error.code === 'auth/requires-recent-login') {
                    customAlert("Por segurança, é necessário fazer login novamente antes de excluir sua conta.", "Login Necessário").then(() => {
                      signOut(auth).then(() => window.location.href = "index.html");
                    });
                  } else {
                    showToast("Erro ao excluir conta: " + error.message, "error");
                  }
                });
            };

            // Verificar se é login por senha para pedir confirmação
            const isPasswordAuth = currentUser.providerData.some(p => p.providerId === 'password');

            if (isPasswordAuth) {
              customPrompt("Digite sua senha para confirmar a exclusão:", "Verificação de Segurança", true).then((password) => {
                if (password) {
                  toggleLoading(true);
                  const credential = EmailAuthProvider.credential(currentUser.email, password);
                  reauthenticateWithCredential(currentUser, credential)
                    .then(() => {
                      toggleLoading(false);
                      performDelete();
                    })
                    .catch((error) => {
                      toggleLoading(false);
                      showToast("Senha incorreta.", "error");
                    });
                }
              });
            } else {
              performDelete();
            }
          }
        }
      });
    });
  }

  // --- Password Strength Logic ---
  if (signupPassInput && signupStrengthBar && signupStrengthText) {
    signupPassInput.addEventListener("input", () => {
      const val = signupPassInput.value;
      let strength = 0;

      if (val.length >= 6) strength++;
      if (val.length >= 8 && /[0-9]/.test(val)) strength++;
      if (val.length >= 10 && /[!@#$%^&*]/.test(val) && /[A-Z]/.test(val)) strength++;

      let color = "#eee";
      let width = "0%";
      let text = "";

      if (val.length > 0) {
        if (strength === 0 || strength === 1) {
          color = "#e74c3c"; width = "33%"; text = "Fraca";
        } else if (strength === 2) {
          color = "#f1c40f"; width = "66%"; text = "Média";
        } else if (strength >= 3) {
          color = "#2ecc71"; width = "100%"; text = "Forte";
        }
      }

      signupStrengthBar.style.backgroundColor = color;
      signupStrengthBar.style.width = width;
      signupStrengthText.textContent = text;
      signupStrengthText.style.color = color;
    });
  }

  // --- Forgot Password Logic (Login Modal) ---
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (loginModal) closeModalWithFade(loginModal);

      customPrompt("Digite seu e-mail para redefinir a senha:", "Recuperar Senha").then((email) => {
        if (email) {
          toggleLoading(true);
          sendPasswordResetEmail(auth, email)
            .then(() => {
              toggleLoading(false);
              showToast("E-mail de redefinição enviado!", "success");
            })
            .catch((error) => {
              toggleLoading(false);
              console.error(error);
              showToast("Erro: " + error.message, "error");
            });
        }
      });
    });
  }

  // --- Cookie Banner Logic ---
  const cookieBannerHTML = `
    <div id="cookie-banner" class="cookie-banner">
      <p class="cookie-text">
        Utilizamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa 
        <a href="#" id="cookie-privacy-link" class="cookie-link">Política de Privacidade</a>.
      </p>
      <button id="accept-cookies-btn" class="cookie-btn">Aceitar</button>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', cookieBannerHTML);

  const cookieBanner = document.getElementById("cookie-banner");
  const acceptCookiesBtn = document.getElementById("accept-cookies-btn");
  const cookiePrivacyLink = document.getElementById("cookie-privacy-link");

  if (!localStorage.getItem("softsafe_cookie_consent")) {
    if (cookieBanner) cookieBanner.style.display = "block";
  }

  if (acceptCookiesBtn) {
    acceptCookiesBtn.addEventListener("click", () => {
      localStorage.setItem("softsafe_cookie_consent", "true");
      if (cookieBanner) cookieBanner.style.display = "none";
    });
  }

  if (cookiePrivacyLink && privacyModal) {
    cookiePrivacyLink.addEventListener("click", (e) => {
      e.preventDefault();
      privacyModal.style.display = "block";
    });
  }
});

function scrollToProducts() {
  document.getElementById("produtos").scrollIntoView({
    behavior: "smooth"
  });
}
