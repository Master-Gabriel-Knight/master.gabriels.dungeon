// app/hotkeys_nuke.js — aggressive bare-letter blocker (B included)
const BARE_BLOCK = new Set(['b','m','g','p','!','i','r','e']); // protect "iremember" too
let installed = false;

function isTypingTarget(t) {
  return /^(input|textarea|select)$/i.test(t?.tagName || '') || (t && t.isContentEditable);
}

function shouldBlock(e) {
  if (e.altKey || e.ctrlKey || e.metaKey) return false;      // allow combos
  if (isTypingTarget(e.target)) return false;                 // don't interfere with typing
  const k = (e.key || '').toLowerCase();
  if (BARE_BLOCK.has(k)) return true;
  // extra insurance for 'B' across old APIs
  return e.code === 'KeyB' || e.keyCode === 66 || e.which === 66 || e.charCode === 98;
}

function blockEvent(e) {
  if (!shouldBlock(e)) return;
  e.stopImmediatePropagation?.();
  e.stopPropagation?.();
  e.preventDefault?.();
  e.returnValue = false;
}

export function enableHotkeyNuke() {
  if (installed) return;
  const types = ['keydown','keypress','keyup'];
  const targets = [window, document, document.documentElement];
  types.forEach(type => targets.forEach(t => t.addEventListener(type, blockEvent, true))); // capture
  installed = true;
}
