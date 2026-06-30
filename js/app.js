/* ------------------------------------------------------------------ *
 * OneBlock Loot Table — catalogue des blocs & items Minecraft Bedrock
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  const DATA_URL = './data/items.json';
  const BATCH = 150; // nombre de lignes ajoutées par lot (scroll infini)

  // Libellés affichés pour chaque catégorie
  const CATEGORY_LABEL = {
    full_block: 'Full Block',
    decoration_block: 'Decoration',
    item: 'Item',
  };

  const els = {
    rows: document.getElementById('rows'),
    search: document.getElementById('search'),
    count: document.getElementById('result-count'),
    empty: document.getElementById('empty'),
    sentinel: document.getElementById('sentinel'),
    version: document.getElementById('mc-version'),
    appVersion: document.getElementById('app-version'),
    buildDate: document.getElementById('build-date'),
    chips: Array.from(document.querySelectorAll('.chip')),
  };

  const state = {
    all: [],
    filtered: [],
    rendered: 0,
    category: 'all', // all | full_block | decoration_block | item
    query: '',
  };

  /* ---------- Versioning visible ---------- */
  function renderAppVersion() {
    const info = window.APP_INFO || {};
    if (els.appVersion) els.appVersion.textContent = 'v' + (info.version || '?');
    if (els.buildDate) els.buildDate.textContent = info.buildDate || '?';
  }

  /* ---------- Chargement des données ---------- */
  async function load() {
    els.rows.innerHTML =
      '<tr><td colspan="5" class="loading">Chargement du catalogue…</td></tr>';
    try {
      // ?v= : force le rechargement du JSON après une mise à jour (cache-busting)
      const bust = (window.APP_INFO && window.APP_INFO.version) || '';
      const res = await fetch(DATA_URL + '?v=' + bust);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      state.all = data.items || [];
      if (els.version) {
        els.version.textContent = (data.edition || '') + ' ' + (data.version || '');
      }
      applyFilters();
    } catch (err) {
      els.rows.innerHTML =
        '<tr><td colspan="5" class="loading">Impossible de charger les données (' +
        String(err.message) +
        ').</td></tr>';
    }
  }

  /* ---------- Filtrage ---------- */
  function applyFilters() {
    const q = state.query.trim().toLowerCase();
    state.filtered = state.all.filter((it) => {
      if (state.category !== 'all' && it.category !== state.category) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.displayName.toLowerCase().includes(q)
      );
    });

    els.rows.innerHTML = '';
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
    for (const it of next) frag.appendChild(makeRow(it));
    els.rows.appendChild(frag);
    state.rendered += next.length;
  }

  function makeRow(it) {
    const tr = document.createElement('tr');
    tr.dataset.id = it.name;
    tr.title = 'Cliquer pour copier : minecraft:' + it.name;

    // Icône
    const tdIcon = document.createElement('td');
    tdIcon.className = 'col-icon';
    if (it.icon) {
      const img = document.createElement('img');
      img.className = 'cell-icon';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = '';
      img.src = './assets/' + it.icon;
      img.addEventListener('error', () => img.replaceWith(makeMissing()));
      tdIcon.appendChild(img);
    } else {
      tdIcon.appendChild(makeMissing());
    }

    // Nom
    const tdName = document.createElement('td');
    tdName.className = 'cell-name';
    tdName.textContent = it.displayName;

    // Identifiant Bedrock
    const tdId = document.createElement('td');
    tdId.className = 'cell-id';
    const ns = document.createElement('span');
    ns.className = 'ns';
    ns.textContent = 'minecraft:';
    tdId.append(ns, document.createTextNode(it.name));

    // Catégorie
    const tdCat = document.createElement('td');
    tdCat.className = 'cell-cat';
    const badge = document.createElement('span');
    badge.className = 'cat-badge cat-badge--' + it.category;
    badge.textContent = CATEGORY_LABEL[it.category] || it.category;
    tdCat.appendChild(badge);

    // Taille de pile
    const tdStack = document.createElement('td');
    tdStack.className = 'col-stack cell-stack';
    tdStack.textContent = it.stackSize;

    tr.append(tdIcon, tdName, tdId, tdCat, tdStack);
    tr.addEventListener('click', () => copyId(it.name));
    return tr;
  }

  function makeMissing() {
    const ph = document.createElement('span');
    ph.className = 'cell-icon cell-icon--missing';
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
      state.category = chip.dataset.filter;
      applyFilters();
    });
  });

  // Scroll infini
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) renderMore();
    },
    { rootMargin: '700px' }
  );
  io.observe(els.sentinel);

  renderAppVersion();
  load();
})();
