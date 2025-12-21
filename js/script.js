// =========================================
// 1. API ADRESLERİ & AYARLAR
// =========================================
const BASE_URL = 'http://127.0.0.1:8000';

// API Uç Noktaları
const API_PRODUCTS = `${BASE_URL}/api/products/`;
const API_CATEGORIES = `${BASE_URL}/api/categories/`;
const API_CHECKOUT = `${BASE_URL}/api/checkout/`;
const API_REGISTER = `${BASE_URL}/api/register/`;
const API_LOGIN = `${BASE_URL}/api/login/`;
const API_MY_ORDERS = `${BASE_URL}/api/my-orders/`;
const API_CONTACT = `${BASE_URL}/api/contact/`;
const API_REVIEWS = `${BASE_URL}/api/reviews/`;
const API_PROFILE = `${BASE_URL}/api/profile/`;
const API_ADDRESS = `${BASE_URL}/api/addresses/`;

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'all'; 

// =========================================
// 🔔 MODERN BİLDİRİM (TOAST) FONKSİYONU
// =========================================
function showToast(message, type = "success") {
    let bg = type === "error" 
        ? "linear-gradient(to right, #ff5f6d, #ffc371)" 
        : "linear-gradient(to right, #00b09b, #96c93d)";

    if (typeof Toastify === 'function') {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            style: {
                background: bg,
                borderRadius: "10px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                fontWeight: "bold"
            }
        }).showToast();
    } else {
        alert(message);
    }
}

// =========================================
// 2. SAYFA YÜKLENDİĞİNDE ÇALIŞACAKLAR
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();     
    checkLoginStatus(); 
    
    // Adresleri yükle (Sadece giriş yapmışsa ve profil/checkout sayfasındaysa)
    if (localStorage.getItem('token')) {
        loadAddresses();

        autoFillContactForm();
    }
    
    // Ana Sayfa Yüklemeleri
    if(document.getElementById('category-list')) loadCategories();
    if(document.getElementById('product-list')) loadProducts();

    // Detay Sayfası
    if (window.location.pathname.includes('detail.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (productId) loadSingleProduct(productId);
    }

    // Checkout Sayfası
    if (window.location.pathname.includes('checkout.html')) {
        autoFillCheckout(); 
    }

    // Profil Sayfası
    if (window.location.pathname.includes('profile.html')) {
        loadMyOrders();
        loadProfileData();
        if(document.getElementById('favorites-list')) loadMyFavorites();
    }
    
    // Tema Kontrolü
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setTheme('dark');
    else setTheme('light');
});

// =========================================
// 3. KULLANICI İŞLEMLERİ (AUTH) - DÜZELTİLDİ
// =========================================

