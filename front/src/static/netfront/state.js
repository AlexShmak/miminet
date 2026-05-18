// State vars declared with `var` so the bindings become properties on
// `window`. This is the source of truth for the bridge in
// front/web/src/lib/state.ts, which proxies state.X to window.X.
var SimulationId = 0;
var global_cy = undefined;
var global_eh = undefined;
var NetworkUpdateTimeoutId = -1;
var NetworkCache = [];
var lastSimulationId = 0;

var packetsNotFiltered = null;
var packetFilterState = {
    hideARP: false,
    hideSTP: false,
    hideSYN: false,
};

const LINK_DOWN_JOB_ID = 6;

var gridCanvasLayer = undefined;
var gridEnabled = true;
var currentGridZoom = 1.0;

const uid = function(){
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const HostUid = function(){

    let host_name = "host_";

    for (let host_number = 1; host_number < 100; host_number++) {
        host = host_name + host_number;

        t = nodes.find(t => t.data.id === host);

        if (!t)
        {
            return host;
        }
    }

    return "host_" + uid();
}

const RouterUid = function(){

    let host_name = "router_";

    for (let host_number = 1; host_number < 100; host_number++) {
        host = host_name + host_number;

        t = nodes.find(t => t.data.id === host);

        if (!t)
        {
            return host;
        }
    }

    return "router_" + uid();
}

const ServerUid = function(){

    let host_name = "server_";

    for (let host_number = 1; host_number < 100; host_number++) {
        host = host_name + host_number;

        let t = nodes.find(t => t.data.id === host);

        if (!t)
        {
            return host;
        }
    }

    return "server_" + uid();
}

