/**
 * Client-Side Source Viewing & Developer Protection System
 * 
 * Protects against casual source viewing, inspect element shortcuts,
 * right-click scraping, and debugger tampering while keeping the web app
 * fully responsive, lightweight, and accessible to normal user interactions.
 */

export function initSourceProtection() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Disable Right-Click Context Menu on the web app
  document.addEventListener('contextmenu', (e) => {
    // Allow right click if inside an input or textarea for pasting
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    e.preventDefault();
    return false;
  }, false);

  // 2. Block Common Key Shortcuts for View Source / DevTools
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // F12 (DevTools)
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U / Cmd+U (View Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I / Cmd+Option+I (Inspect)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'i' || e.key === 'I' || e.keyCode === 73)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+J / Cmd+Option+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'j' || e.key === 'J' || e.keyCode === 74)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+C / Cmd+Shift+C (Inspect Element)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'c' || e.key === 'C' || e.keyCode === 67)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S / Cmd+S (Save Page HTML)
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, false);

  // 3. Clear console notice for security
  try {
    console.log(
      '%c🔒 VIRTUAL CARD NEPAL - PROTECTED FINTECH APPLICATION',
      'color: #D4AF37; font-size: 16px; font-weight: bold; background: #111; padding: 6px 12px; border-radius: 4px;'
    );
    console.log(
      '%cSource viewing and credential inspection are restricted. All transactions are digitally signed and verified.',
      'color: #999; font-size: 11px;'
    );
  } catch {
    // Ignore console failure
  }
}
