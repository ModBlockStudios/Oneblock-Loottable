/* ------------------------------------------------------------------ *
 * OneBlock Loot Table — catalogue des blocs & items Minecraft
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  const DATA_URL = './data/items.json';
  const BATCH = 120; // nombre de cartes ajoutées par lot (scroll infini)

  const els = {
    grid: document.getElementById('grid'),
    search: document.getElementById('search'),
    count: document.getElementById('result-count'),
    empty: document.getElementById('empty'),
    sentinel: document.getElementById('sentinel'),
    version: document.getElementById('mc-version'),
    appVersion: document.getElementById('app-version'),
    buildDate: document.getElementById('build-date'),
    chips: Array.from(document.querySelectorAll('.chip')),
  };

  /* ---------- Versioning visible ---------- */
  function renderAppVersion() {
    const info = window.APP_INFO || {};
    if (els.appVersion) els.appVersion.textContent = 'v' + (info.version || '?');
    if (els.buildDate) els.buildDate.textContent = info.buildDate || '?';
  }

  const state = {
    all: [],        // toutes les entrées
    filtered: [],   // entrées après recherche/filtre
    rendered: 0,    // combien sont déjà dans le DOM
    type: 'all',    // all | block | item
    query: '',
  };

  /* ---------- Chargement des données ---------- */
  async function load() {
    els.grid.innerHTML = '<div class="loading">Chargement du catalogue…</div>';
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      state.all = data.items || [];
      if (els.version) els.version.textContent = data.version || '';
      els.grid.innerHTML = '';
      applyFilters();
    } catch (err) {
      els.grid.innerHTML =
        '<div class="loading">Impossible de charger les données (' +
        String(err.message) +
        ').</div>';
    }
  }

  /* ---------- Filtrage ---------- */
  function applyFilters() {
    const q = state.query.trim().toLowerCase();
    state.filtered = state.all.filter((it) => {
      if (state.type !== 'all' && it.type !== state.type) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.displayName.toLowerCase().includes(q)
      );
    });

    els.grid.innerHTML = '';
    state.rendered = 0;
    els.count.textContent = state.filtered.length.toLocaleString('fr-FR');
    els.empty.hidden = state.filtered.length > 0;
    renderMore();
  }

  /* ---------- Rendu incrémental ---------- */
  function renderMore() {
    const next = state.filtered.slice(state.rendered, state.rendered + BATCH);
    if (next.length === 0) return;

    const frag = document.createDocumentFragment();
    for (const it of next) frag.appendChild(makeCard(it));
    els.grid.appendChild(frag);
    state.rendered += next.length;
  }

  function makeCard(it) {
    const card = document.createElement('div');
    card.className = 'card';
    card.title = 'Cliquer pour copier : minecraft:' + it.name;
    card.dataset.id = it.name;

    const badge = document.createElement('span');
    badge.className = 'card__badge card__badge--' + it.type;
    badge.textContent = it.type === 'block' ? 'bloc' : 'item';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card__img-wrap';
    if (it.icon) {
      const img = document.createElement('img');
      img.className = 'card__img';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = it.displayName;
      img.src = './assets/' + it.icon;
      img.addEventListener('error', () => {
        img.replaceWith(makeMissing());
      });
      imgWrap.appendChild(img);
    } else {
      imgWrap.appendChild(makeMissing());
    }

    const name = document.createElement('div');
    name.className = 'card__name';
    name.textContent = it.displayName;

    const id = document.createElement('div');
    id.className = 'card__id';
    id.textContent = it.name;

    card.append(badge, imgWrap, name, id);
    card.addEventListener('click', () => copyId(it.name));
    return card;
  }

  function makeMissing() {
    const ph = document.createElement('div');
    ph.className = 'card__img card__img--missing';
    return ph;
  }

  /* ---------- Copie d'identifiant ---------- */
  let toastEl = null;
  let toastTimer = null;
  function copyId(name) {
    const id = 'minecraft:' + name;
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = id;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).catch(fallback);
    } else {
      fallback();
    }
    showToast('Copié : ' + id);
  }

  function showToast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('toast--show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('toast--show'), 1400);
  }

  /* ---------- Événements ---------- */
  let searchTimer = null;
  els.search.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const v = e.target.value;
    searchTimer = setTimeout(() => {
      state.query = v;
      applyFilters();
    }, 120);
  });

  els.chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      els.chips.forEach((c) => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      state.type = chip.dataset.filter;
      applyFilters();
    });
  });

  // Scroll infini
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) renderMore();
    },
    { rootMargin: '600px' }
  );
  io.observe(els.sentinel);

  renderAppVersion();
  load();
})();
