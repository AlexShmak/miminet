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

// icons must load early — its DiagramIcons map is read by network_ops.ts
// when prepareStylesheet() runs.
import * as libIcons from "./lib/icons.js";

// jwt_auth provides ajaxWithAuth / fetchWithAuth used by every ajax call.
import * as libJwtAuth from "./lib/jwt_auth.js";

// state.js initializes the window-level state variables that the bridge
// in lib/state.ts and unmigrated classic scripts depend on. Must run
// first so those values are set before anyone reads them.
import * as netfrontState from "./netfront/state.js";

import * as netfrontShowConfig from "./netfront/show_config.js";
import * as netfrontNetworkOps from "./netfront/network_ops.js";
import * as netfrontDraw from "./netfront/draw.js";
import * as netfrontSimulation from "./netfront/simulation.js";
import * as netfrontUpdateConfig from "./netfront/update_config.js";
import * as netfrontRuntime from "./netfront/runtime.js";

// Drag-and-drop wiring for device palette → cytoscape canvas. Runs its
// own jQuery DOM-ready callback on import.
import "./netfront/netfront.js";

// config_forms — common.js exports the shared selectors and is imported
// first so its top-level jQuery `.load()` calls run before the rest.
import * as configFormsCommon from "./config_forms/common.js";
import * as configFormsDevice from "./config_forms/device.js";
import * as configFormsShared from "./config_forms/shared.js";
import * as configFormsHelpers from "./config_forms/helpers.js";
import * as configFormsJobs from "./config_forms/jobs.js";
import * as configFormsEditJobs from "./config_forms/edit_jobs.js";

attachGlobals(libIcons);
attachGlobals(libJwtAuth);
attachGlobals(netfrontState);
attachGlobals(netfrontShowConfig);
attachGlobals(netfrontNetworkOps);
attachGlobals(netfrontDraw);
attachGlobals(netfrontSimulation);
attachGlobals(netfrontUpdateConfig);
attachGlobals(netfrontRuntime);
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
