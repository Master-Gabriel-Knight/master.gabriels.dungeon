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

function shouldBlock(e) {
  // Do not block if any modifier key is held; we only block bare letters
  if (e.altKey || e.ctrlKey || e.metaKey) return false;
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