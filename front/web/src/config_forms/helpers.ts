import { config_main_form_id } from "./common";

export const ConfigHostName = function (hostname) {

    var text = document.getElementById('config_host_name_script')!.innerHTML;

    $(config_main_form_id).prepend((text));
    $('#config_host_name').val(hostname);
}

export const ConfigRouterName = function (hostname) {

    var text = document.getElementById('config_router_name_script')!.innerHTML;

    $(config_main_form_id).prepend((text));
    $('#config_router_name').val(hostname);
}

export const ConfigServerName = function (hostname) {

    var text = document.getElementById('config_server_name_script')!.innerHTML;

    $(config_main_form_id).prepend((text));
    $('#config_server_name').val(hostname);
}

export const ConfigItemInterface = function (name, ip, netmask, connected_to, item) {

    let conf_item = 'config_' + item;
    let elem = document.getElementById(conf_item + '_interface_script');
    let eth = jQuery.extend({}, elem);

    if (!name) {
        return;
    }

    let ids = ["_iface_name_label_", "_iface_name_", "_ip_", "_mask_"];
    ids.forEach(function (id) {
        eth.innerHTML = eth.innerHTML.replace(RegExp(conf_item + id + 'example', "g"), conf_item + id + name);
    });

    let tag = '#' + conf_item;
    let text = eth.innerHTML;
    $(text).insertBefore(tag + '_end_form');

    $('<input type="hidden" name="' + conf_item + '_iface_ids[]" value="' + name + '"/>').insertBefore(tag + ids[1] + name);
    $(tag + ids[1] + name).attr("placeholder", connected_to);
    $(tag + ids[2] + name).val(ip);
    $(tag + ids[3] + name).val(netmask);

    if (Array.isArray(pcaps) && pcaps.includes(name)) {
        $(tag + '_iface_name_label_' + name).html('Линк к (<a href="/' + item + '/mimishark?guid=' + network_guid + '&iface=' + name + '" target="_blank">pcap</a>)');
    } else {
        console.warn('pcaps не определен или не является массивом:', pcaps);
    }
}

export const ConfigHostInterface = function (name, ip, netmask, connected_to) {
    ConfigItemInterface(name, ip, netmask, connected_to, "host");
}

export const ConfigRouterInterface = function (name, ip, netmask, connected_to) {
    ConfigItemInterface(name, ip, netmask, connected_to, "router");
}

export const ConfigServerInterface = function (name, ip, netmask, connected_to) {
    ConfigItemInterface(name, ip, netmask, connected_to, "server");
}

export const ConfigHubInterface = function (name, ip, netmask, connected_to) {
    ConfigItemInterface(name, ip, netmask, connected_to, "hub");
}

export const ConfigSwitchInterface = function (name, ip, netmask, connected_to) {
    ConfigItemInterface(name, ip, netmask, connected_to, "switch");
}

export const ConfigItemIndent = function (item) {
    let conf_item = 'config_' + item
    let text = document.getElementById(conf_item + '_indent_script')!.innerHTML;
    $(text).insertBefore('#' + conf_item + '_end_form');
}

export const ConfigHubIndent = function () {
    ConfigItemIndent("hub");
}

export const ConfigSwitchIndent = function () {
    ConfigItemIndent("switch");
}

export const addIpFieldHandlers = function () {
    document.addEventListener('input', function (e) {
        const input = e.target as HTMLInputElement;

        if (!input.matches('input[type="text"][id*="ip"], input[type="text"][name*="ip"], input[type="text"][id*="gw"], input[type="text"][name*="gw"]')) {
            return;
        }

        const newValue = input.value.replace(/,/g, '.').replace(/ю/g, '.');

        input.value = newValue;
    });
};

