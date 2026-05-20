/**
 * Miminet front-end ES-module entry point.
 *
 * All modules are imported (and their side effects run) once when the
 * bundle loads. Modules talk to each other via explicit ESM imports —
 * nothing is sprinkled onto `window` except the small bare-name shim
 * in lib/initial_state.ts that the selenium fixture still depends on.
 *
 * Page-specific bootstrapping (which network mode to render, etc.) is
 * driven by `state.mode` and lives in lib/boot.ts.
 */

// Must run before any module reads from `state` — parses the
// `<script type="application/json" id="miminet-initial-state">` Jinja
// emits and seeds state.nodes/edges/jobs/packets/pcaps/network_guid/...
import "./lib/initial_state.js";

// Imported for side effects. Modules register their own DOM-ready
// handlers and event listeners; explicit ESM imports tie consumers
// to producers.
import "./lib/icons.js";
import "./lib/jwt_auth.js";
import "./netfront/state.js";
import "./netfront/show_config.js";
import "./netfront/network_ops.js";
import "./netfront/draw.js";
import "./netfront/simulation.js";
import "./netfront/update_config.js";
import "./netfront/runtime.js";
import "./netfront/packet_player.js";

// Drag-and-drop wiring for device palette → cytoscape canvas. Runs its
// own DOMContentLoaded callback on import.
import "./netfront/netfront.js";

// config_forms — common.ts kicks off top-level fetch() calls on import
// to load the device config form fragments.
import "./config_forms/common.js";
import "./config_forms/device.js";
import "./config_forms/shared.js";
import "./config_forms/helpers.js";
import "./config_forms/jobs.js";
import "./config_forms/edit_jobs.js";
import "./config_forms/stp.js";
import "./config_forms/vlan.js";
import "./config_forms/vxlan.js";

// Public API surface exposed on `window.miminet` for inline HTML
// scripts (quiz practice page, Yandex Metrica trackers, etc.).
import "./lib/api.js";

// Last: dispatches page-specific bootstrap based on state.mode and
// wires document-level event delegation for [data-action="..."]
// buttons. Runs on DOMContentLoaded.
import "./lib/boot.js";

declare global {
    interface Window {
        miminetEntryLoaded?: boolean;
    }
}

window.miminetEntryLoaded = true;

export {};
