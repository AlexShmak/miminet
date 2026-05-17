/**
 * Miminet front-end TypeScript entry point.
 *
 * Phase 2 placeholder: the build pipeline is wired up but no application
 * code has been migrated to TypeScript yet. The 13 classic scripts under
 * static/netfront/ and static/config_forms/ are still concatenated into
 * miminet.classic.js by the build plugin in vite.config.ts.
 *
 * Phase 3 will gradually move modules here, replacing window-global access
 * with proper ES imports.
 */

declare global {
  interface Window {
    miminetEntryLoaded?: boolean;
  }
}

window.miminetEntryLoaded = true;

export {};
