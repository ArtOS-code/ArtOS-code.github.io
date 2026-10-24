/* Велоскат — статическая версия: корзина (localStorage), слайдер, меню, табы, галерея, тосты */
(function () {
  "use strict";

  var ROOT = window.__ROOT__ || "";
  var KEY = "vsk-cart";

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function fmt(v) { return Number(v).toLocaleString("ru-RU") + " руб."; }
  function img(src) { return ROOT + src; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---------------- Тосты ---------------- */
  function toast(title, desc) {
    var stack = $("#toastStack");
    if (!stack) return;
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<div class="toast-title">' + esc(title) + "</div>" +
      (desc ? '<div class="toast-desc">' + esc(desc) + "</div>" : "");
    stack.appendChild(el);
    setTimeout(function () { el.classList.add("hide"); }, 3200);
    setTimeout(function () { el.remove(); }, 3600);
  }

  /* ---------------- Корзина ---------------- */
  function loadCart() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      return (raw.state && raw.state.items) || [];
    } catch (e) { return []; }
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ state: { items: items }, version: 0 }));
    } catch (e) { /* noop */ }
  }
  var items = loadCart();

  function cartCount() { return items.reduce(function (s, i) { return s + i.qty; }, 0); }
  function cartTotal() { return items.reduce(function (s, i) { return s + i.qty * i.price; }, 0); }
  function findItem(id) { return items.filter(function (i) { return i.id === id; })[0]; }

  function addItem(data) {
    var ex = findItem(data.id);
    if (ex) ex.qty += 1;
    else items.push({ id: data.id, name: data.name, price: Number(data.price), image: data.image, qty: 1 });
    persist(); updateCartUI();
  }
  function removeItem(id) {
    items = items.filter(function (i) { return i.id !== id; });
    persist(); updateCartUI();
  }
  function setQty(id, qty) {
    if (qty <= 0) { removeItem(id); return; }
    var it = findItem(id);
    if (it) { it.qty = qty; persist(); updateCartUI(); }
  }
  function clearCart() { items = []; persist(); updateCartUI(); }

  function updateBadge() {
    var badge = $("#cartBadge");
    if (!badge) return;
    var n = cartCount();
    badge.hidden = n === 0;
    badge.textContent = n;
  }

  function renderPopover() {
    var pop = $("#cartPopover");
    if (!pop || pop.hidden) return;
    if (!items.length) {
      pop.innerHTML = '<p class="cp-empty">Корзина пока пуста</p>';
      return;
    }
    var rows = items.map(function (it) {
      return '<li class="cp-item">' +
        '<img src="' + img(it.image) + '" alt="">' +
        '<div class="flex1"><p class="cp-name">' + esc(it.name) + "</p>" +
        '<p class="cp-meta">' + it.qty + " шт. × " + fmt(it.price) + "</p></div>" +
        '<button class="cp-remove" data-remove="' + esc(it.id) + '" aria-label="Удалить">&#10005;</button></li>';
    }).join("");
    pop.innerHTML =
      '<ul class="cp-list">' + rows + "</ul>" +
      '<div class="cp-total"><span>Итого:</span><b>' + fmt(cartTotal()) + "</b></div>" +
      '<div class="cp-actions"><a class="cp-btn" href="' + ROOT + 'korzina/">В корзину</a>' +
      '<a class="cp-btn cp-btn-primary" href="' + ROOT + 'korzina/">Оформить заказ</a></div>';
  }

  function updateCartUI() { updateBadge(); renderPopover(); renderCartPage(); }

  /* Поповер корзины */
  var pop = $("#cartPopover"), cartBtn = $("#cartBtn");
  if (cartBtn && pop) {
    cartBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      pop.hidden = !pop.hidden;
      renderPopover();
    });
    document.addEventListener("click", function (e) {
      if (!pop.hidden && !pop.contains(e.target) && e.target !== cartBtn) pop.hidden = true;
    });
  }

  /* ---------------- Выпадающие категории ---------------- */
  var catsToggle = $("#catsToggle"), catsPanel = $("#catsPanel"), catsClose = $("#catsClose");
  var catsOverlay = null;
  function closeCats() {
    if (catsPanel) catsPanel.hidden = true;
    if (catsToggle) catsToggle.setAttribute("aria-expanded", "false");
    if (catsOverlay) { catsOverlay.remove(); catsOverlay = null; }
  }
  if (catsToggle && catsPanel) {
    catsToggle.addEventListener("click", function () {
      var open = catsPanel.hidden;
      catsPanel.hidden = !open;
      catsToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && !catsOverlay) {
        catsOverlay = document.createElement("div");
        catsOverlay.className = "cats-overlay";
        catsOverlay.addEventListener("click", closeCats);
        document.body.appendChild(catsOverlay);
      } else if (!open) closeCats();
    });
  }
  if (catsClose) catsClose.addEventListener("click", closeCats);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeCats(); if (pop) pop.hidden = true; }
  });

  /* ---------------- Слайдер ---------------- */
  var hero = $(".hero");
  if (hero) {
    var slides = $$(".hero-slide", hero);
    var dots = $$(".dot", hero);
    var idx = 0, timer = null;
    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        s.classList.toggle("active", n === idx);
        s.setAttribute("aria-hidden", n === idx ? "false" : "true");
      });
      dots.forEach(function (d, n) { d.classList.toggle("active", n === idx); });
    }
    function play() { timer = setInterval(function () { show(idx + 1); }, 6000); }
    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        show(Number(d.getAttribute("data-slide")));
        clearInterval(timer); play();
      });
    });
    play();
  }

  /* ---------------- Табы товара ---------------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".tab-btn") : null;
    if (!btn) return;
    var root = btn.closest(".tabs");
    if (!root) return;
    $$(".tab-btn", root).forEach(function (b) { b.classList.toggle("active", b === btn); });
    $$(".tab-panel", root).forEach(function (p) {
      p.hidden = p.id !== "tab-" + btn.getAttribute("data-tab");
    });
  });

  /* ---------------- Галерея товара ---------------- */
  document.addEventListener("click", function (e) {
    var th = e.target.closest ? e.target.closest(".thumb") : null;
    if (!th) return;
    var main = $("#galleryMain");
    if (main && th.getAttribute("data-full")) main.src = th.getAttribute("data-full");
    $$(".thumb").forEach(function (t) { t.classList.toggle("active", t === th); });
  });

  /* ---------------- Добавление в корзину ---------------- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".js-add") : null;
    if (!btn) return;
    addItem({
      id: btn.getAttribute("data-id"),
      name: btn.getAttribute("data-name"),
      price: btn.getAttribute("data-price"),
      image: btn.getAttribute("data-image"),
    });
    toast("Товар добавлен в корзину", btn.getAttribute("data-name"));
  });

  /* Удаление из поповера */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-remove]") : null;
    if (!btn) return;
    removeItem(btn.getAttribute("data-remove"));
  });

  /* ---------------- Страница корзины ---------------- */
  function renderCartPage() {
    var list = $("#cartItems");
    if (!list) return;
    var empty = $("#cartEmpty"), wrap = $("#cartWrap");
    if (!items.length) {
      if (empty) empty.hidden = false;
      if (wrap) wrap.hidden = true;
      list.innerHTML = "";
      return;
    }
    if (empty) empty.hidden = true;
    if (wrap) wrap.hidden = false;
    list.innerHTML = items.map(function (it) {
      return '<li class="cart-item">' +
        '<img class="cart-item-img" src="' + img(it.image) + '" alt="">' +
        '<div class="cart-item-info"><p class="cart-item-name">' + esc(it.name) + "</p>" +
        '<p class="cart-item-price">' + fmt(it.price) + " за шт.</p></div>" +
        '<div class="qty-ctrl">' +
        '<button class="qty-btn" data-qty="-1" data-id="' + esc(it.id) + '" aria-label="Уменьшить количество">&minus;</button>' +
        '<span class="qty-num">' + it.qty + "</span>" +
        '<button class="qty-btn" data-qty="1" data-id="' + esc(it.id) + '" aria-label="Увеличить количество">+</button>' +
        "</div>" +
        '<p class="cart-item-sum">' + fmt(it.price * it.qty) + "</p>" +
        '<button class="cart-item-remove" data-remove="' + esc(it.id) + '" aria-label="Удалить">&#10005;</button></li>';
    }).join("");
    $("#cartTotalCount").textContent = cartCount();
    $("#cartTotalSum").textContent = fmt(cartTotal());
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".qty-btn") : null;
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var it = findItem(id);
    if (it) setQty(id, it.qty + Number(btn.getAttribute("data-qty")));
  });
  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest(".js-clear-cart") : null;
    if (!btn) return;
    clearCart();
  });

  var checkout = $("#checkoutForm");
  if (checkout) {
    checkout.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!items.length) return;
      var name = $("#cart-name").value.trim(), phone = $("#cart-phone").value.trim();
      if (!name || !phone) {
        toast("Заполните контакты", "Укажите имя и телефон, чтобы мы могли подтвердить заказ.");
        return;
      }
      toast("Заказ оформлен!", "Это демо-магазин: менеджер свяжется с Вами по указанному телефону для подтверждения.");
      clearCart();
      checkout.reset();
    });
  }

  /* ---------------- Форма контактов ---------------- */
  var contact = $("#contactForm");
  if (contact) {
    contact.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = $("#cf-name").value.trim(), phone = $("#cf-phone").value.trim();
      if (!name || !phone) {
        toast("Заполните поля", "Укажите имя и телефон, чтобы мы могли связаться с Вами.");
        return;
      }
      toast("Сообщение отправлено!", "Наши консультанты свяжутся с Вами в ближайшее время.");
      contact.reset();
    });
  }

  /* ---------------- Личный кабинет ---------------- */
  var login = $("#loginForm");
  if (login) {
    login.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("#acc-email").value.trim(), pass = $("#acc-pass").value.trim();
      if (!email || !pass) {
        toast("Заполните поля", "Укажите e-mail и пароль.");
        return;
      }
      $("#accountAuth").hidden = true;
      $("#accountProfile").hidden = false;
      $("#profileEmail").textContent = email;
      toast("Добро пожаловать!", "Вы вошли в личный кабинет (демо-режим).");
    });
  }

  /* Старт */
  updateCartUI();
})();