function checkLoginStatus() {
    const userArea = document.getElementById('user-area');
    if (!userArea) return; 

    // 🔥 DÜZELTME: Token ismi standartlaştırıldı ('token')
    const token = localStorage.getItem('token');
    const fullName = localStorage.getItem('full_name') || localStorage.getItem('username');

    if (token && fullName) {
        // 🔥 GİRİŞ YAPILMIŞSA
        userArea.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-primary dropdown-toggle fw-bold d-flex align-items-center gap-2 text-white shadow-sm rounded-pill px-3" 
                        type="button" data-bs-toggle="dropdown" style="border: none;">
                    <i class="bi bi-person-circle fs-5"></i> 
                    <span>${fullName}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                    <li><a class="dropdown-item" href="profile.html"><i class="bi bi-card-list text-primary me-2"></i> My Profile</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logoutUser()"><i class="bi bi-box-arrow-right me-2"></i> Logout</a></li>
                </ul>
            </div>
        `;
    } else {
        // 🔥 GİRİŞ YAPILMAMIŞSA
        userArea.innerHTML = `
            <a href="login.html" class="btn btn-primary rounded-pill fw-bold px-4 shadow-sm text-white">Login <i class="bi bi-person-fill ms-1"></i></a>
        `;
    }
}

// 🔐 GİRİŞ YAPMA (Senin HTML ID'lerine göre uyarlandı)
async function loginUser() {
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');

    if (!usernameInput || !passwordInput) {
        // Eğer login.html'de değilsek hata vermesin diye sessizce çık
        return;
    }

    const username = usernameInput.value;
    const password = passwordInput.value;

    if (!username || !password) {
        showToast("Please fill in all fields! ⚠️", "error");
        return;
    }

    try {
        const response = await fetch(API_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // 🔥 KRİTİK: Token ve İsim Kaydı
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('full_name', data.full_name);

            showToast(`Login Successful! Redirecting... 🚀`, "success");
            
            // 1 saniye sonra ana sayfaya at
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        } else {
            showToast(data.error || "Login failed! ❌", "error");
        }
    } catch (error) {
        console.error("Login Error:", error);
        showToast("Server connection error!", "error");
    }
}

// 📝 KAYIT OLMA (Senin HTML ID'lerine göre uyarlandı)
async function registerUser() {
    // HTML'deki ID'ler: regUsername, regEmail, regPassword, regName, regSurname
    const u = document.getElementById('regUsername').value;
    const e = document.getElementById('regEmail').value;
    const p = document.getElementById('regPassword').value;
    const f = document.getElementById('regName').value;
    const l = document.getElementById('regSurname').value;

    if(!u || !e || !p) {
        showToast("Please fill required fields!", "error");
        return;
    }

    try {
        const res = await fetch(API_REGISTER, { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify({username:u, email:e, password:p, first_name:f, last_name:l})
        });
        
        const data = await res.json();

        if(res.ok) { 
            // Kayıt başarılıysa direkt giriş yapmış sayalım
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('full_name', data.full_name);

            showToast("✅ Registration Successful! Redirecting...", "success"); 
            setTimeout(() => { window.location.href = "index.html"; }, 1000);
        } else { 
            showToast("❌ Registration failed! " + (data.error || ""), "error"); 
        }
    } catch(e) { console.error(e); showToast("Server error!", "error"); }
}

function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('full_name');
    localStorage.removeItem('full_address'); // Varsa temizle
    localStorage.removeItem('cart'); 
    
    showToast("Logged out successfully 👋", "success");
    setTimeout(() => { window.location.href = "index.html"; }, 1000);
}

function autoFillCheckout() {
    const fullName = localStorage.getItem('full_name');
    if (fullName) {
        const nameInput = document.getElementById('fullName');
        if(nameInput && !nameInput.value) nameInput.value = fullName;
    }
}

// =========================================
// 4. VİTRİN & ÜRÜNLER
// =========================================

function loadCategories() {
    fetch(API_CATEGORIES).then(res => res.json()).then(data => {
        const list = document.getElementById('category-list');
        if(!list) return;
        list.innerHTML = `<li class="list-group-item category-btn active" onclick="filterProducts('all', this)">All Products</li>`;
        data.forEach(cat => {
            list.innerHTML += `<li class="list-group-item category-btn" onclick="filterProducts(${cat.id}, this)">${cat.name}</li>`;
        });
    });
}

function loadProducts() {
    fetch(API_PRODUCTS).then(res => res.json()).then(data => {
        allProducts = data;
        renderProducts(allProducts);
    });
}

function loadSingleProduct(id) {
    fetch(API_PRODUCTS).then(res => res.json()).then(data => {
        const product = data.find(p => p.id == id);
        if (product) {
            let img = product.image ? (product.image.startsWith('http') ? product.image : BASE_URL + product.image) : 'https://via.placeholder.com/300';
            
            document.getElementById('detail-name').innerText = product.name;
            document.getElementById('detail-desc').innerText = product.description;
            document.getElementById('detail-price').innerText = "$" + product.price;
            document.getElementById('detail-img').src = img;
            
            // --- STOK VE SEPET BUTONU ---
            const stockLabel = document.getElementById('detail-stock');
            const btn = document.getElementById('detail-btn');
            
            if(product.stock < 1) {
                stockLabel.className = 'badge bg-secondary'; stockLabel.innerText = 'Out of Stock';
                btn.disabled = true; btn.innerText = 'Out of Stock';
            } else {
                stockLabel.className = 'badge bg-success'; stockLabel.innerText = 'In Stock';
                btn.onclick = () => {
                    const qtyInput = document.getElementById('product-qty');
                    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
                    addToCart(product.name, product.price, img, quantity);
                };
            }

            // 🔥 YENİ: FAVORİ (WISHLIST) BUTONU AYARI 🔥
            const favBtn = document.getElementById('detail-fav-btn'); 
            if (favBtn) {
                // 1. Önce bu ürün favoride mi kontrol et
                const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
                if (favorites.includes(String(product.id))) {
                    favBtn.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>'; // Dolu kalp
                } else {
                    favBtn.innerHTML = '<i class="bi bi-heart"></i>'; // Boş kalp
                }

                // 2. Tıklama özelliğini ver
                favBtn.onclick = function() {
                    toggleFavorite(product.id, this);
                };
            }

            document.getElementById('loading').classList.add('d-none');
            document.getElementById('product-content').classList.remove('d-none');

            // Benzer ürünler
            const related = data.filter(p => p.category == product.category && p.id != id);
            renderRelatedProducts(related.slice(0, 4));

            if(document.getElementById('reviews-list')) loadReviews(id);
        }
    });
}

function renderRelatedProducts(products) {
    const list = document.getElementById('related-list');
    if (!list) return;
    if (products.length > 0) {
        document.getElementById('related-area').classList.remove('d-none');
        list.innerHTML = "";
        products.forEach(p => {
            let img = p.image ? (p.image.startsWith('http') ? p.image : BASE_URL + p.image) : 'https://via.placeholder.com/300';
            list.innerHTML += `
                <div class="col-md-3 col-6">
                    <div class="card h-100 shadow-sm">
                        <a href="detail.html?id=${p.id}"><img src="${img}" class="card-img-top" style="height: 150px; object-fit: contain;"></a>
                        <div class="card-body p-2 text-center">
                            <h6 class="card-title text-truncate"><a href="detail.html?id=${p.id}" class="text-decoration-none text-dark">${p.name}</a></h6>
                            <span class="text-primary fw-bold">$${p.price}</span>
                        </div>
                    </div>
                </div>`;
        });
    }
}

function renderProducts(products) {
    const list = document.getElementById('product-list');
    const countLabel = document.getElementById('result-count');
    if(!list) return;
    
    // 🔥 ÖNEMLİ: Önce favorileri hafızadan çekelim
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if(products.length === 0) {
        list.innerHTML = '<div class="alert alert-warning text-center w-100">No products found.</div>';
        if(countLabel) countLabel.innerText = "0 found"; 
        return;
    }

    list.innerHTML = "";
    if(countLabel) countLabel.innerText = `Showing ${products.length} products`;

    products.forEach(p => {
        let img = p.image ? (p.image.startsWith('http') ? p.image : BASE_URL + p.image) : 'https://via.placeholder.com/300';
        
        // Stok Durumu
        let btnState = p.stock === 0 ? 'disabled' : `onclick="addToCart('${p.name}', ${p.price}, '${img}')"`;
        let btnText = p.stock === 0 ? 'No Stock' : 'Add +';
        let stockBadge = p.stock === 0 ? '<span class="badge bg-secondary position-absolute top-0 start-0 m-2 z-2">Sold Out</span>' : '';

        // 🔥 FAVORİ KONTROLÜ (KALP KIRMIZI MI OLSUN?)
        let isFav = favorites.includes(String(p.id));
        let heartIcon = isFav ? 'bi-heart-fill text-danger' : 'bi-heart'; // Dolu veya Boş kalp ikonu

        list.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm product-card position-relative">
                    ${stockBadge}
                    
                    <button class="btn btn-light rounded-circle position-absolute top-0 end-0 m-2 shadow-sm fav-btn z-3" 
                        data-id="${p.id}" onclick="toggleFavorite(${p.id}, this)">
                        <i class="bi ${heartIcon}"></i>
                    </button>

                    <a href="detail.html?id=${p.id}"><img src="${img}" class="card-img-top"></a>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold text-truncate"><a href="detail.html?id=${p.id}" class="text-decoration-none text-dark">${p.name}</a></h5>
                        <p class="text-muted small mb-3">${p.description.substring(0, 60)}...</p>
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <span class="text-primary fw-bold fs-5">$${p.price}</span>
                            <button class="btn btn-outline-primary btn-sm rounded-pill px-3" ${btnState}>${btnText}</button>
                        </div>
                        <button class="btn btn-sm btn-light w-100 mt-2" onclick="toggleCompare(${p.id})">Compare</button>
                    </div>
                </div>
            </div>`;
    });
}

