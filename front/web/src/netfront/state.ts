// Migrated from front/src/static/netfront/state.js
//
// State vars are explicitly attached to `window` so unmigrated classic
// scripts (netfront.js, miminet_animation.js, config_vlan.js, etc.) can
// still resolve them via bare lookup, and the bridge in
// front/web/src/lib/state.ts keeps reading/writing the same locations.
// `attachGlobals` in main.ts also exposes HostUid/RouterUid/ServerUid/
// LINK_DOWN_JOB_ID/uid as window globals for the same reason.

window.SimulationId = 0;
window.global_cy = undefined;
window.global_eh = undefined;
window.NetworkUpdateTimeoutId = -1;
window.NetworkCache = [];
window.lastSimulationId = 0;

window.packetsNotFiltered = null;
window.packetFilterState = {
    hideARP: false,
    hideSTP: false,
    hideSYN: false,
};

window.gridCanvasLayer = undefined;
window.gridEnabled = true;
window.currentGridZoom = 1.0;

export const LINK_DOWN_JOB_ID = 6;

export const uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const HostUid = function () {
    const host_name = "host_";

    for (let host_number = 1; host_number < 100; host_number++) {
        const host = host_name + host_number;

        const t = nodes.find((target: any) => target.data.id === host);

        if (!t) {
            return host;
        }
    }

    return "host_" + uid();
};

export const RouterUid = function () {
    const host_name = "router_";

    for (let host_number = 1; host_number < 100; host_number++) {
        const host = host_name + host_number;

        const t = nodes.find((target: any) => target.data.id === host);

        if (!t) {
            return host;
        }
    }

    return "router_" + uid();
};

export const ServerUid = function () {
    const host_name = "server_";

    for (let host_number = 1; host_number < 100; host_number++) {
        const host = host_name + host_number;

        const t = nodes.find((target: any) => target.data.id === host);

        if (!t) {
            return host;
        }
    }

    return "server_" + uid();
};
