import { state } from "../lib/state";
import { createRoot, type Root } from "react-dom/client";
import {
    config_main_form_id,
    config_hub_main_form_id,
    config_switch_main_form_id,
    config_edge_main_form_id,
} from "./common";
import { DeviceNameField } from "../components/DeviceNameField";
import { EdgeEndpoints } from "../components/EdgeEndpoints";
import { EdgeNetworkIssues } from "../components/EdgeNetworkIssues";

// One persistent React root per device-name field. Re-created whenever
// the panel rebuilds; the previous root (if any) is unmounted first so
// React's bookkeeping doesn't leak between renders.
const nameRoots: Record<string, Root | null> = {
    host: null,
    router: null,
    server: null,
    hub: null,
    switch: null,
};

function mountDeviceNameField(
    device: keyof typeof nameRoots,
    formSelector: string,
    inputId: string,
    inputName: string,
    label: string,
    initialValue: string,
    wrapperId?: string
) {
    const existing = nameRoots[device];
    if (existing) {
        existing.unmount();
        nameRoots[device] = null;
    }
    const form = document.querySelector(formSelector);
    if (!form) {
        return;
    }
    // Drop any wrapper from a prior render so re-opening the panel
    // doesn't stack two of them.
    if (wrapperId) {
        document.getElementById(wrapperId)?.remove();
    }

    // Non-React wrapper — legacy code (ConfigRSTP/ConfigVLAN) appends
    // modal-trigger buttons here on top of the React-rendered children.
    const wrapper = document.createElement("div");
    if (wrapperId) {
        wrapper.id = wrapperId;
    }
    wrapper.className = "form-group pb-2";
    form.prepend(wrapper);

    const reactSlot = document.createElement("div");
    wrapper.appendChild(reactSlot);
    const root = createRoot(reactSlot);
    nameRoots[device] = root;
    root.render(
        <DeviceNameField
            inputId={inputId}
            inputName={inputName}
            label={label}
            initialValue={initialValue}
        />
    );
}

export const ConfigHostName = function (hostname: string) {
    mountDeviceNameField(
        "host",
        config_main_form_id,
        "config_host_name",
        "config_host_name",
        "Имя хоста",
        hostname
    );
};

export const ConfigRouterName = function (hostname: string) {
    mountDeviceNameField(
        "router",
        config_main_form_id,
        "config_router_name",
        "config_router_name",
        "Имя роутера",
        hostname
    );
};

export const ConfigServerName = function (hostname: string) {
    mountDeviceNameField(
        "server",
        config_main_form_id,
        "config_server_name",
        "config_server_name",
        "Имя сервера",
        hostname
    );
};

export const ConfigHubName = function (hostname: string) {
    mountDeviceNameField(
        "hub",
        config_hub_main_form_id,
        "config_hub_name",
        "config_hub_name",
        "Имя хаба",
        hostname
    );
};

export const ConfigSwitchName = function (hostname: string) {
    mountDeviceNameField(
        "switch",
        config_switch_main_form_id,
        // The switch markup historically gave the input id="switch_name"
        // (inconsistent with the other devices). Tests still target this
        // id; preserve it.
        "switch_name",
        "config_switch_name",
        "Имя Свитча",
        hostname,
        // ConfigRSTP/ConfigVLAN append their buttons to this wrapper id.
        "config_switch_name"
    );
};

// Edge config — separate React roots for each section so they can be
// re-rendered independently when the edge selection changes.
let edgeEndpointsRoot: Root | null = null;
let edgeIssuesRoot: Root | null = null;

export const ConfigEdgeEndpoints = function (edge_source: string, edge_target: string) {
    if (edgeEndpointsRoot) {
        edgeEndpointsRoot.unmount();
        edgeEndpointsRoot = null;
    }
    const form = document.querySelector(config_edge_main_form_id);
    if (!form) {
        return;
    }
    const container = document.createElement("div");
    container.id = "config_edge_endpoints_root";
    form.prepend(container);
    edgeEndpointsRoot = createRoot(container);
    edgeEndpointsRoot.render(<EdgeEndpoints source={edge_source} target={edge_target} />);
};

export const ConfigEdgeNetworkIssues = function (
    edge_loss: number | string,
    edge_duplicate: number | string
) {
    if (edgeIssuesRoot) {
        edgeIssuesRoot.unmount();
        edgeIssuesRoot = null;
    }
    const form = document.querySelector(config_edge_main_form_id);
    if (!form) {
        return;
    }
    const container = document.createElement("div");
    container.id = "config_edge_network_issues_root";
    form.prepend(container);
    edgeIssuesRoot = createRoot(container);
    edgeIssuesRoot.render(<EdgeNetworkIssues loss={edge_loss} duplicate={edge_duplicate} />);
};

