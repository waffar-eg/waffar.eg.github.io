/* =========================================================
   وفّر - الكود الأساسي للموقع
   (الموقع ده Front-End بس وبيحفظ البيانات في localStorage
    للتجربة والمشاريع. للموقع الحقيقي لازم Backend وقاعدة بيانات)
   ========================================================= */

/* ---------- أدوات مساعدة ---------- */
const $  = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const KEYS = {
  users: "wafar_users",
  products: "wafar_products",
  session: "wafar_session",
  orders: "wafar_orders",
  seeded: "wafar_seeded_v4"
};

const LS = {
  get(k, def) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch { toast("مساحة التخزين امتلأت، جرّب صورة أصغر", "error"); return false; }
  },
  remove(k) { try { localStorage.removeItem(k); } catch {} }
};

// تشفير بسيط للباسورد (للتجربة فقط)
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return "h" + h.toString(16) + str.length;
}

const uid = (p = "id") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const money = n => Number(n).toLocaleString("ar-EG", { maximumFractionDigits: 2 }) + " ج.م";
const qs = name => new URLSearchParams(location.search).get(name);

function toast(msg, type = "success") {
  let box = $("#toast-box");
  if (!box) { box = document.createElement("div"); box.id = "toast-box"; document.body.appendChild(box); }
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.classList.add("hide"), 2600);
  setTimeout(() => t.remove(), 3000);
}

/* ---------- ⏰ عروض آخر اليوم ---------- */
// تاريخ بعد عدد أيام من النهاردة بصيغة YYYY-MM-DD
function dateAfter(days) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
// باقي كام يوم على انتهاء الصلاحية (0 = النهاردة آخر يوم / سالب = خلصت)
function daysLeft(p) {
  if (!p.expiry) return null;
  const [y, m, d] = p.expiry.split("-").map(Number);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(y, m - 1, d) - today) / 86400000);
}
const isExpired   = p => p.expiry && daysLeft(p) < 0;
const isClearance = p => p.extraDiscount > 0 && p.expiry && daysLeft(p) >= 0 && p.stock > 0;
// السعر النهائي بعد خصم آخر اليوم
const finalPrice  = p => isClearance(p) ? Math.round(p.price * (1 - p.extraDiscount / 100) * 10) / 10 : p.price;
// السعر قبل أي خصم (عشان يتشطب عليه)
const basePrice   = p => Math.max(p.oldPrice || 0, p.price);
function expiryText(p) {
  const n = daysLeft(p);
  if (n === 0) return "آخر يوم النهاردة";
  if (n === 1) return "باقي يوم واحد";
  if (n === 2) return "باقي يومين";
  return `باقي ${n} أيام`;
}
// تاريخ الصلاحية بالعربي (مثال: 15 أكتوبر)
function expiryDate(p) {
  const [y, m, d] = p.expiry.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
}
// عداد لحد آخر اليوم (12 بالليل)
function startCountdown(el) {
  if (!el) return;
  const tick = () => {
    const now = new Date(), end = new Date(); end.setHours(24, 0, 0, 0);
    const s = Math.floor((end - now) / 1000);
    el.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, "0")).join(":");
  };
  tick(); setInterval(tick, 1000);
}
// بيرسم سكشن عروض آخر اليوم جوه أي صفحة فيها id="clearance-section"
function renderClearance() {
  const sec = $("#clearance-section");
  if (!sec) return;
  let list = getProducts()
    .filter(p => isClearance(p) && getVendor(p.vendorId) && inMyGov(p))
    .sort((a, b) => daysLeft(a) - daysLeft(b) || b.extraDiscount - a.extraDiscount);
  if (!buyerGov()) list = uniqueByName(list).slice(0, 8);
  sec.hidden = !list.length;
  if (!list.length) return;
  const grid = $("#clearance-grid");
  grid.innerHTML = list.map(productCardHTML).join("");
  if (!grid.dataset.bound) { bindProductGrid(grid); grid.dataset.bound = 1; }
  $("#clearance-count").textContent = list.length;
  startCountdown($("#clearance-timer"));
}

/* ---------- البيانات ---------- */
function seed() {
  if (LS.get(KEYS.seeded)) return;
  const users = SEED_VENDORS.map(v => ({ ...v, role: "vendor", password: hash("123456"), createdAt: Date.now() }));
  // كل منفذ عنده المنتجات الأساسية + مجموعة منتجات تانية بتختلف من منفذ للتاني
  const core = CATALOG.filter(p => p.core), rest = CATALOG.filter(p => !p.core);
  const products = [];
  SEED_VENDORS.forEach((v, vi) => {
    const items = [...core, ...Array.from({ length: 12 }, (_, t) => rest[(vi * 12 + t) % rest.length])];
    // منتجين من اللي بيبوظوا عليهم عرض آخر اليوم في كل منفذ
    const fresh = items.filter(p => PERISHABLE.includes(p.category));
    const clr = [fresh[vi % fresh.length], fresh[(vi + 5) % fresh.length]];
    items.forEach((c, k) => {
      const ci = clr.indexOf(c);
      products.push({
        id: "p" + (products.length + 1), name: c.name, size: c.size, category: c.category,
        price: c.price, oldPrice: (vi + k) % 3 === 0 ? Math.round(c.price * (1.1 + ((vi * k) % 3) * 0.05)) : 0,
        unit: c.unit, stock: 10 + ((vi * 37 + k * 53) % 240), vendorId: v.id, emoji: c.emoji, img: c.img,
        extraDiscount: ci >= 0 ? [20, 25, 30, 35, 40][(vi + ci) % 5] : 0,
        expiry: ci >= 0 ? dateAfter((vi + ci) % 3) : ""
      });
    });
  });
  LS.set(KEYS.users, users);
  LS.set(KEYS.products, products);
  LS.set(KEYS.orders, []);
  LS.set(KEYS.seeded, true);
}

