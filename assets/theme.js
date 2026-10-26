// StorkBuro — theme toggle (3-button segmented control).
//
// HTML contract:
//   #theme-toggle is a [role="radiogroup"] containing 3 [role="radio"]
//   buttons. Each button has [data-theme-value="auto"|"light"|"dark"] and
//   advertises its state via [aria-checked].
//
// Persistence:
//   localStorage["storkburo-theme"]
//     "light"|"dark"  → forced, overrides OS
//     absent          → auto (follows prefers-color-scheme)
//
// CSS contract:
//   :root[data-theme="dark"]                                 → forced dark
//   :root[data-theme="light"]                                → forced light
//   @media (prefers-color-scheme: dark)
//     :root:not([data-theme="light"])                        → OS-driven dark
//
// The matching FOWT-prevention snippet runs inline in <head> on every page so
// the [data-theme] attribute is set BEFORE first paint.

(function () {
  'use strict';

  var STORAGE_KEY = 'storkburo-theme';
  var root = document.documentElement;
  var group = document.getElementById('theme-toggle');
  if (!group) return;

  var buttons = Array.prototype.slice.call(
    group.querySelectorAll('[data-theme-value]')
  );
  if (!buttons.length) return;

  function readStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function writeStored(value) {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* private mode etc. — silently ignore */ }
  }

  function currentMode() {
    var stored = readStored();
    return (stored === 'light' || stored === 'dark') ? stored : 'auto';
  }

  function applyMode(mode) {
    if (mode === 'light' || mode === 'dark') {
      root.setAttribute('data-theme', mode);
      writeStored(mode);
    } else {
      root.removeAttribute('data-theme');
      writeStored(null);
    }
    syncButtons();
  }

  function syncButtons() {
    var mode = currentMode();
    buttons.forEach(function (btn) {
      var v = btn.getAttribute('data-theme-value');
      var checked = v === mode;
      btn.setAttribute('aria-checked', checked ? 'true' : 'false');
      // Only the active button is in the tab order — standard radiogroup pattern.
      btn.setAttribute('tabindex', checked ? '0' : '-1');
    });
  }

  // Click → apply that button's mode
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyMode(btn.getAttribute('data-theme-value'));
    });
  });

  // Keyboard nav: ArrowLeft/Up moves to previous, ArrowRight/Down to next,
  // Home jumps to first, End to last — WAI-ARIA radiogroup spec.
  group.addEventListener('keydown', function (e) {
    var key = e.key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' &&
        key !== 'ArrowUp' && key !== 'ArrowDown' &&
        key !== 'Home' && key !== 'End') return;

    e.preventDefault();
    var current = buttons.findIndex(function (b) {
      return b.getAttribute('aria-checked') === 'true';
    });
    if (current < 0) current = 0;

    var next;
    if (key === 'Home') next = 0;
    else if (key === 'End') next = buttons.length - 1;
    else if (key === 'ArrowLeft' || key === 'ArrowUp') next = (current - 1 + buttons.length) % buttons.length;
    else next = (current + 1) % buttons.length;

    applyMode(buttons[next].getAttribute('data-theme-value'));
    buttons[next].focus();
  });

  syncButtons();
})();
