// hotkeys_nuke.js
// Capture‑phase blocker to suppress bare‑letter hotkeys that conflict with "iremember"
// This module exports a single function, enableHotkeyNuke, which attaches
// handlers for keydown/keypress/keyup events. If a bare letter (no
// modifier keys) from the reserved list is pressed, the event is
// canceled at capture phase so no other listener sees it. This prevents
// legacy handlers (e.g. breath start on 'b') from firing.

const BARE_BLOCK = new Set(['b','m','g','p','!','i','r','e']);
let installed = false;

function isTypingTarget(t) {
  return /^(input|textarea|select)$/i.test(t?.tagName || '') || (t && t.isContentEditable);
}

// Determine if a target element lives inside the password/lock overlay. When true, we do
// not block any keys so that unlocking via click or Enter still works. The lock overlay
// may have id="lock" or "overlay-lock", or carry a 'lock' class or data-lock attribute.
function insideLock(target) {
  try {
    let el = target;
    while (el && el !== document) {
      if (el.id === 'lock' || el.id === 'overlay-lock') return true;
      if (typeof el.classList?.contains === 'function' && el.classList.contains('lock')) return true;
      if (el.hasAttribute && (el.hasAttribute('data-lock') || el.getAttribute('data-lock') !== null)) return true;
      el = el.parentNode;
    }
  } catch (_) {
    /* noop */
  }
  return false;
}

function shouldBlock(e) {
  // Do not block if any modifier key is held; we only block bare letters
  if (e.altKey || e.ctrlKey || e.metaKey) return false;
  // Allow all keys inside the lock overlay to permit typing the password and clicking Unlock
  if (insideLock(e.target)) return false;
  if (isTypingTarget(e.target)) return false;
  const k = (e.key || '').toLowerCase();
  if (BARE_BLOCK.has(k)) return true;
  // Extra checks for 'B' across different properties (for robustness)
  if (e.code === 'KeyB' || e.keyCode === 66 || e.which === 66 || e.charCode === 98) return true;
  return false;
}

function blockEvent(e) {
  if (!shouldBlock(e)) return;
  // Prevent default behavior and stop all other listeners
  e.stopImmediatePropagation?.();
  e.stopPropagation?.();
  e.preventDefault?.();
  e.returnValue = false;
}

export function enableHotkeyNuke() {
  if (installed) return;
  const types = ['keydown', 'keypress', 'keyup'];
  const targets = [window, document, document.documentElement];
  types.forEach(type => {
    targets.forEach(t => {
      t.addEventListener(type, blockEvent, true);
    });
  });
  installed = true;
}