const getUsers    = () => LS.get(KEYS.users, []);
const saveUsers   = u => LS.set(KEYS.users, u);
const getProducts = () => LS.get(KEYS.products, []);
const saveProducts= p => LS.set(KEYS.products, p);
const getOrders   = () => LS.get(KEYS.orders, []);
const saveOrders  = o => LS.set(KEYS.orders, o);
const getVendor   = id => getUsers().find(u => u.id === id && u.role === "vendor");
const catName     = id => (CATEGORIES.find(c => c.id === id) || {}).name || "";
// محافظة المشتري اللي داخل (null لو مش مشتري)
const buyerGov    = () => { const u = currentUser(); return u && u.role === "buyer" ? u.governorate : null; };
// المنتج ده من منفذ في محافظة المشتري؟
const inMyGov     = p => { const g = buyerGov(), v = getVendor(p.vendorId); return !g || (v && v.governorate === g); };
// منتج واحد من كل نوع (للزوار اللي مش داخلين)
const uniqueByName = list => { const seen = new Set(); return list.filter(p => { const k = p.name + p.size; if (seen.has(k)) return false; seen.add(k); return true; }); };

function currentUser() {
  const id = LS.get(KEYS.session, null);
  if (!id) return null;
  return getUsers().find(u => u.id === id) || null;
}
function logout() {
  LS.remove(KEYS.session);
  location.href = "index.html";
}
function requireRole(role) {
  const u = currentUser();
  if (!u) { location.href = "login.html?next=" + encodeURIComponent(location.pathname.split("/").pop()); return null; }
  if (u.role !== role) { location.href = u.role === "vendor" ? "vendor.html" : "shop.html"; return null; }
  return u;
}

/* ---------- السلة ---------- */
const cartKey = () => { const u = currentUser(); return u ? "wafar_cart_" + u.id : null; };
const getCart = () => cartKey() ? LS.get(cartKey(), []) : [];
const saveCart = c => { if (cartKey()) LS.set(cartKey(), c); updateCartBadge(); };

function addToCart(productId, qty = 1) {
  const u = currentUser();
  if (!u) { toast("سجّل دخول كمشتري الأول", "error"); setTimeout(() => location.href = "login.html", 900); return; }
  if (u.role !== "buyer") { toast("الإضافة للسلة للمشترين بس", "error"); return; }
  const p = getProducts().find(x => x.id === productId);
  if (!p) return;
  if (isExpired(p)) { toast("المنتج ده صلاحيته خلصت", "error"); return; }
  const v = getVendor(p.vendorId);
  if (v && v.governorate !== u.governorate) {
    toast(`مينفعش تطلب من ${v.name} لأنه في ${v.governorate}. تقدر تطلب من منافذ ${u.governorate} بس`, "error");
    return;
  }
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  const newQty = (item ? item.qty : 0) + qty;
  if (newQty > p.stock) { toast(`الكمية المتاحة ${p.stock} ${p.unit} بس`, "error"); return; }
  if (item) item.qty = newQty; else cart.push({ productId, qty });
  saveCart(cart);
  toast(`اتضاف ${p.name} للسلة ✓`);
}

