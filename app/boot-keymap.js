// app/boot-keymap.js
import { observeAndRefreshKeys } from './keymap.js';
import { enableHotkeyNuke } from './hotkeys_nuke.js';

// Arm blocker immediately (module executes in <head>)
enableHotkeyNuke();

window.addEventListener('DOMContentLoaded', () => {
  observeAndRefreshKeys(); // maintains safe Alt+ accesskeys as DOM changes
});
