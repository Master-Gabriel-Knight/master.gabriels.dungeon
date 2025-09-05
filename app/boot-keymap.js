// Boot script to reassign access keys, guard reserved combos, and nuke bare-letter hotkeys.
// This ensures that the letters in "iremember" are never bound to Alt+ shortcuts and that
// legacy single-letter hotkeys (e.g. 'b' for Breath) are suppressed at capture phase.

import { enableHotkeyNuke } from './hotkeys_nuke.js';

const RESERVED = new Set(['i','r','e','m','b']);

/**
 * Remove any existing accesskey attributes that clash with reserved letters.
 * This runs on DOMContentLoaded and can be called again after dynamic DOM changes.
 * @param {HTMLElement} root Element to search under
 */
function scrubAccessKeys(root = document) {
  root.querySelectorAll('[accesskey]').forEach((el) => {
    const k = (el.getAttribute('accesskey') || '').toLowerCase();
    if (RESERVED.has(k)) el.removeAttribute('accesskey');
  });
}

/**
 * Assign safe access keys to navigation and action controls.
 * Uses numbers and letters outside of "iremember" for combinations with Alt.
 */
function setAccessKeys() {
  // Main navigation: Sanctum, Global Gallery, Settings
  document.querySelector('[data-tab="sanctum"]')?.setAttribute('accesskey', 's');
  document.querySelector('[data-tab="gallery"]')?.setAttribute('accesskey', 'g');
  document.querySelector('[data-tab="settings"]')?.setAttribute('accesskey', 't');
  // Area sub-tabs: Lore, Gallery, Memories
  document.querySelector('#area-tabs [data-t="lore"]')?.setAttribute('accesskey', '1');
  document.querySelector('#area-tabs [data-t="gallery"]')?.setAttribute('accesskey', '2');
  document.querySelector('#area-tabs [data-t="mem"]')?.setAttribute('accesskey', '3');
  // Ritual buttons: begin, complete, back
  document.getElementById('begin-ritual')?.setAttribute('accesskey', 'f');
  document.getElementById('ritual-complete')?.setAttribute('accesskey', 'l');
  document.getElementById('back-sanctum')?.setAttribute('accesskey', 'z');
  // Upload/add buttons: global and area galleries, and area memories
  document.getElementById('gallery-upload-btn')?.setAttribute('accesskey', 'a');
  document.getElementById('area-upload-btn')?.setAttribute('accesskey', 'a');
  document.getElementById('am-save')?.setAttribute('accesskey', 'a');
  // Show/Hide toggles could be bound to 'h' if present
  document.getElementById('gallery-show-hidden')?.setAttribute('accesskey', 'h');
  document.getElementById('area-show-hidden')?.setAttribute('accesskey', 'h');
  // Export/import buttons in settings (if added)
  document.getElementById('btn-export')?.setAttribute('accesskey', 'x');
  document.getElementById('btn-import')?.setAttribute('accesskey', 'o');
}

/**
 * Prevent Alt+ keydown events for reserved letters from triggering custom logic.
 */
function guardReservedCombos() {
  window.addEventListener('keydown', (e) => {
    if (!e.altKey) return;
    const k = e.key.toLowerCase();
    if (RESERVED.has(k)) {
      // Let the browser handle the default; do not run any custom shortcuts.
      return;
    }
  }, true);
}

export function initKeyMap() {
  // Remove any conflicting accesskeys and apply our safe mapping
  scrubAccessKeys();
  setAccessKeys();
  guardReservedCombos();
}

// Immediately install the hotkey nuke so bare letters are suppressed before other listeners
enableHotkeyNuke();

// Automatically run on page load
document.addEventListener('DOMContentLoaded', () => {
  initKeyMap();
});