function filterProducts(catId, btn) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = catId;
    applyPriceFilter();
}

function applyPriceFilter() {
    let min = parseFloat(document.getElementById('min-price').value) || 0;
    let max = parseFloat(document.getElementById('max-price').value) || Infinity;

    let filtered = allProducts;
    if (currentCategory !== 'all') {
        filtered = allProducts.filter(p => p.category == currentCategory);
    }
    filtered = filtered.filter(p => parseFloat(p.price) >= min && parseFloat(p.price) <= max);
    renderProducts(filtered);
}

function searchProduct(keyword) {
    if (!keyword) { applyPriceFilter(); return; }
    const lower = keyword.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(lower));
    renderProducts(filtered);
}

function resetFilters() {
    currentCategory = 'all';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    loadCategories();
    renderProducts(allProducts);
}

// =========================================
// 5. SEPET & CHECKOUT
// =========================================

function addToCart(name, price, image, quantity = 1) {
    for (let i = 0; i < quantity; i++) {
        cart.push({name, price, image});
    }
    saveCart(); 
    updateCartUI();
    const cartCanvas = document.getElementById('cartCanvas');
    if(cartCanvas) new bootstrap.Offcanvas(cartCanvas).show();
    showToast("Added to Cart! 🛒", "success");
}

// =========================================
// 🛒 SEPET GÜNCELLEME & KARGO BARI
// =========================================
function updateCartUI() {
    const list = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count');
    
    // 🔥 KARGO BARI ELEMENTLERİ
    const shippingBar = document.getElementById('shipping-bar');
    const shippingMsg = document.getElementById('shipping-msg');
    const FREE_SHIPPING_LIMIT = 2000; // Kargo limiti ($)

    if (!list) return;

    // Listeyi Temizle
    list.innerHTML = cart.length ? '' : '<div class="text-center text-muted mt-5"><p>Cart is empty</p></div>';
    let total = 0;

    // Ürünleri Listele ve Toplamı Hesapla
    cart.forEach((item, i) => {
        total += parseFloat(item.price);
        list.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center mb-2 border">
                <div class="d-flex align-items-center">
                    <img src="${item.image}" width="40" class="me-2 rounded">
                    <div>
                        <h6 class="mb-0 text-truncate" style="max-width:120px">${item.name}</h6>
                        <small class="text-primary">$${item.price}</small>
                    </div>
                </div>
                <button class="btn btn-sm text-danger" onclick="rem(${i})">X</button>
            </li>`;
    });

    // Toplam Fiyat ve Adet Güncelleme
    if (cartTotal) cartTotal.innerText = '$' + total.toFixed(2);
    if (cartCount) cartCount.innerText = cart.length;

    // 🔥 KARGO BARINI HESAPLA VE GÜNCELLE
    if (shippingBar && shippingMsg) {
        let percent = (total / FREE_SHIPPING_LIMIT) * 100;
        
        // Yüzde 100'ü geçmesin
        if (percent > 100) percent = 100;
        
        // Barın Genişliğini Ayarla
        shippingBar.style.width = percent + "%";

        if (total >= FREE_SHIPPING_LIMIT) {
            // LİMİT GEÇİLDİ (YEŞİL BAR)
            shippingBar.className = "progress-bar bg-success"; 
            shippingMsg.innerHTML = `🎉 Congratulations! <strong>Free Shipping</strong> unlocked!`;
        } else {
            // LİMİT GEÇİLMEDİ (SARI BAR)
            let remaining = FREE_SHIPPING_LIMIT - total;
            shippingBar.className = "progress-bar progress-bar-striped progress-bar-animated bg-warning"; 
            shippingMsg.innerHTML = `Spend <strong class="text-danger">$${remaining.toFixed(2)}</strong> more for Free Shipping 🚚`;
        }
    }
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function rem(i) { cart.splice(i, 1); saveCart(); updateCartUI(); }
function clearCart() { cart = []; saveCart(); updateCartUI(); }

function checkout() {
    if (cart.length === 0) { showToast("Cart is empty!", "error"); return; }
    // Token kontrolü: Eğer giriş yapmamışsa uyarı ver
    if (!localStorage.getItem('token')) {
        showToast("Please LOGIN to checkout!", "error");
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }
    window.location.href = "checkout.html";
}

async function completeOrder() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast("Please log in first!!", "error");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone')?.value || "";
    const address = document.getElementById('address')?.value || "";
    const couponCode = document.getElementById('couponCode')?.value || null;

    if (!fullName || !phone || !address) {
        showToast("Please fill in the Name, Phone Number, and Address fields!", "error");
        return;
    }

    // Backend'e gönderilecek ürün listesi
    const itemsPayload = cart.map(item => ({
        name: item.name, 
        price: item.price
    }));

    try {
        const res = await fetch(API_CHECKOUT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                full_name: fullName,
                address: address,
                phone: phone,
                items: itemsPayload,
                coupon_code: couponCode
            })
        });

        const data = await res.json();

        if (res.ok) {
            showToast("✅ Order successful! Thank you.", "success");
            localStorage.removeItem('cart'); 
            updateCartUI();
            
            // Profil sayfasına yönlendir
            setTimeout(() => { window.location.href = "profile.html"; }, 2000);
        } else {
            showToast("Error: " + (data.error || "Operation failed"), "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Server error!", "error");
    }
}

// =========================================
// 6. PROFİL & FAVORİLER
// =========================================

async function loadMyOrders() {
    const username = localStorage.getItem('username');
    if (!username) return;

    // Profil başlığını doldur
    const pName = document.getElementById('profile-name');
    const pUser = document.getElementById('profile-username');
    if(pName) pName.innerText = localStorage.getItem('full_name');
    if(pUser) pUser.innerText = "@" + username;

    try {
        const response = await fetch(`${API_MY_ORDERS}?username=${username}`, {
             headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
        });
        const orders = await response.json();
        const list = document.getElementById('ordersAccordion');
        
        if (!list) return;
        if(document.getElementById('loading-orders')) document.getElementById('loading-orders').classList.add('d-none');
        
        if (orders.length === 0) { 
            if(document.getElementById('no-orders')) document.getElementById('no-orders').classList.remove('d-none'); 
            return; 
        }

        list.innerHTML = "";
        orders.forEach((order, index) => {
            let itemRows = "";
            order.items.forEach(item => {
                itemRows += `<div>${item.product_name} x${item.quantity} - $${item.product_price}</div>`;
            });

            list.innerHTML += `
                <div class="accordion-item mb-2">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#order${index}">
                            Order #${order.id} - $${order.total_price}
                        </button>
                    </h2>
                    <div id="order${index}" class="accordion-collapse collapse" data-bs-parent="#ordersAccordion">
                        <div class="accordion-body">
                            <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
                            <strong>Status:</strong> ${order.status}<br>
                            <hr>
                            ${itemRows}
                        </div>
                    </div>
                </div>`;
        });
    } catch (error) { console.error(error); }
}

function toggleFavorite(id, btn) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const strId = String(id);

    if (favorites.includes(strId)) {
        // ÇIKAR
        favorites = favorites.filter(favId => favId !== strId);
        showToast("Removed from Wishlist 💔", "error");
        // Butonu boş kalp yap
        if(btn) btn.innerHTML = '<i class="bi bi-heart"></i>';
        if(btn) btn.classList.remove('text-danger');
    } else {
        // EKLE
        favorites.push(strId);
        showToast("Added to Wishlist ❤️", "success");
        // Butonu dolu kalp yap
        if(btn) btn.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>';
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Diğer butonları da güncelle (Mesela listedekileri)
    updateFavoriteIcons();
    
    // Eğer favoriler sayfasındaysan listeyi yenile
    if(document.getElementById('favorites-list')) loadMyFavorites();
}

function updateFavoriteIcons() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    document.querySelectorAll('.fav-btn').forEach(btn => {
        const id = String(btn.getAttribute('data-id'));
        if (favorites.includes(id)) {
            btn.innerHTML = '<i class="bi bi-heart-fill text-danger"></i>';
        } else {
            btn.innerHTML = '<i class="bi bi-heart"></i>';
        }
    });
}

function loadMyFavorites() {
    const list = document.getElementById('favorites-list');
    if (!list) return;

    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (favorites.length === 0) {
        list.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-heartbreak display-4"></i><p class="mt-2">No favorites yet.</p></div>';
        return;
    }

    // Yükleniyor ikonu (opsiyonel)
    list.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>';

    fetch(API_PRODUCTS).then(res => res.json()).then(data => {
        const favProducts = data.filter(p => favorites.includes(String(p.id)));
        list.innerHTML = "";
        
        favProducts.forEach(p => {
            let img = p.image ? (p.image.startsWith('http') ? p.image : BASE_URL + p.image) : 'https://via.placeholder.com/100';
            
            list.innerHTML += `
                <div class="col-6 col-md-4 col-lg-3 mb-3">
                    <div class="card h-100 shadow-sm border-0">
                        <div class="card-body p-3 text-center d-flex flex-column">
                            
                            <a href="detail.html?id=${p.id}" class="text-decoration-none text-dark mb-2">
                                <img src="${img}" class="img-fluid mb-2" style="height: 120px; object-fit: contain;">
                                <h6 class="card-title text-truncate small fw-bold">${p.name}</h6>
                                <span class="text-primary fw-bold">$${p.price}</span>
                            </a>
                            
                            <button class="btn btn-sm btn-outline-danger w-100 mt-auto" onclick="toggleFavorite(${p.id}, this)">
                                <i class="bi bi-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

// =========================================
// ⭐ YORUM SİSTEMİ
// =========================================
function loadReviews(productId) {
    const list = document.getElementById('reviews-list');
    if (!list) return;

    fetch(`${API_REVIEWS}?product_id=${productId}`)
        .then(res => res.json())
        .then(data => {
            list.innerHTML = "";
            if (data.length === 0) list.innerHTML = "<p>No reviews yet.</p>";
            data.forEach(r => {
                list.innerHTML += `
                    <div class="border-bottom pb-2 mb-2">
                        <strong>${r.username}</strong> <span class="text-warning">(${r.rating}★)</span>
                        <p class="mb-0 text-muted">${r.comment}</p>
                    </div>`;
            });
        });
}

async function submitReview() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const rating = document.getElementById('review-rating').value;
    const comment = document.getElementById('review-text').value;
    const token = localStorage.getItem('token');

    if (!token) {
        showToast("Please login to write a review!", "error");
        return;
    }

    try {
        const res = await fetch(API_REVIEWS, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({ product_id: productId, rating, comment })
        });
        if (res.ok) {
            showToast("Review submitted!", "success");
            loadReviews(productId);
            document.getElementById('review-text').value = "";
        } else {
            showToast("Failed to submit review", "error");
        }
    } catch (e) { console.error(e); }
}

// =========================================
// 🌙 KARANLIK MOD & İLETİŞİM
// =========================================
function toggleTheme() {
    const htmlEl = document.documentElement;
    if (htmlEl.getAttribute('data-bs-theme') === 'dark') setTheme('light');
    else setTheme('dark');
}

function setTheme(mode) {
    const htmlEl = document.documentElement;
    htmlEl.setAttribute('data-bs-theme', mode);
    localStorage.setItem('theme', mode);
    const themeBtn = document.getElementById('theme-btn');
    if(themeBtn) themeBtn.innerHTML = mode === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
}

async function sendMessage() {
    // HTML'deki ID'ler: contactName, contactEmail (Senin paylaştığın dosyaya göre)
    const name = document.getElementById('contactName')?.value || document.getElementById('contact-name')?.value;
    const email = document.getElementById('contactEmail')?.value || document.getElementById('contact-email')?.value;
    const subject = document.getElementById('contactSubject')?.value || document.getElementById('contact-subject')?.value;
    const message = document.getElementById('contactMessage')?.value || document.getElementById('contact-message')?.value;

    if (!name || !email || !message) {
        showToast("Please fill all fields!", "error");
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showToast("You must LOGIN to send a message!", "error");
        return;
    }

    try {
        const response = await fetch(API_CONTACT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({ name, email, subject, message })
        });

        if (response.ok) {
            showToast("Message sent successfully! ✅", "success");
            // Formu resetle (hangi form id varsa)
            const form = document.getElementById('contact-form') || document.querySelector('form');
            if(form) form.reset();
        } else {
            showToast("Error sending message!", "error");
        }
    } catch (error) {
        console.error("Error:", error);
        showToast("Server error!", "error");
    }
}

