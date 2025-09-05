// app/boot-keymap.js — wire up safe accesskeys and hotkey nuke
import { observeAndRefreshKeys } from './keymap.js';
import { enableHotkeyNuke } from './hotkeys_nuke.js';

window.addEventListener('DOMContentLoaded', () => {
  // Kill legacy bare-letter shortcuts app-wide
  enableHotkeyNuke();
  // Apply and maintain safe accesskeys
  observeAndRefreshKeys();
  console.info('[Hotkeys] Safe Alt+ mapping applied; bare letters disabled.');
});
