// =========================================
// 1. API ADRESLERİ & AYARLAR
// =========================================
const BASE_URL = 'http://127.0.0.1:8000';
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
        alert(message); // Toastify yüklenmezse yedek
    }
}

// =========================================
// 2. SAYFA YÜKLENDİĞİNDE ÇALIŞACAKLAR
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();     
    checkLoginStatus(); 
    loadAddresses(); 
    
    // Ana Sayfa Yüklemeleri
    if(document.getElementById('category-list')) loadCategories();
    if(document.getElementById('product-list')) loadProducts();

    // Detay Sayfası Yüklemeleri
    if (window.location.pathname.includes('detail.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (productId) loadSingleProduct(productId);
    }

    // Checkout Sayfası (Otomatik Doldurma)
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
// 3. KULLANICI İŞLEMLERİ (AUTH)
// =========================================

function checkLoginStatus() {
    const userArea = document.getElementById('user-area');
    if (!userArea) return; 

    const token = localStorage.getItem('userToken');
    const fullName = localStorage.getItem('fullName');

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

async function registerUser() {
    const u = document.getElementById('regUsername').value;
    const e = document.getElementById('regEmail').value;
    const p = document.getElementById('regPassword').value;
    const f = document.getElementById('regName').value;
    const l = document.getElementById('regSurname').value;

    try {
        const res = await fetch(API_REGISTER, { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify({username:u, email:e, password:p, first_name:f, last_name:l})
        });
        
        if(res.ok) { 
            showToast("✅ Registration Successful! Please login.", "success"); 
            document.getElementById('pills-login-tab').click(); 
        } else { 
            showToast("❌ Registration failed! Check your details.", "error"); 
        }
    } catch(e) { console.error(e); showToast("Server error!", "error"); }
}

async function loginUser() {
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(API_LOGIN, { 
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify({username:u, password:p})
        });
        const result = await res.json();

        if(res.ok) {
            localStorage.setItem('userToken', result.token);
            localStorage.setItem('fullName', result.full_name);
            localStorage.setItem('username', result.username); 
            showToast("👋 Welcome back, " + result.full_name, "success");
            setTimeout(() => { window.location.href = "index.html"; }, 1000);
        } else {
            showToast("❌ Login failed: " + result.error, "error");
        }
    } catch(e) { console.error(e); showToast("Server error!", "error"); }
}

function logoutUser() {
    const userArea = document.getElementById('user-area');
    if (userArea) {
        userArea.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <div class="spinner-border spinner-border-sm" role="status"></div>
                <span>Bye Bye... 👋</span>
            </div>
        `;
    }
    localStorage.removeItem('userToken');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    localStorage.removeItem('cart'); 
    showToast("Logged out successfully 👋", "success");
    setTimeout(() => { window.location.href = "index.html"; }, 1500);
}

function autoFillCheckout() {
    const fullName = localStorage.getItem('fullName');
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
            
            const stockLabel = document.getElementById('detail-stock');
            const btn = document.getElementById('detail-btn');
            
            // Stok ve Buton Mantığı
            if(product.stock < 1) {
                stockLabel.className = 'badge bg-secondary'; stockLabel.innerText = 'Out of Stock';
                btn.disabled = true; btn.innerText = 'Out of Stock';
            } else {
                if(product.stock < 10) {
                    stockLabel.className = 'badge bg-warning text-dark'; stockLabel.innerText = 'Low Stock!';
                } else {
                    stockLabel.className = 'badge bg-success'; stockLabel.innerText = 'In Stock';
                }
                
                btn.onclick = () => {
                    const qtyInput = document.getElementById('product-qty');
                    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
                    addToCart(product.name, product.price, img, quantity);
                };
            }

            document.getElementById('loading').classList.add('d-none');
            document.getElementById('product-content').classList.remove('d-none');

            const related = data.filter(p => p.category == product.category && p.id != id);
            renderRelatedProducts(related.slice(0, 4));

            if(document.getElementById('reviews-list')) loadReviews(id);
        }
    });
}

function renderRelatedProducts(products) {
    const area = document.getElementById('related-area');
    const list = document.getElementById('related-list');
    if (!area || !list) return;

    if (products.length > 0) {
        area.classList.remove('d-none');
        list.innerHTML = "";
        products.forEach(p => {
            let img = p.image ? (p.image.startsWith('http') ? p.image : BASE_URL + p.image) : 'https://via.placeholder.com/300';
            list.innerHTML += `
                <div class="col-md-3 col-6">
                    <div class="card h-100 shadow-sm hover-scale">
                        <a href="detail.html?id=${p.id}"><img src="${img}" class="card-img-top" style="height: 150px; object-fit: contain;"></a>
                        <div class="card-body p-2 text-center">
                            <h6 class="card-title text-truncate"><a href="detail.html?id=${p.id}" class="text-decoration-none text-dark">${p.name}</a></h6>
                            <span class="text-primary fw-bold">$${p.price}</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }
}

function renderProducts(products) {
    const list = document.getElementById('product-list');
    const countLabel = document.getElementById('result-count');
    if(!list) return;
    
    if(products.length === 0) {
        list.innerHTML = '<div class="alert alert-warning text-center w-100">No products found for this filter.</div>';
        countLabel.innerText = "0 found"; return;
    }
    list.innerHTML = "";
    countLabel.innerText = `Showing ${products.length} products`;

    products.forEach(p => {
        let img = p.image ? (p.image.startsWith('http') ? p.image : BASE_URL + p.image) : 'https://via.placeholder.com/300';
        let stokRozeti = p.stock === 0 ? '<span class="badge bg-secondary position-absolute top-0 start-0 m-2 z-2">Sold Out</span>' : '';
        let butonDurumu = p.stock === 0 ? 'disabled' : `onclick="addToCart('${p.name}', ${p.price}, '${img}')"`;
        let butonText = p.stock === 0 ? 'No Stock' : 'Add +';
        let butonClass = p.stock === 0 ? 'btn-secondary' : 'btn-outline-primary';

        list.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 shadow-sm position-relative product-card">
                    ${stokRozeti}
                    <button class="btn btn-light rounded-circle position-absolute top-0 end-0 m-2 shadow-sm fav-btn z-3" 
                        data-id="${p.id}" onclick="toggleFavorite(${p.id}, this)">
                        <i class="bi bi-heart"></i>
                    </button>
                    <a href="detail.html?id=${p.id}"><img src="${img}" class="card-img-top"></a>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold text-truncate"><a href="detail.html?id=${p.id}" class="text-decoration-none text-dark">${p.name}</a></h5>
                        <p class="text-muted small mb-3">${p.description.substring(0, 60)}...</p>
                        <div class="mt-auto">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="text-primary fw-bold fs-5">$${p.price}</span>
                                <button class="btn ${butonClass} btn-sm rounded-pill px-3" ${butonDurumu}>${butonText}</button>
                            </div>
                            
                            <button class="btn btn-outline-secondary btn-sm w-100 mt-1" onclick="toggleCompare(${p.id})">
                                <i class="bi bi-arrow-left-right"></i> Compare
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    updateFavoriteIcons();
}

function filterProducts(catId, btn) {
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = catId;
    applyPriceFilter();
}

function sortProducts(criteria) {
    let list = currentCategory === 'all' ? [...allProducts] : allProducts.filter(p => p.category == currentCategory);
    
    if(criteria === 'price-asc') list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if(criteria === 'price-desc') list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if(criteria === 'name-asc') list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    if(criteria === 'name-desc') list.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
    if(criteria === 'newest') list.sort((a, b) => b.id - a.id);
    
    renderProducts(list);
}

function applyPriceFilter() {
    let min = document.getElementById('min-price').value;
    let max = document.getElementById('max-price').value;

    min = min ? parseFloat(min) : 0;
    max = max ? parseFloat(max) : Infinity;

    let filteredList = [];

    if (currentCategory === 'all') {
        filteredList = allProducts;
    } else {
        filteredList = allProducts.filter(p => p.category == currentCategory);
    }

    filteredList = filteredList.filter(p => {
        let price = parseFloat(p.price);
        return price >= min && price <= max;
    });

    renderProducts(filteredList);
}

function resetFilters() {
    currentCategory = 'all';
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('.category-btn');
    if(allBtn) allBtn.classList.add('active');

    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) searchInput.value = '';

    renderProducts(allProducts);
    showToast("Filters reset! 🔄", "success");
}

function searchProduct(keyword) {
    let listToSearch = [];
    if (currentCategory === 'all') { listToSearch = allProducts; } 
    else { listToSearch = allProducts.filter(p => p.category == currentCategory); }

    if (!keyword) { renderProducts(listToSearch); return; }

    const lowerKeyword = keyword.toLowerCase();
    const filteredList = listToSearch.filter(p => 
        p.name.toLowerCase().includes(lowerKeyword) || 
        p.description.toLowerCase().includes(lowerKeyword)
    );
    renderProducts(filteredList);
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
    new bootstrap.Offcanvas(document.getElementById('cartCanvas')).show();
    
    if (quantity > 1) {
        showToast(`${quantity} items added to Cart! 🛒`, "success");
    } else {
        showToast("Added to Cart! 🛒", "success");
    }
}

function updateCartUI() {
    const list = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const shippingBar = document.getElementById('shipping-bar');
    const shippingMsg = document.getElementById('shipping-msg');
    const FREE_SHIPPING_LIMIT = 2000; 

    if (!list) return;

    list.innerHTML = cart.length ? '' : '<div class="text-center text-muted mt-5"><p>Cart is empty</p></div>';
    let total = 0;

    cart.forEach((item, i) => {
        total += parseFloat(item.price);
        list.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center mb-2 border">
                <div class="d-flex align-items-center"><img src="${item.image}" width="40" class="me-2 rounded"><div><h6 class="mb-0 text-truncate" style="max-width:120px">${item.name}</h6><small class="text-primary">$${item.price}</small></div></div>
                <button class="btn btn-sm text-danger" onclick="rem(${i})">X</button>
            </li>`;
    });

    if (cartTotal) cartTotal.innerText = '$' + total.toFixed(2);
    if (cartCount) cartCount.innerText = cart.length;

    if (shippingBar && shippingMsg) {
        let percent = (total / FREE_SHIPPING_LIMIT) * 100;
        if (percent > 100) percent = 100;
        shippingBar.style.width = percent + "%";
        if (total >= FREE_SHIPPING_LIMIT) {
            shippingBar.className = "progress-bar bg-success"; 
            shippingMsg.innerHTML = `🎉 Congratulations! <strong>Free Shipping</strong> unlocked!`;
        } else {
            let remaining = FREE_SHIPPING_LIMIT - total;
            shippingBar.className = "progress-bar progress-bar-striped progress-bar-animated bg-warning"; 
            shippingMsg.innerHTML = `Spend <strong class="text-danger">$${remaining.toFixed(2)}</strong> more for Free Shipping 🚚`;
        }
    }
}

function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); }
function rem(i) { cart.splice(i, 1); saveCart(); updateCartUI(); showToast("Removed from cart 🗑️", "error"); }
function clearCart() { cart = []; saveCart(); updateCartUI(); showToast("Cart cleared! 🧹", "error"); }

function checkout() {
    if (cart.length === 0) { showToast("Cart is empty! ⚠️", "error"); return; }
    window.location.href = "checkout.html";
}

async function completeOrder() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        showToast("Lütfen önce giriş yapın!", "error");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    const fullNameInput = document.getElementById('fullName');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    
    let fullName = "";
    if (fullNameInput) {
        fullName = fullNameInput.value;
    } else if (firstNameInput && lastNameInput) {
        fullName = `${firstNameInput.value} ${lastNameInput.value}`;
    }

    const phone = document.getElementById('phone')?.value || "";
    const address = document.getElementById('address')?.value || "";
    const couponCode = document.getElementById('couponCode')?.value || null;

    if (!fullName || !phone || !address) {
        showToast("Lütfen İsim, Telefon ve Adres alanlarını doldurun!", "error");
        return;
    }

    if (cart.length === 0) {
        showToast("Sepetiniz boş!", "error");
        return;
    }

    let originalTotal = cart.reduce((acc, item) => acc + parseFloat(item.price), 0);
    const submitBtn = document.querySelector('button[onclick="completeOrder()"]');
    const originalText = submitBtn ? submitBtn.innerHTML : "Complete Order";
    if(submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Kupon Kontrol Ediliyor...';
    }

    const payload = {
        full_name: fullName,
        address: address,
        phone: phone,
        items: cart,
        coupon_code: couponCode
    };

    try {
        const res = await fetch(API_CHECKOUT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            if (data.final_price && parseFloat(data.final_price) < originalTotal) {
                const totalEl = document.getElementById('checkout-total');
                if (totalEl) {
                    totalEl.innerHTML = `
                        <div class="d-flex flex-column align-items-end">
                            <small class="text-muted text-decoration-line-through me-2">$${originalTotal.toFixed(2)}</small>
                            <span class="text-success fw-bold fs-3">$${data.final_price}</span>
                            <span class="badge bg-success mt-1">🎉 KUPON UYGULANDI!</span>
                        </div>
                    `;
                }
                showToast(`🎉 İndirim Uygulandı! Yeni Tutar: $${data.final_price}`, "success");
            } else {
                showToast("✅ Siparişiniz Alındı!", "success");
            }

            if(submitBtn) {
                submitBtn.className = "w-100 btn btn-success btn-lg rounded-pill shadow fw-bold py-3";
                submitBtn.innerHTML = `SİPARİŞ ONAYLANDI! 🚀`;
            }

            localStorage.removeItem('cart'); 
            updateCartUI();
            
            setTimeout(() => {
                window.location.href = "profile.html"; 
            }, 3000);

        } else {
            console.error("Sipariş Hatası:", data);
            let errorMsg = data.error || "Bilinmeyen hata";
            if (errorMsg.includes("Coupon")) {
                showToast("⚠️ " + errorMsg, "error");
            } else {
                showToast("Hata: " + errorMsg, "error");
            }
            if(submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    } catch (e) {
        console.error("Bağlantı Hatası:", e);
        showToast("Sunucuyla iletişim kurulamadı!", "error");
        if(submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// =========================================
// 6. PROFİL & FAVORİLER
// =========================================

async function loadMyOrders() {
    const username = localStorage.getItem('username');
    const fullName = localStorage.getItem('fullName');

    if (!username) { showToast("Please login to view orders", "error"); window.location.href = 'login.html'; return; }

    const profileName = document.getElementById('profile-name');
    const profileUser = document.getElementById('profile-username');
    
    if(profileName) profileName.innerText = fullName;
    if(profileUser) profileUser.innerText = "@" + username;

    try {
        const response = await fetch(`${API_MY_ORDERS}?username=${username}`, {
             headers: { 'Authorization': `Token ${localStorage.getItem('userToken')}` }
        });
        const orders = await response.json();
        const list = document.getElementById('ordersAccordion');
        
        if(document.getElementById('loading-orders')) document.getElementById('loading-orders').classList.add('d-none');

        if (orders.length === 0) { 
            if(document.getElementById('no-orders')) document.getElementById('no-orders').classList.remove('d-none'); 
            return; 
        }

        list.innerHTML = "";
        orders.forEach((order, index) => {
            let itemRows = "";
            order.items.forEach(item => {
                let imgPath = item.product_image;
                if(imgPath && !imgPath.startsWith('http')) imgPath = BASE_URL + imgPath;
                else if (!imgPath) imgPath = 'https://via.placeholder.com/50';

                itemRows += `
                    <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                        <div class="d-flex align-items-center">
                            <img src="${imgPath}" width="60" class="rounded border me-3">
                            <div><h6 class="mb-0 fw-bold">${item.product_name}</h6><small class="text-muted">Quantity: ${item.quantity}</small></div>
                        </div>
                        <span class="fw-bold text-dark">$${item.product_price}</span>
                    </div>`;
            });

            list.innerHTML += `
                <div class="accordion-item border-0 mb-3 shadow-sm rounded overflow-hidden">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed bg-white" type="button" data-bs-toggle="collapse" data-bs-target="#order${index}">
                            <div class="d-flex justify-content-between w-100 me-3 align-items-center">
                                <div><span class="badge bg-primary me-2">Order #${order.id}</span><span class="text-muted small">${new Date(order.created_at).toLocaleDateString()}</span></div>
                                <span class="fw-bold text-success fs-5">$${order.total_price}</span>
                            </div>
                        </button>
                    </h2>
                    <div id="order${index}" class="accordion-collapse collapse" data-bs-parent="#ordersAccordion">
                        <div class="accordion-body bg-light">
                            <h6 class="text-muted mb-3 small fw-bold">ITEMS:</h6>
                            ${itemRows}
                            <div class="text-end mt-2"><small class="text-muted">Address: ${order.address}</small></div>
                        </div>
                    </div>
                </div>`;
        });
    } catch (error) { console.error(error); showToast("Failed to load orders.", "error"); }
}

function toggleFavorite(id, btn) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const strId = String(id);

    if (favorites.includes(strId)) {
        favorites = favorites.filter(favId => favId !== strId);
        btn.innerHTML = '<i class="bi bi-heart"></i>';
        btn.classList.remove('text-danger');
        showToast("Removed from Wishlist 💔", "error");
    } else {
        favorites.push(strId);
        btn.innerHTML = '<i class="bi bi-heart-fill"></i>';
        btn.classList.add('text-danger');
        btn.classList.add('animate-heart');
        setTimeout(() => btn.classList.remove('animate-heart'), 300);
        showToast("Added to Wishlist ❤️", "success");
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    if(document.getElementById('favorites-list')) loadMyFavorites();
}

function updateFavoriteIcons() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    document.querySelectorAll('.fav-btn').forEach(btn => {
        const id = String(btn.getAttribute('data-id'));
        if (favorites.includes(id)) {
            btn.innerHTML = '<i class="bi bi-heart-fill"></i>';
            btn.classList.add('text-danger');
        } else {
            btn.innerHTML = '<i class="bi bi-heart"></i>';
            btn.classList.remove('text-danger');
        }
    });
}

function loadMyFavorites() {
    const list = document.getElementById('favorites-list');
    if (!list) return;

    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (favorites.length === 0) {
        list.innerHTML = '<div class="text-center text-muted py-5"><i class="bi bi-heartbreak display-1"></i><p class="mt-3">No favorites yet.</p></div>';
        return;
    }

    list.innerHTML = '<div class="text-center"><div class="spinner-border text-danger"></div></div>';

    fetch(API_PRODUCTS).then(res => res.json()).then(data => {
        const favProducts = data.filter(p => favorites.includes(String(p.id)));
        list.innerHTML = "";
        favProducts.forEach(p => {
            let img = p.image ? (p.image.startsWith('http') ? p.image : BASE_URL + p.image) : 'https://via.placeholder.com/100';
            list.innerHTML += `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card h-100 shadow-sm border-0">
                        <div class="position-relative">
                            <img src="${img}" class="card-img-top" style="height: 150px; object-fit: contain;">
                            <button class="btn btn-light rounded-circle position-absolute top-0 end-0 m-2 shadow-sm text-danger" onclick="toggleFavorite(${p.id}, this)">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        <div class="card-body text-center p-2">
                            <h6 class="card-title text-truncate fw-bold"><a href="detail.html?id=${p.id}" class="text-dark text-decoration-none">${p.name}</a></h6>
                            <span class="text-primary fw-bold">$${p.price}</span>
                            <button class="btn btn-sm btn-outline-primary w-100 mt-2 rounded-pill" onclick="addToCart('${p.name}', ${p.price}, '${img}')">Add to Cart</button>
                        </div>
                    </div>
                </div>`;
        });
    });
}

// =========================================
// ⭐ YORUM SİSTEMİ (REVIEWS)
// =========================================

function loadReviews(productId) {
    const list = document.getElementById('reviews-list');
    const countLabel = document.getElementById('review-count');
    if (!list) return;

    fetch(`${API_REVIEWS}?product_id=${productId}`)
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) {
                list.innerHTML = "";
                if(countLabel) countLabel.innerText = data.length;
                
                data.forEach(r => {
                    let stars = "";
                    for(let i=0; i<5; i++) {
                        stars += i < r.rating ? '<i class="bi bi-star-fill text-warning"></i>' : '<i class="bi bi-star text-muted"></i>';
                    }

                    list.innerHTML += `
                        <div class="mb-3 border-bottom pb-2">
                            <div class="d-flex justify-content-between">
                                <span class="fw-bold"><i class="bi bi-person-circle"></i> ${r.username}</span>
                                <small class="text-muted">${new Date(r.created_at).toLocaleDateString()}</small>
                            </div>
                            <div class="mb-1">${stars}</div>
                            <p class="text-muted mb-0">${r.comment}</p>
                        </div>
                    `;
                });
            } else {
                list.innerHTML = '<div class="text-center text-muted mt-4">No reviews yet. Be the first! 🚀</div>';
                if(countLabel) countLabel.innerText = "0";
            }
        });
}

async function submitReview() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const rating = document.getElementById('review-rating').value;
    const comment = document.getElementById('review-text').value;
    const token = localStorage.getItem('userToken');

    if (!token) {
        showToast("Please login to write a review!", "error");
        setTimeout(() => window.location.href = "login.html", 2000);
        return;
    }

    try {
        const res = await fetch(API_REVIEWS, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
                product_id: productId,
                rating: rating,
                comment: comment
            })
        });

        if (res.ok) {
            showToast("Review submitted! Thank you ⭐", "success");
            document.getElementById('review-text').value = ""; 
            loadReviews(productId); 
        } else {
            const err = await res.json();
            showToast("Error: " + (err.error || "Failed"), "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Server error!", "error");
    }
}

// =========================================
// 🌙 KARANLIK MOD & İLETİŞİM
// =========================================

function toggleTheme() {
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute('data-bs-theme');
    if (currentTheme === 'dark') setTheme('light');
    else setTheme('dark');
}

function setTheme(mode) {
    const htmlEl = document.documentElement;
    const themeBtn = document.getElementById('theme-btn');
    const nav = document.querySelector('nav');
    const footer = document.querySelector('footer');

    if (mode === 'dark') {
        htmlEl.setAttribute('data-bs-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        if(themeBtn) themeBtn.innerHTML = '<i class="bi bi-sun-fill"></i>';
        
        if (nav) { 
            nav.classList.remove('bg-white', 'navbar-light'); 
            nav.classList.add('bg-dark', 'navbar-dark'); 
        }
        if (footer) { 
            footer.classList.remove('bg-light'); 
            footer.classList.add('bg-black', 'text-white'); 
        }

    } else {
        htmlEl.setAttribute('data-bs-theme', 'light');
        localStorage.setItem('theme', 'light');
        if(themeBtn) themeBtn.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
        
        if (nav) { 
            nav.classList.remove('bg-dark', 'navbar-dark', 'bg-primary'); 
            nav.classList.add('bg-white', 'navbar-light'); 
        }
        if (footer) { 
             footer.classList.add('bg-dark', 'text-white');
        }
    }
}

async function sendContactMessage() {
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const subject = document.getElementById('contactSubject').value;
    const message = document.getElementById('contactMessage').value;
    const btn = document.getElementById('submitButton');

    const oldText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sending...';

    const contactData = { name, email, subject, message };

    try {
        const res = await fetch(API_CONTACT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
        });

        if (res.ok) {
            showToast("✅ Message sent successfully!", "success");
            setTimeout(() => window.location.reload(), 1500); 
        } else {
            showToast("❌ Error sending message.", "error");
            btn.disabled = false;
            btn.innerHTML = oldText;
        }
    } catch (error) {
        console.error(error);
        showToast("Server connection error!", "error");
        btn.disabled = false;
        btn.innerHTML = oldText;
    }
}

// =========================================
// ✏️ PROFİL DÜZENLEME (EDIT PROFILE)
// =========================================

async function loadProfileData() {
    const token = localStorage.getItem('userToken');
    if (!token) return;

    try {
        const res = await fetch(API_PROFILE, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
            if(document.getElementById('profile-name')) 
                document.getElementById('profile-name').innerText = `${data.first_name} ${data.last_name}`;
            if(document.getElementById('profile-username')) 
                document.getElementById('profile-username').innerText = `@${data.username}`;
            if(document.getElementById('profile-email')) 
                document.getElementById('profile-email').innerText = data.email;

            document.getElementById('edit-firstname').value = data.first_name;
            document.getElementById('edit-lastname').value = data.last_name;
            document.getElementById('edit-email').value = data.email;
        }
    } catch (e) { console.error("Profil yüklenemedi", e); }
}

function openEditProfileModal() {
    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

async function saveProfileChanges() {
    const token = localStorage.getItem('userToken');
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
            body: JSON.stringify({
                first_name: fName,
                last_name: lName,
                email: email
            })
        });

        const result = await res.json();

        if (res.ok) {
            showToast("Profile updated successfully! ✅", "success");
            localStorage.setItem('fullName', result.full_name);
            document.getElementById('profile-name').innerText = result.full_name;
            document.getElementById('profile-email').innerText = email;
            
            const modalEl = document.getElementById('editProfileModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
        } else {
            showToast("Error: " + (result.error || "Update failed"), "error");
        }
    } catch (e) {
        console.error(e);
        showToast("Server connection error!", "error");
    }
}

// =========================================
// 👁️ ŞİFRE GÖSTER / GİZLE
// =========================================
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
// ⬆️ YUKARI ÇIK BUTONU
// =========================================
document.addEventListener("DOMContentLoaded", function() {
    const scrollBtn = document.createElement("button");
    scrollBtn.id = "scrollTopBtn";
    scrollBtn.innerHTML = '<i class="bi bi-arrow-up"></i>';
    scrollBtn.title = "Go to top";
    document.body.appendChild(scrollBtn);

    window.addEventListener("scroll", function() {
        if (window.scrollY > 300) {
            scrollBtn.classList.add("show");
        } else {
            scrollBtn.classList.remove("show");
        }
    });

    scrollBtn.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});

// =========================================
// 📢 AKILLI DUYURU ÇUBUĞU
// =========================================
document.addEventListener("DOMContentLoaded", function() {
    
    // Login sayfasında gizle
    if (window.location.pathname.includes('login.html')) return;

    const bar = document.createElement("div");
    bar.id = "announcement-bar";
    const text = "🔥 SUMMER SALE IS ON! UP TO 50% OFF ON ALL ELECTRONICS! FREE SHIPPING ON ORDERS OVER $2000 🚀";
    bar.innerHTML = `<div class=\"announcement-content\">${text}</div>`;
    document.body.prepend(bar);

    const content = bar.querySelector('.announcement-content');
    const animationDuration = 15;
    let startTime = sessionStorage.getItem('announcementStart');
    
    if (!startTime) {
        startTime = Date.now();
        sessionStorage.setItem('announcementStart', startTime);
    }

    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    const currentOffset = elapsedTime % animationDuration;
    content.style.animationDelay = `-${currentOffset}s`;
});

// =========================================
// 🏠 ADRES YÖNETİMİ (ADDRESS BOOK)
// =========================================

async function loadAddresses() {
    const token = localStorage.getItem('userToken');
    if (!token) return;

    try {
        const res = await fetch(API_ADDRESS, { headers: { 'Authorization': `Token ${token}` } });
        const data = await res.json();
        
        // 1. Profil Sayfası
        const list = document.getElementById('address-list');
        if (list) {
            list.innerHTML = "";
            if (data.length === 0) {
                list.innerHTML = '<div class="text-muted">No saved addresses.</div>';
            } else {
                data.forEach(addr => {
                    list.innerHTML += `
                        <div class="col-md-6 mb-3">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body position-relative">
                                    <h6 class="fw-bold"><i class="bi bi-geo-alt-fill text-primary"></i> ${addr.title}</h6>
                                    <p class="small text-muted mb-1">${addr.full_address}</p>
                                    <p class="small text-muted mb-0">${addr.city} - ${addr.phone}</p>
                                    <button class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 border-0" onclick="deleteAddress(${addr.id})"><i class="bi bi-trash"></i></button>
                                </div>
                            </div>
                        </div>`;
                });
            }
        }

        // 2. Checkout Sayfası (Dropdown)
        const select = document.getElementById('savedAddressSelect');
        if (select) {
            select.innerHTML = '<option value="" selected>-- Select a Saved Address --</option>';
            data.forEach(addr => {
                select.innerHTML += `<option value='${JSON.stringify(addr)}'>${addr.title}</option>`;
            });
        }

    } catch (e) { console.error(e); }
}

async function saveAddress() {
    const token = localStorage.getItem('userToken');
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
            showToast("Address Saved! 🏠", "success");
            loadAddresses();
            const modalEl = document.getElementById('addAddressModal');
            if(modalEl) bootstrap.Modal.getInstance(modalEl).hide();
            document.getElementById('addr-title').value = "";
            document.getElementById('addr-text').value = "";
        }
    } catch (e) { console.error(e); }
}

async function deleteAddress(id) {
    if(!confirm("Are you sure?")) return;
    const token = localStorage.getItem('userToken');
    try {
        await fetch(`${API_ADDRESS}?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Token ${token}` } });
        showToast("Address Deleted", "error");
        loadAddresses();
    } catch (e) { console.error(e); }
}