// =========================================
// ✏️ PROFİL DÜZENLEME
// =========================================
async function loadProfileData() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(API_PROFILE, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
            if(document.getElementById('edit-firstname')) document.getElementById('edit-firstname').value = data.first_name;
            if(document.getElementById('edit-lastname')) document.getElementById('edit-lastname').value = data.last_name;
            if(document.getElementById('edit-email')) document.getElementById('edit-email').value = data.email;
        }
    } catch (e) { console.error(e); }
}

async function saveProfileChanges() {
    const token = localStorage.getItem('token');
    const fName = document.getElementById('edit-firstname').value;
    const lName = document.getElementById('edit-lastname').value;
    const email = document.getElementById('edit-email').value;

    try {
        const res = await fetch(API_PROFILE, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({ first_name: fName, last_name: lName, email: email })
        });
        if (res.ok) {
            const result = await res.json();
            showToast("Profile updated!", "success");
            localStorage.setItem('full_name', result.full_name);
            location.reload();
        }
    } catch (e) { console.error(e); }
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove('bi-eye-slash-fill');
        icon.classList.add('bi-eye-fill');
    } else {
        input.type = "password";
        icon.classList.remove('bi-eye-fill');
        icon.classList.add('bi-eye-slash-fill');
    }
}

// =========================================
// 🏠 ADRES YÖNETİMİ
// =========================================
async function loadAddresses() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(API_ADDRESS, { headers: { 'Authorization': `Token ${token}` } });
        const data = await res.json();
        
        const list = document.getElementById('address-list');
        const select = document.getElementById('savedAddressSelect');

        if (list) {
            list.innerHTML = "";
            if (data.length === 0) list.innerHTML = "<p>No addresses found.</p>";
            data.forEach(addr => {
                list.innerHTML += `
                    <div class="col-md-6 mb-2">
                        <div class="card p-3 shadow-sm relative">
                            <strong>${addr.title}</strong><br>
                            ${addr.full_address} - ${addr.city}<br>
                            <small>${addr.phone}</small>
                            <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2" onclick="deleteAddress(${addr.id})">X</button>
                        </div>
                    </div>`;
            });
        }
        
        if (select) {
            select.innerHTML = '<option value="">-- Select Address --</option>';
            data.forEach(addr => {
                select.innerHTML += `<option value='${JSON.stringify(addr)}'>${addr.title}</option>`;
            });
        }
    } catch (e) { console.error(e); }
}

