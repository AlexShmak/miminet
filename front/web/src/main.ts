/**
 * Miminet front-end ES-module entry point.
 *
 * As each classic-script file under static/{netfront,config_forms}/ is
 * migrated to an ES module under web/src/, it gets imported here and
 * its exports are re-attached to `window` via `attachGlobals`, so
 * inline HTML `onclick="X(...)"` handlers and any remaining classic
 * scripts can still resolve the names.
 *
 * The unmigrated classic-script files are still concatenated into
 * miminet.classic.js by the build plugin in vite.config.ts. As more
 * modules move here, that list shrinks.
 */

import { attachGlobals } from "./lib/window-globals";

import * as netfrontSimulation from "./netfront/simulation.js";
import * as configFormsShared from "./config_forms/shared.js";

attachGlobals(netfrontSimulation);
attachGlobals(configFormsShared);

declare global {
  interface Window {
    miminetEntryLoaded?: boolean;
  }
}

window.miminetEntryLoaded = true;

export {};
