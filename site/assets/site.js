/* Comfytosh Theme landing: flavor keys, copy to clipboard, port search and filters. */
(function () {
  'use strict';
  var root = document.documentElement;

  var toastEl = document.getElementById('toast'), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2000);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, fail) {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? ok() : fail(); } catch (e) { fail(e); }
      ta.remove();
    });
  }

  /* ── Flavor: Screen or Case, for the whole page ── */
  var flavorKeys = document.querySelectorAll('[data-flavor-set]');
  function setFlavor(f, save) {
    root.setAttribute('data-flavor', f);
    flavorKeys.forEach(function (k) { k.setAttribute('aria-pressed', String(k.getAttribute('data-flavor-set') === f)); });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', f === 'case' ? '#e3dac9' : '#282e2b');
    if (save) { try { localStorage.setItem('comfytosh-flavor', f); } catch (e) {} }
  }
  flavorKeys.forEach(function (k) { k.addEventListener('click', function () { setFlavor(k.getAttribute('data-flavor-set'), true); }); });
  setFlavor(root.getAttribute('data-flavor') === 'case' ? 'case' : 'screen', false);

  /* ── Copy: any value in the palette, or the whole palette as CSS ── */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = btn.getAttribute('data-copy');
      copy(v).then(function () { toast('Copied ' + v); }, function () { toast('Could not copy ' + v); });
    });
  });
  document.querySelectorAll('[data-copy-format="css"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      fetch('palette.json').then(function (r) { return r.json(); }).then(function (p) {
        var names = Object.keys(p.primitives);
        var css = ':root {\n' + names.map(function (n) { return '  --' + n + ': ' + p.primitives[n] + ';'; }).join('\n') + '\n}';
        return copy(css).then(function () { toast('Copied ' + names.length + ' colours as CSS'); });
      }).catch(function () { toast('Could not copy the palette'); });
    });
  });

  /* ── Ports: search, filter, a live count, and the state in the URL so a search can be shared ── */
  var search = document.getElementById('port-search');
  var keys = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var tiles = Array.prototype.slice.call(document.querySelectorAll('#port-grid .port'));
  var empty = document.getElementById('port-empty');
  var counter = document.getElementById('port-count');
  var filter = 'all';
  function syncUrl() {
    try {
      var u = new URL(location.href), q = (search && search.value || '').trim();
      if (q) u.searchParams.set('q', q); else u.searchParams.delete('q');
      if (filter !== 'all') u.searchParams.set('kind', filter); else u.searchParams.delete('kind');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {}
  }
  function apply() {
    var q = (search && search.value || '').trim().toLowerCase(), shown = 0;
    tiles.forEach(function (t) {
      var ok = (filter === 'all' || t.getAttribute('data-cat') === filter) && (!q || t.getAttribute('data-search').indexOf(q) !== -1);
      t.hidden = !ok; if (ok) shown++;
    });
    if (empty) empty.hidden = shown > 0;
    if (counter) counter.textContent = shown === tiles.length ? tiles.length + ' ports' : shown + ' of ' + tiles.length + ' ports';
    syncUrl();
  }
  function setFilter(key) {
    filter = keys.some(function (k) { return k.getAttribute('data-filter') === key; }) ? key : 'all';
    keys.forEach(function (k) { k.setAttribute('aria-pressed', String(k.getAttribute('data-filter') === filter)); });
  }
  keys.forEach(function (k) { k.addEventListener('click', function () { setFilter(k.getAttribute('data-filter')); apply(); }); });
  if (search) search.addEventListener('input', apply);
  try {
    var params = new URLSearchParams(location.search);
    if (params.get('q') && search) search.value = params.get('q');
    if (params.get('kind')) setFilter(params.get('kind'));
    if (params.get('q') || params.get('kind')) apply();
  } catch (e) {}
})();