async function saveAddress() {
    const token = localStorage.getItem('token');
    const title = document.getElementById('addr-title').value;
    const city = document.getElementById('addr-city').value;
    const phone = document.getElementById('addr-phone').value;
    const full = document.getElementById('addr-text').value;

    try {
        const res = await fetch(API_ADDRESS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` },
            body: JSON.stringify({ title, city, phone, full_address: full })
        });
        if (res.ok) {
            showToast("Address Saved!", "success");
            loadAddresses();
            // Modalı kapat
            const modalEl = document.getElementById('addAddressModal');
            if(modalEl) bootstrap.Modal.getInstance(modalEl).hide();
        }
    } catch (e) { console.error(e); }
}

async function deleteAddress(id) {
    if(!confirm("Delete address?")) return;
    try {
        await fetch(`${API_ADDRESS}?id=${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Token ${localStorage.getItem('token')}` } 
        });
        loadAddresses();
    } catch (e) { console.error(e); }
}

function fillCheckoutForm(selectElement) {
    const val = selectElement.value;
    const addressInput = document.getElementById('address');
    const phoneInput = document.getElementById('phone');

    // Eğer kullanıcı "Seçiniz" (boş) seçeneğine dönerse kilidi aç ki elle yazabilsin
    if (!val) {
        addressInput.removeAttribute('readonly');
        phoneInput.removeAttribute('readonly');
        addressInput.classList.remove('bg-light'); // Gri rengi kaldır
        
        // İstersen içini de temizle (temizlemek istemiyorsan alt 2 satırı sil)
        addressInput.value = "";
        phoneInput.value = "";
        return;
    }

    const addr = JSON.parse(val);
    
    // 1. Bilgileri Doldur
    addressInput.value = addr.full_address + ", " + addr.city;
    phoneInput.value = addr.phone;
    
    // 2. 🔥 KUTULARI KİLİTLE (READONLY)
    addressInput.setAttribute('readonly', true);
    phoneInput.setAttribute('readonly', true);
    
    // 3. Görsel olarak gri yap (Kilitli olduğu anlaşılsın)
    addressInput.classList.add('bg-light');
    phoneInput.classList.add('bg-light');

    showToast("Address loaded: " + addr.title, "success");
}

// =========================================
// 🔥 KARŞILAŞTIRMA (COMPARE)
// =========================================
let compareList = [];

function toggleCompare(id) {
    const product = allProducts.find(p => p.id === id); 
    if (!product) return;
    const exists = compareList.find(p => p.id === id);

    if (exists) {
        compareList = compareList.filter(p => p.id !== id);
        showToast("Removed from comparison", "error");
    } else {
        if (compareList.length >= 3) { showToast("Max 3 items!", "error"); return; }
        if (compareList.length > 0 && compareList[0].category != product.category) {
            showToast("Different categories!", "error"); return;
        }
        compareList.push(product);
        showToast("Added to comparison", "success");
    }
    updateCompareUI();
}

function updateCompareUI() {
    const container = document.getElementById('compare-floating-container');
    const countSpan = document.getElementById('compare-count');
    if (countSpan) countSpan.innerText = compareList.length;
    if (container) container.style.display = compareList.length > 0 ? 'block' : 'none';
}

function resetComparison() {
    compareList = [];
    updateCompareUI();
}

function openCompareModal() {
    const header = document.getElementById('compare-header');
    const body = document.getElementById('compare-body');
    const modalEl = document.getElementById('compareModal');
    if (!modalEl) return;
    
    const modal = new bootstrap.Modal(modalEl);
    if (compareList.length < 2) { showToast("Select at least 2 items!", "error"); return; }

    // Tabloyu oluştur (Basitleştirilmiş)
    let headerHTML = '<tr><th>Feature</th>';
    compareList.forEach(p => headerHTML += `<th>${p.name}</th>`);
    headerHTML += '</tr>';
    header.innerHTML = headerHTML;

    let bodyHTML = `<tr><td>Price</td>${compareList.map(p => `<td>$${p.price}</td>`).join('')}</tr>`;
    bodyHTML += `<tr><td>Stock</td>${compareList.map(p => `<td>${p.stock}</td>`).join('')}</tr>`;
    body.innerHTML = bodyHTML;
    
    modal.show();
}

// =========================================
// ✨ OTOMATİK FORM DOLDURMA (CONTACT)
// =========================================
async function autoFillContactForm() {
    // 1. Giriş yapmamışsa hiç uğraşma
    const token = localStorage.getItem('token');
    if (!token) return;

    // 2. Sayfada Contact formu var mı?
    // (Senin HTML'de ID'ler bazen contact-name bazen contactName olabiliyor, ikisine de bakalım)
    const nameInput = document.getElementById('contact-name') || document.getElementById('contactName');
    const emailInput = document.getElementById('contact-email') || document.getElementById('contactEmail');

    // Eğer sayfada bu kutular yoksa (Mesela Ana Sayfadaysan) dur.
    if (!nameInput && !emailInput) return;

    // 3. Bilgileri Çek ve Doldur
    try {
        const res = await fetch(API_PROFILE, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
            if (nameInput) {
                nameInput.value = `${data.first_name} ${data.last_name}`;
                // Kutuyu kitleyelim ki değiştiremesin (Opsiyonel, istersen bu satırı sil)
                nameInput.setAttribute('readonly', true); 
                nameInput.classList.add('bg-light'); // Gri yapsın
            }
            if (emailInput) {
                emailInput.value = data.email;
                emailInput.setAttribute('readonly', true);
                emailInput.classList.add('bg-light');
            }
        }
    } catch (e) {
        console.error("Autofill error:", e);
    }
}

// =========================================
// ➕ MİKTAR ARTIR / AZALT (DETAIL PAGE)
// =========================================
function increaseQty() {
    const qtyInput = document.getElementById('product-qty');
    if(qtyInput) {
        let val = parseInt(qtyInput.value);
        qtyInput.value = val + 1;
    }
}

function decreaseQty() {
    const qtyInput = document.getElementById('product-qty');
    if(qtyInput) {
        let val = parseInt(qtyInput.value);
        if(val > 1) { // 1'in altına düşmesin
            qtyInput.value = val - 1;
        }
    }
}

// =========================================
// ⬆️ GLOBAL SCROLL TO TOP (Tüm Sayfalar İçin)
// =========================================
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Butonu Yoktan Var Et (Create Element)
    const topBtn = document.createElement("button");
    topBtn.innerHTML = '<i class="bi bi-arrow-up fw-bold fs-4"></i>';
    topBtn.className = "btn btn-primary rounded-circle shadow-lg";
    topBtn.id = "btn-back-to-top";
    
    // 2. Butonun Stillerini Ayarla (CSS)
    // Chatbot varsa onun üstünde dursun diye bottom: 90px yaptık
    Object.assign(topBtn.style, {
        display: "none", // Başlangıçta gizli
        position: "fixed",
        bottom: "90px", 
        right: "25px",
        zIndex: "9999",
        width: "50px",
        height: "50px",
        border: "2px solid white",
        transition: "all 0.3s"
    });

    // 3. Butonu Sayfaya (Body'ye) Ekle
    document.body.appendChild(topBtn);

    // 4. Kaydırma Olayını Dinle
    window.addEventListener("scroll", function() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            topBtn.style.display = "block";
        } else {
            topBtn.style.display = "none";
        }
    });

    // 5. Tıklama Olayı (Yukarı Fırlat)
    topBtn.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});