function cartDetails() {
  const products = getProducts();
  const items = getCart()
    .map(i => ({ ...i, product: products.find(p => p.id === i.productId) }))
    .filter(i => i.product);
  const subtotal = items.reduce((a, i) => a + finalPrice(i.product) * i.qty, 0);
  const savings  = items.reduce((a, i) => a + Math.max(0, basePrice(i.product) - finalPrice(i.product)) * i.qty, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  return { items, subtotal, savings, delivery, total: subtotal + delivery };
}

function updateCartBadge() {
  const b = $("#cart-count");
  if (b) {
    const n = getCart().reduce((a, i) => a + i.qty, 0);
    b.textContent = n;
    b.style.display = n ? "inline-flex" : "none";
  }
}

/* ---------- صور المنتجات ---------- */
function productImgSrc(p) {
  if (p.img) return p.img;
  if (p.photo) return pexels(p.photo);
  return "";
}
function productImgHTML(p) {
  const src = productImgSrc(p);
  return `<div class="pimg"><span class="pemoji">${p.emoji || "🛒"}</span>
    ${src ? `<img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()">` : ""}</div>`;
}

/* ---------- كارت المنتج ---------- */
function productCardHTML(p) {
  const v = getVendor(p.vendorId);
  const clr = isClearance(p);
  const price = finalPrice(p), base = basePrice(p);
  const off = base > price ? Math.round((1 - price / base) * 100) : 0;
  const expired = isExpired(p);
  const out = p.stock <= 0 || expired;
  const far = !inMyGov(p);
  return `
  <article class="pcard ${out ? "out" : ""} ${clr ? "clr" : ""}">
    ${off ? `<span class="badge-off">وفّر ${off}%</span>` : ""}
    ${clr ? `<span class="badge-clr">⏰ خصم إضافي ${p.extraDiscount}%</span>` : ""}
    ${productImgHTML(p)}
    <div class="pbody">
      <span class="pcat">${esc(catName(p.category))}</span>
      <h3>${esc(p.name)}</h3>
      ${p.size ? `<span class="psize">${esc(p.size)}</span>` : ""}
      <p class="pvendor">🏪 ${esc(v ? v.name : "منفذ")} <small>📍 ${esc(v ? v.governorate : "")}</small></p>
      ${clr ? `<p class="expiry">🕒 ${expiryText(p)} <small>(صلاحية لحد ${expiryDate(p)})</small></p>` : ""}
      <div class="pprice">
        <strong>${money(price)}</strong><span>/ ${esc(p.unit)}</span>
        ${off ? `<del>${money(base)}</del>` : ""}
      </div>
      <div class="pactions">
        <div class="stepper">
          <button type="button" data-step="1" aria-label="زيادة">+</button>
          <input type="number" min="1" max="${p.stock}" value="1" aria-label="الكمية">
          <button type="button" data-step="-1" aria-label="نقص">−</button>
        </div>
        <button class="btn ${far ? "btn-far" : "btn-primary"} add-cart" data-id="${p.id}" ${out ? "disabled" : ""}>
          ${expired ? "انتهت الصلاحية" : out ? "نفدت الكمية" : far ? "🚫 خارج محافظتك" : "🛒 أضف للسلة"}
        </button>
      </div>
    </div>
  </article>`;
}

// تفعيل أزرار الكارت (event delegation)
function bindProductGrid(grid) {
  grid.addEventListener("click", e => {
    const step = e.target.closest("[data-step]");
    if (step) {
      const input = step.parentElement.querySelector("input");
      const v = Math.max(1, Math.min(+input.max || 999, (+input.value || 1) + +step.dataset.step));
      input.value = v;
      return;
    }
    const add = e.target.closest(".add-cart");
    if (add) {
      const qty = Math.max(1, parseInt(add.closest(".pcard").querySelector(".stepper input").value) || 1);
      addToCart(add.dataset.id, qty);
    }
  });
}

/* ---------- الهيدر والفوتر ---------- */
function renderHeader() {
  const el = $("#site-header");
  if (!el) return;
  const u = currentUser();
  const page = document.body.dataset.page;
  const a = (href, label, key) => `<a href="${href}" class="${page === key ? "active" : ""}">${label}</a>`;
  let links = "";
  if (!u) {
    links = a("index.html", "الرئيسية", "home") +
            a("login.html", "تسجيل الدخول", "login") +
            `<a href="register.html" class="btn btn-gold btn-sm">حساب جديد</a>`;
  } else if (u.role === "buyer") {
    links = a("shop.html", "المتجر", "shop") +
            a("orders.html", "طلباتي", "orders") +
            `<a href="cart.html" class="cart-link ${page === "cart" ? "active" : ""}">🛒 السلة <span id="cart-count" class="count">0</span></a>` +
            `<span class="hello">أهلاً، ${esc(u.name.split(" ")[0])}</span>` +
            `<button class="btn btn-outline btn-sm" id="logout-btn">خروج</button>`;
  } else {
    links = a("vendor.html", "لوحة المنفذ", "vendor") +
            `<span class="hello">🏪 ${esc(u.name)}</span>` +
            `<button class="btn btn-outline btn-sm" id="logout-btn">خروج</button>`;
  }
  el.innerHTML = `
    <div class="topbar">🚚 بتطلب من منافذ محافظتك ونوصلك لحد البيت &nbsp;•&nbsp; 🏷️ أسعار المنافذ الرسمية &nbsp;•&nbsp; 💵 ادفع كاش عند الاستلام</div>
    <nav class="nav container">
      <a class="logo" href="${u ? (u.role === "vendor" ? "vendor.html" : "shop.html") : "index.html"}">
        <span class="logo-mark">و</span>
        <span class="logo-text">وفّر<small>سوق منافذ مصر</small></span>
      </a>
      <button class="menu-toggle" aria-label="القائمة">☰</button>
      <div class="nav-links">${links}</div>
    </nav>`;
  $(".menu-toggle", el).onclick = () => $(".nav-links", el).classList.toggle("open");
  const lo = $("#logout-btn");
  if (lo) lo.onclick = logout;
  updateCartBadge();
}

function renderFooter() {
  const el = $("#site-footer");
  if (!el) return;
  el.innerHTML = `
  <div class="container footer-grid">
    <div>
      <a class="logo" href="index.html"><span class="logo-mark">و</span><span class="logo-text">وفّر<small>سوق منافذ مصر</small></span></a>
      <p>وفّر بيجمعلك منتجات منافذ القوات المسلحة في مكان واحد.. خضار، فاكهة، لحوم، فراخ وكل طلبات البيت بأسعار المنافذ.</p>
    </div>
    <div><h4>الأقسام</h4>${CATEGORIES.map(c => `<a href="shop.html?cat=${c.id}">${c.emoji} ${c.name}</a>`).join("")}</div>
    <div><h4>روابط</h4><a href="register.html?role=buyer">سجّل كمشتري</a><a href="register.html?role=vendor">سجّل منفذك</a><a href="login.html">تسجيل الدخول</a></div>
    <div><h4>تواصل معانا</h4><p>📞 19XXX</p><p>✉️ support@wafar.eg</p><p>🕘 يومياً من 9 ص لـ 11 م</p></div>
  </div>
  <div class="copy">© ${new Date().getFullYear()} وفّر - كل الحقوق محفوظة</div>`;
}

/* =========================================================
   الصفحات
   ========================================================= */

/* ---------- الرئيسية ---------- */
function initHome() {
  // السلايدر
  const slides = $$(".slide");
  slides.forEach((s, i) => { $(".slide-bg", s).style.backgroundImage = `url('${pexels(BANNER_PHOTOS[i], 1600)}')`; });
  const dots = $("#slider-dots");
  let cur = 0, timer;
  slides.forEach((_, i) => {
    const d = document.createElement("button");
    d.setAttribute("aria-label", "بانر " + (i + 1));
    d.onclick = () => { go(i); restart(); };
    dots.appendChild(d);
  });
  function go(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === cur));
    $$("button", dots).forEach((d, k) => d.classList.toggle("active", k === cur));
  }
  const restart = () => { clearInterval(timer); timer = setInterval(() => go(cur + 1), 5000); };
  $("#slide-prev").onclick = () => { go(cur - 1); restart(); };
  $("#slide-next").onclick = () => { go(cur + 1); restart(); };
  go(0); restart();

  // الأقسام بالصور
  $("#home-cats").innerHTML = CATEGORIES.map(c => `
    <a class="cat-card" href="${currentUser() ? "shop.html?cat=" + c.id : "#start"}">
      <div class="pimg"><span class="pemoji">${c.emoji}</span>
      <img src="${pexels(c.photo, 500)}" alt="${c.name}" loading="lazy" onerror="this.remove()"></div>
      <span>${c.emoji} ${c.name}</span>
    </a>`).join("");

  // عروض اليوم (أكبر خصم)
  const deals = getProducts()
    .filter(p => p.stock > 0 && !isClearance(p) && !isExpired(p) && p.oldPrice > p.price && inMyGov(p))
    .sort((a, b) => (1 - b.price / b.oldPrice) - (1 - a.price / a.oldPrice));
  const homeDeals = uniqueByName(deals).slice(0, 8);
  renderClearance();
  const grid = $("#home-deals");
  grid.innerHTML = homeDeals.map(productCardHTML).join("");
  bindProductGrid(grid);

  $("#stat-vendors").textContent = getUsers().filter(u => u.role === "vendor").length;
  $("#stat-products").textContent = CATALOG.length;
}

