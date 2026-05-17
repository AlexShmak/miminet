/**
 * Re-expose ES-module exports as window globals so existing HTML
 * `onclick="ShowHostConfig(...)"` handlers still work after migration.
 *
 * Each migrated module should call `attachGlobals(import.meta.exports)`
 * or pass its exports here individually. Once all HTML is rewritten to
 * dispatch events / use addEventListener, this shim can be deleted.
 */

declare global {
  interface Window {
    [key: string]: unknown;
  }
}

/**
 * Attach a module's named exports onto `window` so legacy inline
 * `onclick="X(...)"` handlers keep resolving.
 */
export function attachGlobals(exports: Record<string, unknown>): void {
  for (const [name, value] of Object.entries(exports)) {
    if (name === "default" || name === "__esModule") continue;
    (window as Record<string, unknown>)[name] = value;
  }
}
