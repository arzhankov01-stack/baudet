/* =========================================================
   BAUDET — логика сайта (шапка, подвал, каталог, корзина)
   ========================================================= */
(function () {
  'use strict';
  var C = window.BAUDET_CONFIG;
  var P = window.BAUDET_PRODUCTS;

  /* ---------- помощники ---------- */
  var SIZE_NAME = { S: 'ручная кладь', M: 'средний', L: 'большой' };
  var SIZE_CM = { S: 'до 55 см', M: '60–69 см', L: 'от 70 см' };
  var COLOR_HEX = {
    'белый': '#f4f4f2', 'серый': '#9a9c9e', 'чёрный': '#1c1c1c', 'синий': '#1f3f7a',
    'голубой': '#6fb7d9', 'коричневый': '#8a5a34', 'оранжевый': '#e8732a',
    'красный': '#c8211f', 'бежевый': '#c9ab86', 'зелёный': '#4d7a4a',
    'жёлтый': '#f2c320', 'розовый': '#e9a1b4', 'фиолетовый': '#5b3a78'
  };
  var CATS = [
    ['suitcase', 'чемоданы'], ['beauty', 'бьюти-кейсы'], ['set', 'комплекты'],
    ['backpack', 'рюкзаки'], ['kids', 'детские'], ['trolley', 'сумки-тележки']
  ];
  function catName(c) { for (var i = 0; i < CATS.length; i++) if (CATS[i][0] === c) return CATS[i][1]; return ''; }

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
  function img(path) { return C.IMAGE_BASE + path; }
  function byId(id) { for (var i = 0; i < P.length; i++) if (P[i].id === id) return P[i]; return null; }
  function shortName(p) {
    if (p.cat === 'suitcase' && p.title.indexOf('складной') < 0) return 'чемодан ' + p.size.toLowerCase() + ' · ' + (p.shell === 'hard' ? 'пластик' : 'ткань');
    return p.title;
  }
  function fullName(p) { return p.title; }
  function colorText(p) { return p.colorLabel || p.colors.join(', '); }
  function inStock(p) { return !p.soldOut && p.price > 0; }
  function has(p, word) { return (p.features || []).join(' ').indexOf(word) >= 0; }
  function params() { var o = {}; new URLSearchParams(location.search).forEach(function (v, k) { o[k] = v; }); return o; }
  function plural(n, a, b, c) { var m = n % 10, h = n % 100; if (m === 1 && h !== 11) return a; if (m >= 2 && m <= 4 && (h < 10 || h >= 20)) return b; return c; }

  /* ---------- корзина (хранится в браузере) ---------- */
  var KEY = 'baudet_cart_v1';
  function readCart() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function writeCart(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} updateCount(); }
  function addToCart(id) {
    var c = readCart(), f = null;
    c.forEach(function (x) { if (x.id === id) f = x; });
    if (f) f.qty += 1; else c.push({ id: id, qty: 1 });
    writeCart(c);
  }
  function cartCount() { return readCart().reduce(function (s, x) { return s + x.qty; }, 0); }
  function updateCount() { var el = $('#cart-count'); if (el) el.textContent = cartCount(); }

  /* ---------- шапка и подвал ---------- */
  var NAV = [
    ['catalog.html?new=1', 'новинки', 'new'],
    ['catalog.html?cat=suitcase', 'чемоданы', 'suitcase'],
    ['catalog.html?cat=beauty', 'бьюти-кейсы', 'beauty'],
    ['catalog.html', 'все товары', 'catalog'],
    ['about.html', 'о бренде', 'about'],
    ['delivery.html', 'доставка', 'delivery'],
    ['contacts.html', 'контакты', 'contacts']
  ];

  function renderHeader() {
    var page = document.body.dataset.page, q = params();
    var cur = page === 'catalog' ? (q.new ? 'new' : q.cat === 'suitcase' || q.cat === 'beauty' ? q.cat : 'catalog') : page;
    var links = NAV.map(function (n, i) {
      return '<a href="' + n[0] + '"' + (i > 3 ? ' class="nav__more"' : '') + (n[2] === cur ? ' aria-current="page"' : '') + '>' + n[1] + '</a>';
    }).join('');
    var tick = ['бесплатная доставка от ' + money(C.FREE_DELIVERY_FROM), 'гарантия до 2 лет', 'кодовые замки TSA', '10 лет сервисного обслуживания', 'с 2005 года'];
    var t = tick.concat(tick).map(function (s) { return '<span>' + s + '</span>'; }).join('');

    $('#header').innerHTML =
      '<div class="ticker" aria-hidden="true"><div class="ticker__track">' + t + t + '</div></div>' +
      '<header class="header"><div class="header__row">' +
        '<button class="burger" id="burger" aria-expanded="false" aria-controls="drawer">меню</button>' +
        '<nav class="nav" aria-label="Основное меню">' + links + '</nav>' +
        '<a class="logo" href="index.html" aria-label="Baudet — на главную">Baudet</a>' +
        '<div class="header__right">' +
          '<a class="header__phone" href="tel:' + C.PHONE_RAW + '">' + C.PHONE + '</a>' +
          '<a class="header__cart" href="cart.html">корзина <b>(<span id="cart-count">0</span>)</b></a>' +
        '</div>' +
      '</div></header>' +
      '<div class="drawer" id="drawer" hidden>' +
        '<div class="drawer__top"><span class="logo" style="justify-self:start">Baudet</span><button class="burger" id="close" style="display:inline">закрыть</button></div>' +
        '<nav>' + links + '<a href="cart.html">корзина</a></nav>' +
        '<div class="footer__contact"><span class="label">служба поддержки</span><a class="big" href="tel:' + C.PHONE_RAW + '">' + C.PHONE + '</a><span class="label">' + C.HOURS + '</span></div>' +
      '</div>';

    var drawer = $('#drawer'), burger = $('#burger');
    burger.addEventListener('click', function () { drawer.hidden = false; burger.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; });
    $('#close').addEventListener('click', function () { drawer.hidden = true; burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; });
    updateCount();
  }

  function renderFooter() {
    var soc = [['TELEGRAM', 'telegram'], ['VK', 'вконтакте'], ['WILDBERRIES', 'wildberries'], ['OZON', 'ozon']]
      .filter(function (s) { return C[s[0]]; })
      .map(function (s) { return '<li><a href="' + esc(C[s[0]]) + '" target="_blank" rel="noopener">' + s[1] + '</a></li>'; }).join('');
    var legal = C.COMPANY + (C.INN ? ' · ИНН ' + C.INN : '') + (C.OGRN ? ' · ОГРН ' + C.OGRN : '');
    $('#footer').innerHTML =
      '<footer class="footer">' +
        '<div class="footer__cols">' +
          '<div class="footer__contact"><h4 class="label">служба поддержки</h4>' +
            '<a class="big" href="tel:' + C.PHONE_RAW + '">' + C.PHONE + '</a>' +
            '<a href="mailto:' + C.EMAIL + '">' + C.EMAIL + '</a>' +
            '<span class="label">' + C.HOURS + '</span></div>' +
          '<div><h4 class="label">каталог</h4><ul>' +
            '<li><a href="catalog.html?new=1">новинки</a></li><li><a href="catalog.html?size=S">ручная кладь S</a></li>' +
            '<li><a href="catalog.html?size=M">средние M</a></li><li><a href="catalog.html?size=L">большие L</a></li>' +
            '<li><a href="catalog.html?cat=beauty">бьюти-кейсы</a></li><li><a href="catalog.html?cat=set">комплекты</a></li>' +
            '<li><a href="catalog.html?cat=backpack">рюкзаки</a></li><li><a href="catalog.html?cat=trolley">сумки-тележки</a></li></ul></div>' +
          '<div><h4 class="label">клиентам</h4><ul>' +
            '<li><a href="delivery.html">доставка и оплата</a></li><li><a href="delivery.html#return">возврат</a></li>' +
            '<li><a href="about.html#warranty">гарантия</a></li><li><a href="contacts.html">контакты</a></li></ul></div>' +
          '<div><h4 class="label">компания</h4><ul>' +
            '<li><a href="about.html">о бренде</a></li><li><a href="privacy.html">политика конфиденциальности</a></li>' + soc + '</ul></div>' +
        '</div>' +
        '<div class="footer__wordmark" aria-hidden="true">Baudet</div>' +
        '<div class="footer__bottom label"><span>© 2005–' + new Date().getFullYear() + ' Baudet</span><span>' + esc(legal) + '</span></div>' +
      '</footer>';
  }

  /* ---------- карточка товара ---------- */
  function card(p) {
    var dots = p.colors.map(function (c) { return '<span class="dot" style="background:' + (COLOR_HEX[c] || '#ccc') + '" title="' + esc(c) + '"></span>'; }).join('');
    var ok = inStock(p);
    var badge = !ok ? ''
      : p.oldPrice ? '<span class="card__badge">−' + Math.round((1 - p.price / p.oldPrice) * 100) + '%</span>'
      : p.isNew ? '<span class="card__badge">новинка</span>' : '';
    return '<a class="card' + (ok ? '' : ' card--out') + '" href="product.html?id=' + p.id + '">' +
      '<div class="card__img">' + badge +
        '<div class="card__track">' + p.images.map(function (src, i) {
          return '<img src="' + img(src) + '" alt="' + (i ? '' : esc(fullName(p) + (colorText(p) ? ', ' + colorText(p) : ''))) + '" loading="lazy" draggable="false">';
        }).join('') + '</div>' +
        (p.images.length > 1 ? '<div class="card__bars" aria-hidden="true">' + p.images.map(function (s, i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="card__body">' +
        '<span class="card__name">' + esc(shortName(p)) + '</span>' +
        '<span class="card__meta">' + (ok ? (p.oldPrice ? '<s>' + money(p.oldPrice) + '</s>' : '') + money(p.price) : '<span class="muted">нет в наличии</span>') + '</span>' +
        '<span class="dots">' + dots + '</span>' +
      '</div></a>';
  }

  /* фото в карточке: ведёшь мышкой — листаются, на телефоне — свайп */
  function bindCardGalleries() {
    function bars(track) {
      var box = track.parentNode.querySelector('.card__bars'); if (!box) return;
      var i = Math.round(track.scrollLeft / (track.clientWidth || 1));
      Array.prototype.forEach.call(box.children, function (b, k) { b.className = k === i ? 'on' : ''; });
    }
    document.addEventListener('scroll', function (e) {
      if (e.target.classList && e.target.classList.contains('card__track')) bars(e.target);
    }, true);
    if (!window.matchMedia('(hover: hover)').matches) return;
    document.addEventListener('mousemove', function (e) {
      var box = e.target.closest && e.target.closest('.card__img'); if (!box) return;
      var track = box.querySelector('.card__track'), n = track.children.length; if (n < 2) return;
      var r = box.getBoundingClientRect();
      var i = Math.min(n - 1, Math.max(0, Math.floor((e.clientX - r.left) / r.width * n)));
      track.scrollLeft = i * track.clientWidth;
    });
    document.addEventListener('mouseout', function (e) {
      var box = e.target.closest && e.target.closest('.card__img');
      if (box && !box.contains(e.relatedTarget)) box.querySelector('.card__track').scrollLeft = 0;
    });
  }

  function toast(html) {
    var t = $('.toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = html;
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.remove(); }, 4000);
  }

  function post(payload) {
    if (location.protocol === 'file:') return Promise.reject(new Error('local'));
    return fetch(C.ORDER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (d) { if (!d.ok) throw new Error(d.error || 'fail'); return d; });
  }

  function bindSubscribe() {
    var f = $('#subscribe'); if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = $('#subscribe-note'), email = f.elements.email.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { note.textContent = 'Проверьте адрес почты.'; return; }
      note.textContent = 'Отправляем…';
      post({ type: 'subscribe', email: email })
        .then(function () { note.textContent = 'Готово. Промокод на −10% придёт на почту.'; f.reset(); })
        .catch(function (err) { note.textContent = err.message === 'local' ? 'Подписка заработает после загрузки сайта на хостинг.' : 'Не получилось отправить. Попробуйте позже.'; });
    });
  }

  /* ---------- главная ---------- */
  function initIndex() {
    // «экран» на первом экране: фото чемоданов сменяются через размытие
    var stage = $('#screen-stage');
    if (stage) {
      var seen = {}, slides = P.filter(function (p) {
        if (!inStock(p) || p.cat !== 'suitcase' || seen[p.colors.join()]) return false;
        seen[p.colors.join()] = 1; return true;
      }).slice(0, 6);
      stage.innerHTML = slides.map(function (p, i) {
        return '<img src="' + img(p.images[0]) + '" alt="' + esc(fullName(p)) + '"' + (i ? ' loading="lazy"' : '') + '>';
      }).join('');
      var imgs = stage.querySelectorAll('img'), k = 0;
      function show(i) {
        imgs.forEach(function (im, j) { im.classList.toggle('on', j === i); });
        var p = slides[i];
        $('#screen-name').textContent = shortName(p) + ' · ' + colorText(p);
        $('#screen-price').textContent = money(p.price);
        $('#screen-count').textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + slides.length).slice(-2);
        $('#screen').href = 'product.html?id=' + p.id;
      }
      if (slides.length) {
        show(0);
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduce && slides.length > 1) setInterval(function () { if (!document.hidden) { k = (k + 1) % slides.length; show(k); } }, 2600);
      }
    }
    var hero = $('#hero-img'); if (hero) hero.src = C.HERO_IMAGE;
    var avail = P.filter(inStock);
    var news = avail.filter(function (p) { return p.isNew; }).slice(0, 8);
    $('#grid-new').innerHTML = news.map(card).join('');
    var picks = avail.filter(function (p) { return !p.isNew && p.cat === 'suitcase'; }).slice(0, 4)
      .concat(avail.filter(function (p) { return p.cat !== 'suitcase'; }).slice(0, 4));
    $('#grid-all').innerHTML = picks.map(card).join('');
    ['S', 'M', 'L'].forEach(function (s) {
      var n = P.filter(function (p) { return p.cat === 'suitcase' && p.size === s; }).length;
      var el = $('#count-' + s); if (el) el.textContent = n + ' ' + plural(n, 'модель', 'модели', 'моделей');
    });
    var total = $('#count-all'); if (total) total.textContent = P.length;
  }

  /* ---------- каталог ---------- */
  function initCatalog() {
    var q = params();
    function blank(sort) { return { cat: '', size: '', shell: '', color: '', isNew: false, stock: false, sort: sort || 'default' }; }
    var state = blank();
    state.cat = q.cat || ''; state.size = q.size || ''; state.shell = q.shell || ''; state.color = q.color || ''; state.isNew = !!q.new;
    var colors = [];
    P.forEach(function (p) { p.colors.forEach(function (c) { if (colors.indexOf(c) < 0) colors.push(c); }); });

    function chip(group, value, label) {
      var on = group === 'isNew' ? state.isNew : group === 'stock' ? state.stock : group === 'all'
        ? !(state.cat || state.size || state.shell || state.color || state.isNew || state.stock) : state[group] === value;
      return '<button class="chip" data-g="' + group + '" data-v="' + value + '" aria-pressed="' + on + '">' + label + '</button>';
    }
    function draw() {
      var list = P.filter(function (p) {
        return (!state.cat || p.cat === state.cat) && (!state.size || p.size === state.size) &&
          (!state.shell || p.shell === state.shell) && (!state.color || p.colors.indexOf(state.color) >= 0) &&
          (!state.isNew || p.isNew) && (!state.stock || inStock(p));
      });
      function byStock(a, b) { return (inStock(a) ? 0 : 1) - (inStock(b) ? 0 : 1); }
      if (state.sort === 'asc') list.sort(function (a, b) { return byStock(a, b) || a.price - b.price; });
      if (state.sort === 'desc') list.sort(function (a, b) { return byStock(a, b) || b.price - a.price; });

      var title = state.isNew ? 'новинки'
        : state.cat ? catName(state.cat) + (state.size ? ' ' + state.size : '')
        : state.size ? 'чемоданы ' + state.size
        : state.shell === 'hard' ? 'жёсткие' : state.shell === 'soft' ? 'тканевые' : 'все товары';
      $('#cat-title').textContent = title;
      document.title = title.charAt(0).toUpperCase() + title.slice(1) + ' — Baudet';
      var n = list.filter(inStock).length;
      $('#cat-count').textContent = list.length + ' ' + plural(list.length, 'товар', 'товара', 'товаров') + ' · в наличии ' + n;

      $('#filters').innerHTML =
        '<div class="filters__row">' + chip('all', '', 'все') + chip('isNew', '1', 'новинки') + chip('stock', '1', 'в наличии') + '<span class="filters__sep"></span>' +
          CATS.map(function (c) { return chip('cat', c[0], c[1]); }).join('') + '</div>' +
        '<div class="filters__row">' + chip('size', 'S', 'S · ручная кладь') + chip('size', 'M', 'M · средние') + chip('size', 'L', 'L · большие') + '<span class="filters__sep"></span>' +
          chip('shell', 'hard', 'жёсткие') + chip('shell', 'soft', 'тканевые') + '<span class="filters__sep"></span>' +
          colors.map(function (c) { return chip('color', c, '<span class="dot" style="background:' + (COLOR_HEX[c] || '#ccc') + '"></span>' + c); }).join('') +
          '<select id="sort" aria-label="Сортировка"><option value="default">по умолчанию</option><option value="asc">сначала дешевле</option><option value="desc">сначала дороже</option></select></div>';
      $('#sort').value = state.sort;

      $('#grid').innerHTML = list.map(card).join('');
      $('#empty').hidden = list.length > 0;
    }
    function sync() {
      var u = new URLSearchParams();
      ['cat', 'size', 'shell', 'color'].forEach(function (k) { if (state[k]) u.set(k, state[k]); });
      if (state.isNew) u.set('new', '1');
      history.replaceState(null, '', 'catalog.html' + (u.toString() ? '?' + u : ''));
      draw(); renderHeader();
    }
    $('#filters').addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      var g = b.dataset.g, v = b.dataset.v;
      if (g === 'all') state = blank(state.sort);
      else if (g === 'isNew') state.isNew = !state.isNew;
      else if (g === 'stock') state.stock = !state.stock;
      else {
        state[g] = state[g] === v ? '' : v;
        if (g === 'cat' && state.cat && state.cat !== 'suitcase' && state.cat !== 'set') { state.size = ''; state.shell = ''; }
      }
      sync();
    });
    $('#filters').addEventListener('change', function (e) { if (e.target.id === 'sort') { state.sort = e.target.value; draw(); } });
    $('#reset').addEventListener('click', function () { state = blank(); sync(); });
    draw();
  }

  /* ---------- товар ---------- */

  function initProduct() {
    var p = byId(params().id);
    if (!p) { $('#product').innerHTML = '<div class="empty">Такого товара нет. <a class="link-all" href="catalog.html">в каталог</a></div>'; return; }
    var ok = inStock(p);
    document.title = fullName(p) + (colorText(p) ? ', ' + colorText(p) : '') + ' — Baudet';

    // та же модель в других цветах
    var sameModel = P.filter(function (x) {
      return x.cat === p.cat && x.title === p.title && (x.material || '') === (p.material || '') && x.h === p.h && x.w === p.w;
    });
    // тот же цвет в других размерах
    var key = p.colors.slice().sort().join();
    var sizes = p.cat === 'suitcase' && p.size ? ['S', 'M', 'L'].map(function (s) {
      var m = P.filter(function (x) { return x.cat === 'suitcase' && x.size === s && x.shell === p.shell && x.colors.slice().sort().join() === key; })
        .sort(function (a, b) { return (inStock(a) ? 0 : 1) - (inStock(b) ? 0 : 1); })[0];
      return m ? '<a href="product.html?id=' + m.id + '"' + (m.id === p.id ? ' aria-current="true"' : '') + '>' + s + (m.h ? ' · ' + m.h + ' см' : '') + '</a>' : '';
    }).join('') : '';

    var gal = p.images.map(function (src, i) {
      var wide = i === p.images.length - 1 && p.images.length % 2 === 0;
      return '<figure' + (wide ? ' class="wide"' : '') + '><img src="' + img(src) + '" alt="' + esc(fullName(p) + ', фото ' + (i + 1)) + '"' + (i > 1 ? ' loading="lazy"' : '') + '></figure>';
    }).join('');

    var rows = [
      ['артикул', p.id],
      ['размер', p.size && p.cat === 'suitcase' ? p.size + ' — ' + SIZE_NAME[p.size] + ' (' + SIZE_CM[p.size] + ')' : ''],
      ['цвет', colorText(p)], ['материал', p.material],
      ['высота × ширина × глубина', p.h ? p.h + ' × ' + p.w + ' × ' + p.d + ' см' : ''],
      ['объём', p.volume], ['вес', p.weight], ['отделений', p.sections], ['нагрузка', p.load],
      ['комплектация', p.kit], ['особенности', (p.features || []).join('; ')], ['страна производства', 'Китай']
    ].filter(function (r) { return r[1]; })
     .map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>'; }).join('');

    var warranty = p.cat === 'backpack' || p.cat === 'trolley' ? '6 месяцев'
      : (p.material || '').indexOf('полипропилен') >= 0 ? '2 года' : 'по условиям гарантии Baudet';

    $('#product').innerHTML =
      '<div class="product">' +
        '<div class="gallery">' + gal + '</div>' +
        '<div class="buy">' +
          '<span class="label">' + (p.isNew ? '<span style="color:var(--red)">новинка</span> · ' : '') + catName(p.cat) + ' · арт. ' + p.id + '</span>' +
          '<h1>' + esc(fullName(p)) + '</h1>' +
          '<div class="buy__price">' + (ok ? money(p.price) + (p.oldPrice ? '<s>' + money(p.oldPrice) + '</s>' : '') : '<span class="muted">нет в наличии</span>') + '</div>' +
          (sameModel.length > 1 || colorText(p) ? '<div><div class="label" style="margin-bottom:8px">цвет' + (colorText(p) ? ' — ' + esc(colorText(p)) : '') + '</div>' +
            (sameModel.length > 1 ? '<div class="variants">' + sameModel.map(function (x) {
              return '<a href="product.html?id=' + x.id + '"' + (x.id === p.id ? ' aria-current="true"' : '') + (inStock(x) ? '' : ' class="out"') + '>' + esc(colorText(x) || x.id) + '</a>';
            }).join('') + '</div>' : '') + '</div>' : '') +
          (sizes ? '<div><div class="label" style="margin-bottom:8px">размер</div><div class="variants">' + sizes + '</div></div>' : '') +
          (ok ? '<button class="btn" id="add">в корзину</button>'
              : '<button class="btn" disabled>нет в наличии</button><p class="label" style="margin:-10px 0 0">узнать о поступлении: <a href="tel:' + C.PHONE_RAW + '">' + C.PHONE + '</a></p>') +
          '<ul class="perks label">' +
            '<li>— бесплатная доставка от ' + money(C.FREE_DELIVERY_FROM) + '</li>' +
            '<li>— примерка перед покупкой при заказе до 3 товаров</li>' +
            '<li>— гарантия: ' + warranty + '</li></ul>' +
          '<div>' +
            '<details class="acc" open><summary>характеристики</summary><div class="acc__body"><table class="specs">' + rows + '</table></div></details>' +
            '<details class="acc"><summary>о модели</summary><div class="acc__body">' + description(p) + '</div></details>' +
            '<details class="acc"><summary>доставка и возврат</summary><div class="acc__body">Курьером или в пункт выдачи за 1–2 дня. Оплата картой на сайте или при получении. Вернуть товар можно всегда — условия на странице доставки. <a class="link-all" href="delivery.html">подробнее</a></div></details>' +
          '</div>' +
        '</div>' +
      '</div>';

    var add = $('#add');
    if (add) add.addEventListener('click', function () {
      addToCart(p.id);
      toast('Добавили в корзину <a href="cart.html">оформить</a>');
    });

    var rel = P.filter(function (x) { return x.id !== p.id && inStock(x) && x.cat === p.cat && (x.size === p.size || !p.size); });
    if (rel.length < 4) rel = rel.concat(P.filter(function (x) { return x.id !== p.id && inStock(x) && rel.indexOf(x) < 0; }));
    $('#grid-related').innerHTML = rel.slice(0, 4).map(card).join('');
  }

  function description(p) {
    var t = [];
    var m = p.material || '';
    if (p.cat === 'beauty') {
      t.push('Компактный жёсткий кейс для косметики и мелочей. Удобно взять в салон самолёта вместе с чемоданом или поставить сверху на ручку чемодана.');
      if (p.kit) t.push('Внутри: ' + p.kit + '.');
    } else if (p.cat === 'set') {
      t.push('Комплект из чемодана S ручной клади и бьюти-кейса в одном цвете. Корпус из полипропилена, кодовый замок TSA, колёса на 360°.');
    } else if (p.cat === 'backpack') {
      t.push('Городской рюкзак с отделением для ноутбука и боковыми карманами.');
    } else if (p.cat === 'trolley') {
      t.push(p.title.indexOf('колёса') === 0 ? 'Запасные колёса для сумки-тележки Baudet, 2 шт.' : 'Хозяйственная сумка-тележка на колёсах из прочного полиэстера 900D. Выдерживает до 20 кг.');
    } else if (p.cat === 'kids') {
      t.push('Лицензионный детский чемодан Hello Kitty из поликарбоната — лёгкий, 1,7 кг.');
    } else if (p.title.indexOf('складной') >= 0) {
      t.push('Тканевый чемодан складывается и занимает минимум места дома. Влагоустойчивый жаккард, выдвижная ручка.');
    } else if (p.shell === 'hard') {
      t.push('Корпус из ' + (m.indexOf('поликарбонат') >= 0 ? 'поликарбоната' : 'полипропилена') + ': выдерживает падения, не трескается на морозе и не выгорает на солнце. При сильном ударе может слегка помяться — форма восстанавливается, если надавить изнутри.');
    } else {
      t.push('Тканевый чемодан из износостойкого материала (' + m + '). Мягкий корпус проще уложить в багажник или на полку, а наружные карманы держат мелочи под рукой.');
    }
    if (has(p, 'TSA')) t.push('Кодовый замок TSA: таможня может досмотреть багаж без взлома и повреждения замка. Ключ для таможенного досмотра в комплект не входит.');
    if (has(p, 'расширение')) t.push('Молния-расширитель добавляет объём на обратную дорогу — для покупок и сувениров.');
    if (has(p, 'USB')) t.push('Встроенный USB-порт: подключите павербанк внутри, а телефон заряжайте снаружи.');
    if (has(p, 'рюкзака')) t.push('Чемодан превращается в рюкзак: лямки убираются в спинку.');
    if (p.cat === 'suitcase' && p.size === 'S') t.push('Размер S подходит под нормы ручной клади большинства авиакомпаний — уточняйте правила своего перевозчика.');
    return t.map(function (s) { return '<p style="margin:0 0 10px">' + s + '</p>'; }).join('');
  }

  /* ---------- корзина и заказ ---------- */
  function initCart() {
    function draw() {
      var c = readCart().filter(function (x) { var p = byId(x.id); return p && inStock(p); });
      var box = $('#cart-list');
      if (!c.length) {
        $('#cart').hidden = true; $('#cart-empty').hidden = false; return;
      }
      $('#cart').hidden = false; $('#cart-empty').hidden = true;
      var sum = 0, qty = 0;
      box.innerHTML = c.map(function (x) {
        var p = byId(x.id); sum += p.price * x.qty; qty += x.qty;
        return '<div class="cart-item">' +
          '<a class="cart-item__img" href="product.html?id=' + p.id + '"><img src="' + img(p.images[0]) + '" alt=""></a>' +
          '<div><a class="cart-item__name" href="product.html?id=' + p.id + '">' + esc(fullName(p)) + '</a>' +
            '<div class="label" style="margin-top:4px">' + esc(colorText(p)) + ' · арт. ' + p.id + '</div>' +
            '<div class="qty"><button data-a="-" data-id="' + p.id + '" aria-label="Меньше">−</button><span>' + x.qty + '</span><button data-a="+" data-id="' + p.id + '" aria-label="Больше">+</button></div>' +
            '<button class="remove" data-a="x" data-id="' + p.id + '">удалить</button></div>' +
          '<div class="mono">' + money(p.price * x.qty) + '</div></div>';
      }).join('');
      var left = C.FREE_DELIVERY_FROM - sum;
      $('#totals').innerHTML =
        '<div><span>товары, ' + qty + ' шт.</span><span>' + money(sum) + '</span></div>' +
        '<div><span>доставка</span><span>' + (left <= 0 ? 'бесплатно' : 'по тарифу службы') + '</span></div>' +
        (left > 0 ? '<div class="label" style="color:var(--red)">до бесплатной доставки ' + money(left) + '</div><div class="progress"><i style="width:' + Math.min(100, sum / C.FREE_DELIVERY_FROM * 100) + '%"></i></div>' : '') +
        '<div class="grand"><span>итого</span><span>' + money(sum) + '</span></div>';
    }
    $('#cart-list').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var c = readCart(), id = b.dataset.id;
      c = c.map(function (x) {
        if (x.id !== id) return x;
        if (b.dataset.a === '+') x.qty += 1;
        if (b.dataset.a === '-') x.qty -= 1;
        if (b.dataset.a === 'x') x.qty = 0;
        return x;
      }).filter(function (x) { return x.qty > 0; });
      writeCart(c); draw();
    });

    var f = $('#order'), msg = $('#order-msg');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      msg.className = 'form__msg';
      var phone = f.elements.phone.value.replace(/\D/g, '');
      if (!f.elements.name.value.trim()) return fail('Укажите имя.');
      if (phone.length < 10) return fail('Проверьте номер телефона.');
      if (!f.elements.city.value.trim()) return fail('Укажите город.');
      if (!f.elements.agree.checked) return fail('Нужно согласие на обработку данных.');
      var items = readCart().map(function (x) { var p = byId(x.id); return p && inStock(p) ? { id: p.id, name: fullName(p), color: colorText(p), qty: x.qty, price: p.price } : null; }).filter(Boolean);
      if (!items.length) return fail('Корзина пустая.');
      var data = {
        type: 'order', items: items,
        total: items.reduce(function (s, i) { return s + i.price * i.qty; }, 0),
        name: f.elements.name.value.trim(), phone: f.elements.phone.value.trim(), email: f.elements.email.value.trim(),
        city: f.elements.city.value.trim(), address: f.elements.address.value.trim(),
        delivery: f.elements.delivery.value, payment: f.elements.payment.value, comment: f.elements.comment.value.trim()
      };
      var btn = $('#order-btn'); btn.disabled = true; msg.textContent = 'Отправляем заказ…';
      post(data).then(function (d) {
        writeCart([]);
        $('#cart-wrap').innerHTML = '<div class="done"><span class="label">заказ ' + esc(d.order || '') + '</span><h1>спасибо, заказ принят</h1>' +
          '<p>Менеджер позвонит вам по номеру ' + esc(data.phone) + ' в рабочее время (' + C.HOURS + '), чтобы подтвердить заказ и доставку.</p>' +
          '<a class="btn btn--ghost" href="catalog.html">вернуться в каталог</a></div>';
        window.scrollTo(0, 0);
      }).catch(function (err) {
        btn.disabled = false;
        fail(err.message === 'local'
          ? 'Форма заработает после загрузки сайта на хостинг (нужен файл order.php).'
          : 'Не получилось отправить заказ. Позвоните нам: ' + C.PHONE);
      });
    });
    function fail(t) { msg.className = 'form__msg err'; msg.textContent = t; }
    draw();
  }

  /* ---------- контакты на текстовых страницах ---------- */
  function fillContacts() {
    document.querySelectorAll('[data-c]').forEach(function (el) {
      var k = el.dataset.c, v = C[k] || '';
      if (k === 'PHONE') { el.textContent = v; el.href = 'tel:' + C.PHONE_RAW; }
      else if (k === 'EMAIL') { el.textContent = v; el.href = 'mailto:' + v; }
      else if (k === 'FREE') { el.textContent = money(C.FREE_DELIVERY_FROM); }
      else el.textContent = v;
    });
  }

  /* ---------- запуск ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var boot = document.getElementById('boot-msg'); if (boot) boot.remove();
    renderHeader();
    renderFooter();
    fillContacts();
    bindSubscribe();
    bindCardGalleries();
    var page = document.body.dataset.page;
    if (page === 'index') initIndex();
    if (page === 'catalog') initCatalog();
    if (page === 'product') initProduct();
    if (page === 'cart') initCart();
  });
})();