export const ConfigItemInterface = function (
    name: string,
    ip: any,
    netmask: any,
    connected_to: string,
    item: string
) {
    if (!name) {
        return;
    }

    const conf_item = "config_" + item;
    const elem = document.getElementById(conf_item + "_interface_script");
    if (!elem) {
        return;
    }
    let html = elem.innerHTML;

    const ids = ["_iface_name_label_", "_iface_name_", "_ip_", "_mask_"];
    ids.forEach(function (id) {
        html = html.replace(RegExp(conf_item + id + "example", "g"), conf_item + id + name);
    });

    const endForm = document.getElementById(conf_item + "_end_form");
    if (!endForm || !endForm.parentNode) {
        return;
    }
    const tmpl = document.createElement("template");
    tmpl.innerHTML = html;
    endForm.parentNode.insertBefore(tmpl.content, endForm);

    const ifaceNameField = document.getElementById(conf_item + ids[1] + name);
    if (ifaceNameField && ifaceNameField.parentNode) {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = conf_item + "_iface_ids[]";
        hidden.value = name;
        ifaceNameField.parentNode.insertBefore(hidden, ifaceNameField);
        (ifaceNameField as HTMLInputElement).placeholder = connected_to;
    }
    const ipField = document.getElementById(conf_item + ids[2] + name) as HTMLInputElement | null;
    if (ipField) ipField.value = ip;
    const maskField = document.getElementById(conf_item + ids[3] + name) as HTMLInputElement | null;
    if (maskField) maskField.value = netmask;

    if (Array.isArray(state.pcaps) && state.pcaps.includes(name)) {
        const label = document.getElementById(conf_item + "_iface_name_label_" + name);
        if (label) {
            label.innerHTML =
                'Линк к (<a href="/' +
                item +
                "/mimishark?guid=" +
                state.network_guid +
                "&iface=" +
                name +
                '" target="_blank">pcap</a>)';
        }
    } else {
        console.warn("state.pcaps не определен или не является массивом:", state.pcaps);
    }
};

export const ConfigHostInterface = function (
    name: string,
    ip: any,
    netmask: any,
    connected_to: string
) {
    ConfigItemInterface(name, ip, netmask, connected_to, "host");
};

export const ConfigRouterInterface = function (
    name: string,
    ip: any,
    netmask: any,
    connected_to: string
) {
    ConfigItemInterface(name, ip, netmask, connected_to, "router");
};

export const ConfigServerInterface = function (
    name: string,
    ip: any,
    netmask: any,
    connected_to: string
) {
    ConfigItemInterface(name, ip, netmask, connected_to, "server");
};

export const ConfigHubInterface = function (
    name: string,
    ip: any,
    netmask: any,
    connected_to: string
) {
    ConfigItemInterface(name, ip, netmask, connected_to, "hub");
};

export const ConfigSwitchInterface = function (
    name: string,
    ip: any,
    netmask: any,
    connected_to: string
) {
    ConfigItemInterface(name, ip, netmask, connected_to, "switch");
};

export const ConfigItemIndent = function (item: string) {
    const conf_item = "config_" + item;
    const scriptEl = document.getElementById(conf_item + "_indent_script");
    const endForm = document.getElementById(conf_item + "_end_form");
    if (!scriptEl || !endForm || !endForm.parentNode) return;
    const tmpl = document.createElement("template");
    tmpl.innerHTML = scriptEl.innerHTML;
    endForm.parentNode.insertBefore(tmpl.content, endForm);
};

export const ConfigHubIndent = function () {
    ConfigItemIndent("hub");
};

export const ConfigSwitchIndent = function () {
    ConfigItemIndent("switch");
};

export const addIpFieldHandlers = function () {
    document.addEventListener("input", function (e: any) {
        const input = e.target as HTMLInputElement;

        if (
            !input.matches(
                'input[type="text"][id*="ip"], input[type="text"][name*="ip"], input[type="text"][id*="gw"], input[type="text"][name*="gw"]'
            )
        ) {
            return;
        }

        const newValue = input.value.replace(/,/g, ".").replace(/ю/g, ".");

        input.value = newValue;
    });
};