/* ---------- التسجيل ---------- */
function fillGovernorates(select, selected = "") {
  select.innerHTML = `<option value="">اختار المحافظة</option>` +
    GOVERNORATES.map(g => `<option ${g === selected ? "selected" : ""}>${g}</option>`).join("");
}

function validNationalId(id) {
  if (!/^[23]\d{13}$/.test(id)) return false;
  const m = +id.slice(3, 5), d = +id.slice(5, 7);
  return m >= 1 && m <= 12 && d >= 1 && d <= 31;
}
const validPhone = p => /^01[0125]\d{8}$/.test(p);
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

function setError(input, msg) {
  const field = input.closest(".field");
  let err = $(".err", field);
  if (!err) { err = document.createElement("small"); err.className = "err"; field.appendChild(err); }
  err.textContent = msg || "";
  field.classList.toggle("invalid", !!msg);
  return !msg;
}

function initRegister() {
  if (currentUser()) { location.href = currentUser().role === "vendor" ? "vendor.html" : "shop.html"; return; }
  let role = qs("role") === "vendor" ? "vendor" : "buyer";
  const form = $("#register-form");
  fillGovernorates($("#r-gov"));

  function setRole(r) {
    role = r;
    $$(".role-tab").forEach(t => t.classList.toggle("active", t.dataset.role === r));
    $$("[data-only]").forEach(el => {
      const show = el.dataset.only === r;
      el.hidden = !show;
      $$("input,select,textarea", el).forEach(i => i.disabled = !show);
    });
    $("#reg-title").textContent = r === "vendor" ? "سجّل منفذك على وفّر" : "اعمل حساب مشتري";
    $("#reg-sub").textContent = r === "vendor"
      ? "اعرض منتجات منفذك لآلاف المشترين في كل محافظات مصر"
      : "اشتري احتياجات بيتك من منافذ القوات المسلحة في محافظتك بأسعار المنافذ";
    $("#gov-label").textContent = r === "vendor" ? "محافظة المنفذ" : "محافظتك";
    history.replaceState(null, "", "?role=" + r);
  }
  $$(".role-tab").forEach(t => t.onclick = () => setRole(t.dataset.role));
  setRole(role);

  $$(".toggle-pass").forEach(b => b.onclick = () => {
    const i = b.previousElementSibling; i.type = i.type === "password" ? "text" : "password";
    b.textContent = i.type === "password" ? "👁" : "🙈";
  });

  form.onsubmit = e => {
    e.preventDefault();
    const f = id => $("#" + id);
    const users = getUsers();
    const email = f("r-email").value.trim().toLowerCase();
    let ok = true;

    ok &= setError(f("r-name"), f("r-name").value.trim().length < 3 ? "اكتب الاسم بالكامل" : "");
    ok &= setError(f("r-email"), !validEmail(email) ? "الإيميل مش صحيح"
      : users.some(u => u.email === email) ? "الإيميل ده متسجل قبل كده" : "");
    ok &= setError(f("r-pass"), f("r-pass").value.length < 6 ? "الباسورد لازم 6 حروف أو أرقام على الأقل" : "");
    ok &= setError(f("r-pass2"), f("r-pass2").value !== f("r-pass").value ? "الباسورد مش متطابق" : "");
    ok &= setError(f("r-gov"), !f("r-gov").value ? "اختار المحافظة" : "");

    if (role === "vendor") {
      const phone = f("r-phone").value.trim(), nid = f("r-nid").value.trim();
      ok &= setError(f("r-store"), f("r-store").value.trim().length < 3 ? "اكتب اسم المنفذ" : "");
      ok &= setError(f("r-phone"), !validPhone(phone) ? "رقم الموبايل لازم 11 رقم ويبدأ بـ 010 / 011 / 012 / 015" : "");
      ok &= setError(f("r-nid"), !validNationalId(nid) ? "الرقم القومي لازم 14 رقم صحيح" :
        users.some(u => u.nationalId === nid) ? "الرقم القومي ده متسجل قبل كده" : "");
      ok &= setError(f("r-address"), f("r-address").value.trim().length < 5 ? "اكتب عنوان المنفذ بالتفصيل" : "");
    }
    if (!ok) { toast("راجع البيانات المكتوبة باللون الأحمر", "error"); return; }

    const user = {
      id: uid("u"), role,
      email, password: hash(f("r-pass").value),
      governorate: f("r-gov").value,
      createdAt: Date.now()
    };
    if (role === "vendor") {
      user.ownerName = f("r-name").value.trim();
      user.name = f("r-store").value.trim();
      user.phone = f("r-phone").value.trim();
      user.nationalId = f("r-nid").value.trim();
      user.address = f("r-address").value.trim();
    } else {
      user.name = f("r-name").value.trim();
    }
    users.push(user);
    if (!saveUsers(users)) return;
    toast("تم إنشاء الحساب بنجاح 🎉 سجّل دخولك دلوقتي");
    setTimeout(() => location.href = "login.html?email=" + encodeURIComponent(email), 1000);
  };

  $$("#register-form input, #register-form select").forEach(i =>
    i.addEventListener("input", () => setError(i, "")));
}

