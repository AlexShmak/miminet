// Reads the per-page initial state from the
// `<script type="application/json" id="miminet-initial-state">` block
// that Jinja templates emit on network pages.
//
// Side-effect import — runs once at bundle load, populates the `state`
// object before any consumer reads from it. Pages without that script
// tag (login, admin, etc.) get no-op behaviour.

import { state } from "./state";

interface InitialStatePayload {
    nodes?: any[];
    edges?: any[];
    jobs?: any[];
    packets?: any;
    pcaps?: string[];
    network_guid?: string;
    csrf_token?: string;
    network_title?: string;
    network_description?: string;
    network_zoom?: number;
    network_pan_x?: number;
    network_pan_y?: number;
}

function readInitialState(): InitialStatePayload | null {
    const el = document.getElementById("miminet-initial-state");
    if (!el || !el.textContent) {
        return null;
    }
    try {
        return JSON.parse(el.textContent) as InitialStatePayload;
    } catch (e) {
        console.error("Failed to parse #miminet-initial-state JSON:", e);
        return null;
    }
}

const payload = readInitialState();

if (payload) {
    if (payload.nodes !== undefined) state.nodes = payload.nodes;
    if (payload.edges !== undefined) state.edges = payload.edges;
    if (payload.jobs !== undefined) state.jobs = payload.jobs;
    if (payload.packets !== undefined) state.packets = payload.packets;
    if (payload.pcaps !== undefined) state.pcaps = payload.pcaps;
    if (payload.network_guid !== undefined) state.network_guid = payload.network_guid;
    if (payload.csrf_token !== undefined) state.csrf_token = payload.csrf_token;
    if (payload.network_title !== undefined) state.network_title = payload.network_title;
    if (payload.network_description !== undefined)
        state.network_description = payload.network_description;
    if (payload.network_zoom !== undefined) state.network_zoom = payload.network_zoom;
    if (payload.network_pan_x !== undefined) state.network_pan_x = payload.network_pan_x;
    if (payload.network_pan_y !== undefined) state.network_pan_y = payload.network_pan_y;
}

// Compatibility shim: re-expose state.X under bare-global names on
// `window` for consumers that still reach for the originals via
// `selenium.execute_script("return nodes")` and similar. Each getter/
// setter forwards to the live state object so the test sees the same
// mutations the bundle made.
//
// Phase 9 will remove these — at which point the selenium fixture must
// switch to `return window.state.nodes` (or similar).
const w = window as Window & Record<string, unknown>;
const shimmed = [
    "nodes",
    "edges",
    "jobs",
    "packets",
    "pcaps",
    "network_guid",
    "csrf_token",
    "network_title",
    "network_description",
    "network_zoom",
    "network_pan_x",
    "network_pan_y",
] as const;
for (const name of shimmed) {
    Object.defineProperty(w, name, {
        configurable: true,
        get: () => (state as any)[name],
        set: (v) => {
            (state as any)[name] = v;
        },
    });
}
