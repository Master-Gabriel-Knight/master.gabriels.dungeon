// app/hotkeys_nuke.js — disable legacy bare-letter shortcuts globally (outside inputs)
const BARE_BLOCK = new Set(['b','m','g','p','!','i','r','e']);
let installed = false;

function isTypingTarget(t) {
  return /^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable;
}

export function enableHotkeyNuke() {
  if (installed) return;
  window.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return; // allow Alt/Ctrl/Meta combos
    const t = e.target;
    if (isTypingTarget(t)) return; // don't interfere with typing
    const k = (e.key || '').toLowerCase();
    if (BARE_BLOCK.has(k)) {
      // stop app-level handlers
      e.stopImmediatePropagation?.();
      e.stopPropagation?.();
      // prevent default if site was using accesskeys on bare letters
      // (Most bare-letter handlers are custom; preventDefault not strictly necessary.)
      // e.preventDefault?.();
      console.debug('[Hotkeys] Blocked bare key:', k);
    }
  }, true); // capture phase
  installed = true;
}