/* ---------- تسجيل الدخول ---------- */
function initLogin() {
  if (currentUser()) { location.href = currentUser().role === "vendor" ? "vendor.html" : "shop.html"; return; }
  const em = qs("email");
  if (em) { $("#l-email").value = em; $("#l-pass").focus(); }
  $(".toggle-pass").onclick = function () {
    const i = this.previousElementSibling; i.type = i.type === "password" ? "text" : "password";
    this.textContent = i.type === "password" ? "👁" : "🙈";
  };
  $$(".demo-fill").forEach(b => b.onclick = () => {
    $("#l-email").value = b.dataset.email; $("#l-pass").value = "123456";
  });
  $("#login-form").onsubmit = e => {
    e.preventDefault();
    const email = $("#l-email").value.trim().toLowerCase();
    const pass = $("#l-pass").value;
    const user = getUsers().find(u => u.email === email && u.password === hash(pass));
    if (!user) { $("#login-error").textContent = "الإيميل أو الباسورد غلط"; return; }
    LS.set(KEYS.session, user.id);
    toast("أهلاً بيك في وفّر 👋");
    const next = qs("next");
    const dest = user.role === "vendor" ? "vendor.html"
      : (next && !/vendor|login|register/.test(next) ? next : "shop.html");
    setTimeout(() => location.href = dest, 500);
  };
}

/* ---------- المتجر (المشتري) ---------- */
function initShop() {
  const user = requireRole("buyer");
  if (!user) return;
  $("#shop-hello").textContent = `أهلاً ${user.name.split(" ")[0]} 👋`;
  $("#shop-gov").textContent = user.governorate;

  const state = { q: "", cat: qs("cat") || "all", vendor: "all", sort: "near", mine: true };
  $("#f-mine").checked = true;
  const vendors = getUsers().filter(u => u.role === "vendor");

  // الأقسام
  $("#cat-chips").innerHTML =
    `<button class="chip" data-cat="all">🛍️ الكل</button>` +
    `<button class="chip chip-clr" data-cat="clearance">⏰ عروض آخر اليوم</button>` +
    CATEGORIES.map(c => `<button class="chip" data-cat="${c.id}">${c.emoji} ${c.name}</button>`).join("");
  $("#cat-chips").onclick = e => {
    const c = e.target.closest(".chip"); if (!c) return;
    state.cat = c.dataset.cat; render();
  };

  // المنافذ
  $("#f-vendor").innerHTML = `<option value="all">كل المنافذ</option>` +
    vendors.map(v => `<option value="${v.id}">${esc(v.name)} - ${esc(v.governorate)}</option>`).join("");

  $("#f-search").oninput = e => { state.q = e.target.value.trim(); render(); };
  $("#f-vendor").onchange = e => { state.vendor = e.target.value; render(); };
  $("#f-sort").onchange = e => { state.sort = e.target.value; render(); };
  $("#f-mine").onchange = e => { state.mine = e.target.checked; render(); };

  const grid = $("#shop-grid");
  bindProductGrid(grid);
  renderClearance();

  function render() {
    $$(".chip", $("#cat-chips")).forEach(c => c.classList.toggle("active", c.dataset.cat === state.cat));
    let list = getProducts().filter(p => {
      const v = getVendor(p.vendorId);
      if (!v) return false;
      if (state.cat === "clearance") { if (!isClearance(p)) return false; }
      else if (state.cat !== "all" && p.category !== state.cat) return false;
      if (state.vendor !== "all" && p.vendorId !== state.vendor) return false;
      if (state.mine && v.governorate !== user.governorate) return false;
      if (state.q && !(p.name + " " + (p.size || "") + " " + v.name + " " + catName(p.category)).includes(state.q)) return false;
      return true;
    });
    const near = p => (getVendor(p.vendorId).governorate === user.governorate ? 0 : 1);
    const disc = p => p.oldPrice ? 1 - p.price / p.oldPrice : 0;
    const sorters = {
      near: (a, b) => near(a) - near(b) || (b.stock > 0) - (a.stock > 0),
      low: (a, b) => a.price - b.price,
      high: (a, b) => b.price - a.price,
      deal: (a, b) => disc(b) - disc(a)
    };
    list.sort(sorters[state.sort]);
    $("#result-count").textContent = `${list.length} منتج`;
    grid.innerHTML = list.length ? list.map(productCardHTML).join("")
      : `<div class="empty"><span>🔍</span><p>مفيش منتجات مطابقة للبحث</p></div>`;
  }
  render();
}