function fillCheckoutForm(selectElement) {
    const val = selectElement.value;
    if (!val) return;
    const addr = JSON.parse(val);
    
    document.getElementById('address').value = addr.full_address + ", " + addr.city;
    document.getElementById('phone').value = addr.phone;
    showToast("Address loaded: " + addr.title, "success");
}

function increaseQty() {
    const input = document.getElementById('product-qty');
    if(input) input.value = parseInt(input.value) + 1;
}

function decreaseQty() {
    const input = document.getElementById('product-qty');
    if(input && input.value > 1) input.value = parseInt(input.value) - 1;
}

// =========================================
// 🔥 YENİ KARŞILAŞTIRMA SİSTEMİ (RESET BUTONLU) 🔥
// =========================================
let compareList = [];

// 1. Listeye Ekle/Çıkar
function toggleCompare(id) {
    const product = allProducts.find(p => p.id === id); 
    if (!product) return;

    // Zaten listede mi?
    const exists = compareList.find(p => p.id === id);

    if (exists) {
        compareList = compareList.filter(p => p.id !== id);
        showToast("Removed from comparison 📉", "error");
    } else {
        // Kural 1: Maksimum 3 ürün
        if (compareList.length >= 3) {
            showToast("You can compare max 3 items! ⚠️", "error");
            return;
        }

        // Kural 2: Aynı kategori zorunluluğu
        if (compareList.length > 0 && compareList[0].category != product.category) {
            showToast(`Can't compare different categories! 🚫`, "error");
            return;
        }

        compareList.push(product);
        showToast("Added to comparison 📊", "success");
    }

    updateCompareUI();
}

