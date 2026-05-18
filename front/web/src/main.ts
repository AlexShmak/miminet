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

// config_forms — common.js exports the shared selectors and is imported
// first so its top-level jQuery `.load()` calls run before the rest.
import * as configFormsCommon from "./config_forms/common.js";
import * as configFormsDevice from "./config_forms/device.js";
import * as configFormsShared from "./config_forms/shared.js";
import * as configFormsHelpers from "./config_forms/helpers.js";
import * as configFormsJobs from "./config_forms/jobs.js";
import * as configFormsEditJobs from "./config_forms/edit_jobs.js";

attachGlobals(netfrontSimulation);
attachGlobals(configFormsCommon);
attachGlobals(configFormsDevice);
attachGlobals(configFormsShared);
attachGlobals(configFormsHelpers);
attachGlobals(configFormsJobs);
attachGlobals(configFormsEditJobs);

declare global {
  interface Window {
    miminetEntryLoaded?: boolean;
  }
}

window.miminetEntryLoaded = true;

export {};
