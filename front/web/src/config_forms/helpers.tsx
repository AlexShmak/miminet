import { state } from "../lib/state";
import { createRoot, type Root } from "react-dom/client";
import { config_main_form_id } from "./common";
import { HostNameField } from "../components/HostNameField";

// React root for the HostNameField pilot. Re-created whenever the host
// config panel is rebuilt; the previous root (if any) is unmounted so
// React's bookkeeping doesn't leak between renders.
let hostNameRoot: Root | null = null;

export const ConfigHostName = function (hostname: string) {
    if (hostNameRoot) {
        hostNameRoot.unmount();
        hostNameRoot = null;
    }
    const container = document.createElement("div");
    container.id = "config_host_name_root";
    const form = document.querySelector(config_main_form_id);
    if (!form) {
        return;
    }
    form.prepend(container);
    hostNameRoot = createRoot(container);
    hostNameRoot.render(<HostNameField initialValue={hostname} />);
};

export const ConfigRouterName = function (hostname: string) {
    const text = document.getElementById("config_router_name_script")!.innerHTML;

    $(config_main_form_id).prepend(text);
    $("#config_router_name").val(hostname);
};

export const ConfigServerName = function (hostname: string) {
    const text = document.getElementById("config_server_name_script")!.innerHTML;

    $(config_main_form_id).prepend(text);
    $("#config_server_name").val(hostname);
};

export const ConfigItemInterface = function (
    name: string,
    ip: any,
    netmask: any,
    connected_to: string,
    item: string
) {
    const conf_item = "config_" + item;
    const elem = document.getElementById(conf_item + "_interface_script");
    const eth = jQuery.extend({}, elem);

    if (!name) {
        return;
    }

    const ids = ["_iface_name_label_", "_iface_name_", "_ip_", "_mask_"];
    ids.forEach(function (id) {
        eth.innerHTML = eth.innerHTML.replace(
            RegExp(conf_item + id + "example", "g"),
            conf_item + id + name
        );
    });

    const tag = "#" + conf_item;
    const text = eth.innerHTML;
    $(text).insertBefore(tag + "_end_form");

    $(
        '<input type="hidden" name="' + conf_item + '_iface_ids[]" value="' + name + '"/>'
    ).insertBefore(tag + ids[1] + name);
    $(tag + ids[1] + name).attr("placeholder", connected_to);
    $(tag + ids[2] + name).val(ip);
    $(tag + ids[3] + name).val(netmask);

    if (Array.isArray(state.pcaps) && state.pcaps.includes(name)) {
        $(tag + "_iface_name_label_" + name).html(
            'Линк к (<a href="/' +
                item +
                "/mimishark?guid=" +
                state.network_guid +
                "&iface=" +
                name +
                '" target="_blank">pcap</a>)'
        );
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
    const text = document.getElementById(conf_item + "_indent_script")!.innerHTML;
    $(text).insertBefore("#" + conf_item + "_end_form");
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