/* ---------- السلة ---------- */
function initCart() {
  if (!requireRole("buyer")) return;
  const wrap = $("#cart-items");

  function render() {
    const c = cartDetails();
    if (!c.items.length) {
      $("#cart-layout").innerHTML = `<div class="empty big"><span>🛒</span><h3>السلة فاضية</h3>
        <p>ابدأ اختار منتجاتك من المنافذ</p><a href="shop.html" class="btn btn-primary">روح للمتجر</a></div>`;
      return;
    }
    wrap.innerHTML = c.items.map(({ product: p, qty }) => {
      const v = getVendor(p.vendorId);
      return `
      <div class="cart-row" data-id="${p.id}">
        ${productImgHTML(p)}
        <div class="cart-info">
          <h4>${esc(p.name)} ${p.size ? `<small style="display:inline">${esc(p.size)}</small>` : ""}</h4>
          <small>🏪 ${esc(v ? v.name : "")} - ${esc(v ? v.governorate : "")}</small>
          ${!inMyGov(p) ? `<small class="mini-exp">⚠️ المنفذ ده مش في محافظتك، شيله من السلة</small>` : ""}
          <span class="unit-price">${money(finalPrice(p))} / ${esc(p.unit)} ${isClearance(p) ? `<em class="mini-clr">⏰ -${p.extraDiscount}%</em>` : ""}</span>
        </div>
        <div class="stepper">
          <button data-act="inc">+</button>
          <input type="number" value="${qty}" min="1" max="${p.stock}" data-act="set">
          <button data-act="dec">−</button>
        </div>
        <strong class="row-total">${money(finalPrice(p) * qty)}</strong>
        <button class="icon-btn" data-act="del" title="حذف">🗑</button>
      </div>`;
    }).join("");
    $("#s-sub").textContent = money(c.subtotal);
    $("#s-save").textContent = money(c.savings);
    $("#s-del").textContent = c.delivery ? money(c.delivery) : "مجاناً 🎉";
    $("#s-total").textContent = money(c.total);
    const left = FREE_DELIVERY_FROM - c.subtotal;
    $("#free-note").textContent = left > 0 ? `اشتري بـ ${money(left)} كمان والتوصيل يبقى مجاناً` : "مبروك! التوصيل مجاني 🚚";
  }

  function change(id, fn) {
    const cart = getCart();
    const item = cart.find(i => i.productId === id);
    const p = getProducts().find(x => x.id === id);
    if (!item || !p) return;
    const q = fn(item.qty);
    if (q > p.stock) { toast(`المتاح ${p.stock} ${p.unit} بس`, "error"); item.qty = p.stock; }
    else item.qty = Math.max(1, q);
    saveCart(cart); render();
  }

  wrap.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b || b.tagName === "INPUT") return;
    const id = b.closest(".cart-row").dataset.id;
    if (b.dataset.act === "inc") change(id, q => q + 1);
    if (b.dataset.act === "dec") change(id, q => q - 1);
    if (b.dataset.act === "del") { saveCart(getCart().filter(i => i.productId !== id)); toast("اتشال من السلة"); render(); }
  });
  wrap.addEventListener("change", e => {
    if (e.target.dataset.act === "set")
      change(e.target.closest(".cart-row").dataset.id, () => parseInt(e.target.value) || 1);
  });
  $("#clear-cart").onclick = () => { saveCart([]); render(); };
  render();
}

/* ---------- الدفع ---------- */
function initCheckout() {
  const user = requireRole("buyer");
  if (!user) return;
  const c = cartDetails();
  if (!c.items.length) { location.href = "cart.html"; return; }

  $("#c-name").value = user.name;
  fillGovernorates($("#c-gov"), user.governorate);
  $("#c-gov").disabled = true;   // التوصيل لمحافظة المشتري بس

  $("#co-items").innerHTML = c.items.map(({ product: p, qty }) =>
    `<li><span>${esc(p.name)} ${esc(p.size || "")} × ${qty}</span><b>${money(finalPrice(p) * qty)}</b></li>`).join("");
  $("#co-sub").textContent = money(c.subtotal);
  $("#co-save").textContent = money(c.savings);
  $("#co-del").textContent = c.delivery ? money(c.delivery) : "مجاناً";
  $("#co-total").textContent = money(c.total);

  $$("input[name=pay]").forEach(r => r.onchange = () =>
    $$(".pay-option").forEach(o => o.classList.toggle("active", $("input", o).checked)));

  $("#checkout-form").onsubmit = e => {
    e.preventDefault();
    const f = id => $("#" + id);
    let ok = true;
    ok &= setError(f("c-name"), f("c-name").value.trim().length < 3 ? "اكتب الاسم" : "");
    ok &= setError(f("c-phone"), !validPhone(f("c-phone").value.trim()) ? "رقم موبايل مصري صحيح (11 رقم)" : "");
    ok &= setError(f("c-gov"), !f("c-gov").value ? "اختار المحافظة" : "");
    ok &= setError(f("c-city"), f("c-city").value.trim().length < 2 ? "اكتب المدينة / المنطقة" : "");
    ok &= setError(f("c-address"), f("c-address").value.trim().length < 5 ? "اكتب العنوان بالتفصيل" : "");
    if (!ok) { toast("كمّل بيانات التوصيل", "error"); return; }

    // التأكد إن كل المنتجات من منافذ محافظة المشتري
    const fresh = cartDetails();
    const far = fresh.items.find(({ product }) => !inMyGov(product));
    if (far) { toast(`${far.product.name} من منفذ برّه ${user.governorate}، شيله من السلة الأول`, "error"); return; }
    // التأكد من المخزون وخصمه
    const products = getProducts();
    for (const { product, qty } of fresh.items) {
      const p = products.find(x => x.id === product.id);
      if (!p || p.stock < qty) { toast(`الكمية المتاحة من ${product.name} مش كفاية`, "error"); return; }
    }
    fresh.items.forEach(({ product, qty }) => { products.find(x => x.id === product.id).stock -= qty; });
    saveProducts(products);

    const order = {
      id: "WF-" + Date.now().toString().slice(-7),
      buyerId: user.id,
      buyerName: f("c-name").value.trim(),
      phone: f("c-phone").value.trim(),
      governorate: user.governorate,
      city: f("c-city").value.trim(),
      address: f("c-address").value.trim(),
      notes: f("c-notes").value.trim(),
      payment: $("input[name=pay]:checked").value,
      items: fresh.items.map(({ product: p, qty }) => ({
        productId: p.id, name: p.name + (p.size ? " " + p.size : ""), price: finalPrice(p), unit: p.unit, qty, vendorId: p.vendorId
      })),
      subtotal: fresh.subtotal, delivery: fresh.delivery, total: fresh.total, savings: fresh.savings,
      status: "جاري التجهيز",
      date: Date.now()
    };
    const orders = getOrders(); orders.unshift(order); saveOrders(orders);
    saveCart([]);

    $("#success-id").textContent = order.id;
    $("#success-total").textContent = money(order.total);
    $("#success-modal").classList.add("show");
  };
}

