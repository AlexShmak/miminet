/**
 * Miminet front-end ES-module entry point.
 *
 * All modules are imported (and their side effects run) once when the
 * bundle loads. Modules talk to each other via explicit ESM imports —
 * nothing is sprinkled onto `window` except the small bare-name shim
 * in shared/initial_state.ts that the selenium fixture still depends on.
 *
 * Page-specific bootstrapping (which network mode to render, etc.) is
 * driven by `state.mode` and lives in shared/boot.ts.
 */

// Must run before any module reads from `state` — parses the
// `<script type="application/json" id="miminet-initial-state">` Jinja
// emits and seeds state.nodes/edges/jobs/packets/pcaps/network_guid/...
import "./shared/initial_state.js";

// Imported for side effects. Modules register their own DOM-ready
// handlers and event listeners; explicit ESM imports tie consumers
// to producers.
import "./shared/icons.js";
import "./shared/jwt_auth.js";
import "./network-editor/state.js";
import "./device-config/show_config.js";
import "./network-editor/network_ops.js";
import "./network-editor/draw.js";
import "./simulation/simulation.js";
import "./device-config/update_config.js";
import "./network-editor/runtime.js";
import "./simulation/packet_player.js";

// Drag-and-drop wiring for device palette → cytoscape canvas. Runs its
// own DOMContentLoaded callback on import.
import "./network-editor/netfront.js";

// config_forms — common.ts kicks off top-level fetch() calls on import
// to load the device config form fragments.
import "./device-config/common.js";
import "./device-config/device.js";
import "./device-config/shared.js";
import "./device-config/helpers.js";
import "./device-config/jobs.js";
import "./device-config/edit_jobs.js";
import "./device-config/stp.js";
import "./device-config/vlan.js";
import "./device-config/vxlan.js";

// Public API surface exposed on `window.miminet` for inline HTML
// scripts (quiz practice page, Yandex Metrica trackers, etc.).
import "./shared/api.js";

// Last: dispatches page-specific bootstrap based on state.mode and
// wires document-level event delegation for [data-action="..."]
// buttons. Runs on DOMContentLoaded.
import "./shared/boot.js";

declare global {
    interface Window {
        miminetEntryLoaded?: boolean;
    }
}

window.miminetEntryLoaded = true;

export {};
