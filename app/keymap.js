// app/keymap.js — safe accesskeys only (no 'iremember' letters)
const RESERVED = new Set(['i','r','e','m','b']); // letters in "iremember"

export function scrubAccessKeys(root = document) {
  root.querySelectorAll('[accesskey]').forEach(el => {
    const k = (el.getAttribute('accesskey') || '').toLowerCase();
    if (RESERVED.has(k)) el.removeAttribute('accesskey');
  });
}

export function setAccessKeys() {
  // main nav
  document.querySelector('#nav-sanctum')?.setAttribute('accesskey', 's');
  document.querySelector('#nav-gallery')?.setAttribute('accesskey', 'g');
  document.querySelector('#nav-settings')?.setAttribute('accesskey', 't');

  // area tabs
  document.querySelector('[role="tab"][data-tab="lore"]')?.setAttribute('accesskey', '1');
  document.querySelector('[role="tab"][data-tab="gallery"]')?.setAttribute('accesskey', '2');
  document.querySelector('[role="tab"][data-tab="mem"]')?.setAttribute('accesskey', '3');

  // ritual / area actions
  document.getElementById('begin-ritual')?.setAttribute('accesskey', 'f'); // Flame
  document.getElementById('ritual-complete')?.setAttribute('accesskey', 'l'); // compLete
  document.getElementById('area-back')?.setAttribute('accesskey', 'z'); // back

  // data ops
  document.getElementById('btn-export')?.setAttribute('accesskey', 'x');
  document.getElementById('btn-import')?.setAttribute('accesskey', 'o');

  // galleries & memories
  document.getElementById('global-add')?.setAttribute('accesskey', 'a');
  document.getElementById('area-add')?.setAttribute('accesskey', 'a');
  document.getElementById('area-mem-form')?.setAttribute('accesskey', 'a');
  document.getElementById('global-show-hidden')?.setAttribute('accesskey', 'h');
  document.getElementById('area-show-hidden')?.setAttribute('accesskey', 'h');
}

export function observeAndRefreshKeys(root = document.body) {
  const refresh = () => { scrubAccessKeys(); setAccessKeys(); };
  const mo = new MutationObserver(() => refresh());
  mo.observe(root, { childList: true, subtree: true });
  refresh();
  return mo;
}