// 2. Butonları Göster/Gizle (GÜNCELLENDİ)
function updateCompareUI() {
    const container = document.getElementById('compare-floating-container');
    const countSpan = document.getElementById('compare-count');
    
    if (countSpan) countSpan.innerText = compareList.length;

    if (container) {
        // Liste boşsa kutuyu gizle, doluysa göster
        if (compareList.length > 0) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }
}

// 3. Listeyi Sıfırla (YENİ FONKSİYON)
function resetComparison() {
    compareList = []; // Listeyi boşalt
    updateCompareUI(); // Ekranı güncelle (buton kaybolacak)
    showToast("Comparison list cleared! 🗑️", "info");
}

// 4. Modalı Aç ve Tabloyu Çiz
function openCompareModal() {
    const header = document.getElementById('compare-header');
    const body = document.getElementById('compare-body');
    const modalEl = document.getElementById('compareModal');
    
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);

    if (compareList.length < 2) {
        showToast("Select at least 2 items to compare! ⚠️", "error");
        return;
    }

    // Tablo Başlıkları
    let headerHTML = '<tr><th class="p-3 bg-light">Feature</th>';
    compareList.forEach(p => {
        let img = p.image ? (p.image.startsWith('http') ? p.image : BASE_URL + p.image) : 'https://via.placeholder.com/100';
        headerHTML += `
            <th class="p-3" style="width: ${90 / compareList.length}%">
                <img src="${img}" style="height:80px; object-fit:contain;" class="d-block mx-auto mb-2">
                <div class="fw-bold small">${p.name}</div>
            </th>
        `;
    });
    headerHTML += '</tr>';
    header.innerHTML = headerHTML;

    // Tablo İçeriği
    const rows = [
        { label: 'Price', key: 'price', format: (v) => `<span class="fw-bold text-primary">$${v}</span>` },
        { label: 'Category', key: 'category', format: (v) => `<span class="badge bg-secondary">Cat ID: ${v}</span>` },
        { label: 'Stock', key: 'stock', format: (v) => v > 0 ? '<span class="text-success fw-bold">In Stock</span>' : '<span class="text-danger fw-bold">Out of Stock</span>' },
        { label: 'Description', key: 'description', format: (v) => `<small class="text-muted">${v.substring(0,50)}...</small>` }
    ];

    let bodyHTML = '';
    rows.forEach(row => {
        bodyHTML += `<tr><td class="fw-bold bg-light">${row.label}</td>`;
        compareList.forEach(p => {
            let val = p[row.key];
            if (row.format) val = row.format(val);
            bodyHTML += `<td>${val}</td>`;
        });
        bodyHTML += `</tr>`;
    });

    body.innerHTML = bodyHTML;
    modal.show();
}