/* ---------- طلباتي ---------- */
function initOrders() {
  const user = requireRole("buyer");
  if (!user) return;
  const orders = getOrders().filter(o => o.buyerId === user.id);
  $("#orders-list").innerHTML = orders.length ? orders.map(o => `
    <div class="order-card">
      <div class="order-head">
        <div><b>طلب رقم ${o.id}</b><small>${new Date(o.date).toLocaleString("ar-EG")}</small></div>
        <span class="status">${o.status}</span>
      </div>
      <ul>${o.items.map(i => `<li><span>${esc(i.name)} × ${i.qty} ${esc(i.unit)}</span><span>${money(i.price * i.qty)}</span></li>`).join("")}</ul>
      <div class="order-foot">
        <span>📍 ${esc(o.governorate)} - ${esc(o.city)}</span>
        <span>💳 ${esc(o.payment)}</span>
        <b>الإجمالي: ${money(o.total)}</b>
      </div>
    </div>`).join("")
    : `<div class="empty big"><span>📦</span><h3>مفيش طلبات لسه</h3><a href="shop.html" class="btn btn-primary">ابدأ تسوق</a></div>`;
}

/* ---------- لوحة المنفذ (البائع) ---------- */
function initVendor() {
  const user = requireRole("vendor");
  if (!user) return;
  $("#v-name").textContent = user.name;
  $("#v-loc").textContent = `📍 ${user.governorate} - ${user.address || ""}`;

  const form = $("#product-form");
  $("#p-cat").innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.emoji} ${c.name}</option>`).join("");
  let imgData = "";

  // رفع صورة وتصغيرها
  $("#p-file").onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("اختار ملف صورة", "error"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 500, scale = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = img.width * scale; cv.height = img.height * scale;
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        imgData = cv.toDataURL("image/jpeg", 0.75);
        $("#p-preview").innerHTML = `<img src="${imgData}" alt="">`;
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  $("#p-url").oninput = e => {
    const u = e.target.value.trim();
    if (u) { imgData = ""; $("#p-file").value = ""; }
    $("#p-preview").innerHTML = u ? `<img src="${esc(u)}" alt="" onerror="this.remove()">` : "<span>🖼️ معاينة الصورة</span>";
  };

  function resetForm() {
    form.reset(); imgData = ""; $("#p-id").value = "";
    $("#clear-fields").hidden = true;
    $("#p-preview").innerHTML = "<span>🖼️ معاينة الصورة</span>";
    $("#form-title").textContent = "➕ أضف منتج جديد";
    $("#p-submit").textContent = "أضف المنتج";
    $("#p-cancel").hidden = true;
    $$(".field.invalid", form).forEach(f => f.classList.remove("invalid"));
  }
  $("#p-cancel").onclick = resetForm;
  $("#p-expiry").min = dateAfter(0);
  $("#p-clear").onchange = e => { $("#clear-fields").hidden = !e.target.checked; };

  form.onsubmit = e => {
    e.preventDefault();
    const f = id => $("#" + id);
    let ok = true;
    ok &= setError(f("p-name"), f("p-name").value.trim().length < 2 ? "اكتب اسم المنتج" : "");
    ok &= setError(f("p-price"), !(+f("p-price").value > 0) ? "اكتب سعر صحيح" : "");
    ok &= setError(f("p-old"), f("p-old").value && +f("p-old").value <= +f("p-price").value ? "السعر قبل الخصم لازم يكون أكبر" : "");
    ok &= setError(f("p-unit"), !f("p-unit").value.trim() ? "اكتب الوحدة (كيلو، لتر...)" : "");
    ok &= setError(f("p-stock"), !(+f("p-stock").value >= 0) || f("p-stock").value === "" ? "اكتب الكمية المتاحة" : "");
    if (f("p-clear").checked) {
      ok &= setError(f("p-extra"), !(+f("p-extra").value >= 5 && +f("p-extra").value <= 90) ? "الخصم الإضافي من 5% لـ 90%" : "");
      ok &= setError(f("p-expiry"), !f("p-expiry").value ? "حدد تاريخ انتهاء الصلاحية"
        : f("p-expiry").value < dateAfter(0) ? "التاريخ ده عدى خلاص" : "");
    }
    if (!ok) return;

    const products = getProducts();
    const id = f("p-id").value;
    const cat = CATEGORIES.find(c => c.id === f("p-cat").value);
    const data = {
      name: f("p-name").value.trim(),
      category: cat.id,
      price: +f("p-price").value,
      oldPrice: f("p-old").value ? +f("p-old").value : 0,
      unit: f("p-unit").value.trim(),
      stock: parseInt(f("p-stock").value),
      emoji: cat.emoji,
      extraDiscount: f("p-clear").checked ? +f("p-extra").value : 0,
      expiry: f("p-expiry").value || ""
    };
    const newImg = imgData || f("p-url").value.trim();
    if (id) {
      const p = products.find(x => x.id === id && x.vendorId === user.id);
      if (!p) return;
      Object.assign(p, data);
      if (newImg) { p.img = newImg; p.photo = 0; }
      toast("اتعدل المنتج ✓");
    } else {
      products.unshift({ ...data, id: uid("p"), vendorId: user.id, img: newImg, photo: newImg ? 0 : cat.photo });
      toast("اتضاف المنتج وبقى ظاهر للمشترين ✓");
    }
    if (saveProducts(products)) { resetForm(); render(); }
  };

  $("#my-products").addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const id = b.closest("tr").dataset.id;
    const products = getProducts();
    const p = products.find(x => x.id === id && x.vendorId === user.id);
    if (!p) return;
    if (b.dataset.act === "del") {
      if (!b.dataset.confirm) { b.dataset.confirm = 1; b.textContent = "متأكد؟"; setTimeout(() => { b.textContent = "حذف"; delete b.dataset.confirm; }, 2500); return; }
      saveProducts(products.filter(x => x.id !== id)); toast("اتحذف المنتج"); render();
    }
    if (b.dataset.act === "edit") {
      $("#p-id").value = p.id; $("#p-name").value = p.name; $("#p-cat").value = p.category;
      $("#p-price").value = p.price; $("#p-old").value = p.oldPrice || ""; $("#p-unit").value = p.unit;
      $("#p-stock").value = p.stock;
      $("#p-clear").checked = p.extraDiscount > 0; $("#clear-fields").hidden = !(p.extraDiscount > 0);
      $("#p-extra").value = p.extraDiscount || ""; $("#p-expiry").value = p.expiry || ""; $("#p-url").value = p.img && !p.img.startsWith("data:") ? p.img : "";
      $("#p-preview").innerHTML = productImgHTML(p);
      $("#form-title").textContent = "✏️ تعديل المنتج";
      $("#p-submit").textContent = "احفظ التعديل";
      $("#p-cancel").hidden = false;
      form.scrollIntoView({ behavior: "smooth" });
    }
  });

  function render() {
    const mine = getProducts().filter(p => p.vendorId === user.id);
    const myOrders = getOrders().map(o => ({ ...o, items: o.items.filter(i => i.vendorId === user.id) })).filter(o => o.items.length);
    const revenue = myOrders.reduce((a, o) => a + o.items.reduce((s, i) => s + i.price * i.qty, 0), 0);

    $("#st-products").textContent = mine.length;
    $("#st-orders").textContent = myOrders.length;
    $("#st-revenue").textContent = money(revenue);
    $("#st-low").textContent = mine.filter(p => p.stock < 20).length;

    $("#my-products").innerHTML = mine.length ? `
      <table class="table">
        <thead><tr><th>المنتج</th><th>القسم</th><th>السعر</th><th>المخزون</th><th></th></tr></thead>
        <tbody>${mine.map(p => `
          <tr data-id="${p.id}">
            <td><div class="t-prod">${productImgHTML(p)}<div><b>${esc(p.name)}</b>
              ${isClearance(p) ? `<small class="mini-clr">⏰ آخر اليوم -${p.extraDiscount}% • ${expiryText(p)}</small>`
                : isExpired(p) ? `<small class="mini-exp">⚠️ الصلاحية خلصت</small>` : ""}</div></div></td>
            <td>${esc(catName(p.category))}</td>
            <td>${money(p.price)} / ${esc(p.unit)} ${p.oldPrice ? `<del>${money(p.oldPrice)}</del>` : ""}</td>
            <td><span class="stock ${p.stock < 20 ? "low" : ""}">${p.stock}</span></td>
            <td><div class="t-actions"><button class="btn btn-outline btn-sm" data-act="edit">تعديل</button>
                <button class="btn btn-danger btn-sm" data-act="del">حذف</button></div></td>
          </tr>`).join("")}</tbody>
      </table>` : `<div class="empty"><span>📦</span><p>لسه مضفتش منتجات.. ابدأ من الفورم اللي فوق</p></div>`;

    $("#vendor-orders").innerHTML = myOrders.length ? myOrders.map(o => `
      <div class="order-card">
        <div class="order-head"><div><b>طلب ${o.id}</b><small>${new Date(o.date).toLocaleString("ar-EG")}</small></div><span class="status">${o.status}</span></div>
        <ul>${o.items.map(i => `<li><span>${esc(i.name)} × ${i.qty} ${esc(i.unit)}</span><span>${money(i.price * i.qty)}</span></li>`).join("")}</ul>
        <div class="order-foot"><span>👤 ${esc(o.buyerName)} - 📞 ${esc(o.phone)}</span><span>📍 ${esc(o.governorate)} - ${esc(o.city)} - ${esc(o.address)}</span></div>
      </div>`).join("")
      : `<div class="empty"><span>🧾</span><p>مفيش طلبات على منتجاتك لسه</p></div>`;
  }
  render();
}

/* ---------- تشغيل ---------- */
document.addEventListener("DOMContentLoaded", () => {
  seed();
  renderHeader();
  renderFooter();
  const pages = {
    home: initHome, register: initRegister, login: initLogin, shop: initShop,
    cart: initCart, checkout: initCheckout, orders: initOrders, vendor: initVendor
  };
  const fn = pages[document.body.dataset.page];
  if (fn) fn();
});
