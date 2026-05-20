import { state } from "../lib/state";
import { UpdateJobCounter, config_content_id, config_content_save_tag } from "./common";
import {
    DeleteJobFromHost,
    DeleteJobFromRouter,
    DeleteJobFromSwitch,
    DeleteJobFromServer,
} from "../netfront/update_config";
import { EditJobInHost, EditJobInRouter, EditJobInSwitch, EditJobInServer } from "./edit_jobs";

const removeBySelector = (selector: string) => {
    document.querySelectorAll(selector).forEach((el) => el.remove());
};

const insertHtmlBefore = (html: string, target: Element | null) => {
    if (!target || !target.parentNode) return;
    const tmpl = document.createElement("template");
    tmpl.innerHTML = html;
    target.parentNode.insertBefore(tmpl.content, target);
};

const disableInputsIn = (root: Element | Document, exceptSelector: string = "") => {
    root.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement
    >("input, select, textarea, button").forEach((el) => {
        if (exceptSelector && el.matches(exceptSelector)) return;
        el.disabled = true;
    });
};

export const UpdateHostForm = function (name: string) {
    const elem = document.getElementById(name)!.innerHTML;
    const host_job_list = document.getElementById("config_host_job_list");

    if (!elem || !host_job_list) {
        return;
    }

    removeBySelector('div[name="config_host_select_input"]');
    insertHtmlBefore(elem, host_job_list);
};

export const ConfigHostJobOnChange = function (evnt: any) {
    switch (evnt.target.value) {
        case "1":
            UpdateHostForm("config_host_ping_c_1_script");
            break;

        case "2":
            UpdateHostForm("config_host_ping_with_options_script");
            break;

        case "3":
            UpdateHostForm("config_host_send_udp_data_script");
            break;

        case "4":
            UpdateHostForm("config_host_send_tcp_data_script");
            break;

        case "5":
            UpdateHostForm("config_host_traceroute_with_options_script");
            break;

        case "102":
            UpdateHostForm("config_host_add_route_script");
            break;

        case "103":
            UpdateHostForm("config_host_add_arp_cache_script");
            break;

        case "108":
            UpdateHostForm("config_host_add_dhclient");
            FillDeviceSelectIntf(
                "#config_host_add_dhclient_interface_select_iface_field",
                "#host_id",
                "Выберите линк",
                false
            );
            break;

        case "0":
            removeBySelector('div[name="config_host_select_input"]');
            break;

        default:
            console.log("Unknown target.value");
    }
};

const buildJobElemHtml = (
    templateId: string,
    deleteIdPrefix: string,
    editIdPrefix: string,
    jid: any,
    printCmd: string
): string | null => {
    const src = document.getElementById(templateId);
    if (!src) return null;
    let html = src.innerHTML;
    html = html.replace(new RegExp(deleteIdPrefix, "g"), deleteIdPrefix + "_" + jid);
    html = html.replace(new RegExp(editIdPrefix, "g"), editIdPrefix + "_" + jid);
    html = html.replace(
        /justify-content-between align-items-center">/,
        'justify-content-between align-items-center"><small>' + printCmd + "</small>"
    );
    return html;
};

export const ConfigHostJob = function (host_jobs: any[], shared: number = 0) {
    let elem: any = document.getElementById("config_host_job_script")!.innerHTML;
    const host_id = document.getElementById("host_id") as HTMLInputElement | null;

    if (!elem || !host_id) {
        return;
    }

    insertHtmlBefore(elem, host_id);

    document
        .getElementById("config_host_job_select_field")!
        .addEventListener("change", ConfigHostJobOnChange);

    UpdateJobCounter("config_host_job_counter", host_id.value);

    elem = document.getElementById("config_host_job_list_script")!.innerHTML;
    if (!elem) {
        return;
    }

    insertHtmlBefore(elem, host_id);

    if (!host_jobs) {
        return;
    }

    host_jobs.forEach((_item: any, i: number) => {
        const jid = host_jobs[i].id;
        const list = document.getElementById("config_host_job_list");
        if (!list) return;

        if (i == 0) {
            list.insertAdjacentHTML("beforeend", '<label class="text-sm">Команды</label>');
        }

        const html = buildJobElemHtml(
            "config_host_job_list_elem_script",
            "config_host_job_delete",
            "config_host_job_edit",
            jid,
            host_jobs[i].print_cmd
        );
        if (!html) return;
        list.insertAdjacentHTML("beforeend", html);

        document
            .getElementById("config_host_job_delete_" + jid)
            ?.addEventListener("click", (event: Event) => {
                event.preventDefault();
                if (!shared) {
                    DeleteJobFromHost(host_id.value, jid, state.network_guid);
                }
            });

        document
            .getElementById("config_host_job_edit_" + jid)
            ?.addEventListener("click", (event: Event) => {
                event.preventDefault();
                if (!shared) {
                    EditJobInHost(host_id.value, jid, state.network_guid);
                }
            });
    });
};

const setGatewayValue = (id: string, value: string) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = value;
};

export const ConfigHostGateway = function (gw: string) {
    const text = document.getElementById("config_host_default_gw_script")!.innerHTML;
    insertHtmlBefore(text, document.getElementById("config_host_end_form"));
    setGatewayValue("config_host_default_gw", gw);
};

export const ConfigRouterGateway = function (gw: string) {
    const text = document.getElementById("config_router_default_gw_script")!.innerHTML;
    insertHtmlBefore(text, document.getElementById("config_router_end_form"));
    setGatewayValue("config_router_default_gw", gw);
};

export const ConfigServerGateway = function (gw: string) {
    const text = document.getElementById("config_server_default_gw_script")!.innerHTML;
    insertHtmlBefore(text, document.getElementById("config_server_end_form"));
    setGatewayValue("config_server_default_gw", gw);
};

export const UpdateSwitchForm = function (name: string) {
    const elem = document.getElementById(name)!.innerHTML;
    const switch_job_list = document.getElementById("config_switch_job_list");

    if (!elem || !switch_job_list) {
        return;
    }

    removeBySelector('div[name="config_switch_select_input"]');
    insertHtmlBefore(elem, switch_job_list);
};

export const ConfigSwitchJobOnChange = function (evnt: any) {
    switch (evnt.target.value) {
        case "0":
            removeBySelector('div[name="config_switch_select_input"]');
            break;
        case "6":
            UpdateSwitchForm("config_switch_link_down_script");
            FillDeviceSelectIntf(
                "#config_switch_link_down_iface_select_field",
                "#switch_id",
                "Выберите линк",
                false
            );
            break;
        case "7":
            UpdateSwitchForm("config_switch_sleep_script");
    }
};
export const ConfigSwitchJob = function (switch_jobs: any[], shared: number = 0) {
    let elem: any = document.getElementById("config_switch_job_script")!.innerHTML;
    const switch_id = document.getElementById("switch_id") as HTMLInputElement | null;

    if (!elem || !switch_id) {
        return;
    }

    insertHtmlBefore(elem, switch_id);

    document
        .getElementById("config_switch_job_select_field")!
        .addEventListener("change", ConfigSwitchJobOnChange);

    UpdateJobCounter("config_switch_job_counter", switch_id.value);

    elem = document.getElementById("config_switch_job_list_script")!.innerHTML;
    if (!elem) {
        return;
    }

    insertHtmlBefore(elem, switch_id);

    if (!switch_jobs) {
        return;
    }

    switch_jobs.forEach((_item: any, i: number) => {
        const jid = switch_jobs[i].id;
        const list = document.getElementById("config_switch_job_list");
        if (!list) return;

        if (i == 0) {
            list.insertAdjacentHTML("beforeend", '<label class="text-sm">Команды</label>');
        }

        const html = buildJobElemHtml(
            "config_switch_job_list_elem_script",
            "config_switch_job_delete",
            "config_switch_job_edit",
            jid,
            switch_jobs[i].print_cmd
        );
        if (!html) return;
        list.insertAdjacentHTML("beforeend", html);

        document
            .getElementById("config_switch_job_delete_" + jid)
            ?.addEventListener("click", (event: Event) => {
                event.preventDefault();
                if (!shared) {
                    DeleteJobFromSwitch(switch_id.value, jid, state.network_guid);
                }
            });

        document
            .getElementById("config_switch_job_edit_" + jid)
            ?.addEventListener("click", (event: Event) => {
                event.preventDefault();
                if (!shared) {
                    EditJobInSwitch(switch_id.value, jid, state.network_guid);
                }
            });
    });
};

export const ConfigRouterJobOnChange = function (evnt: any) {
    switch (evnt.target.value) {
        case "0":
            removeBySelector('div[name="config_router_select_input"]');
            break;
        case "1":
            UpdateRouterForm("config_router_ping_c_1_script");
            break;
        case "100":
            UpdateRouterForm("config_router_add_ip_mask_script");
            FillDeviceSelectIntf(
                "#config_router_add_ip_mask_iface_select_field",
                "#router_id",
                "Выберите линк",
                false
            );
            break;
        case "101":
            UpdateRouterForm("config_router_add_nat_masquerade_script");
            FillDeviceSelectIntf(
                "#config_router_add_nat_masquerade_iface_select_field",
                "#router_id",
                "Выберите линк",
                false
            );
            break;
        case "102":
            UpdateRouterForm("config_router_add_route_script");
            break;
        case "104":
            UpdateRouterForm("config_router_add_subinterface_script");
            FillDeviceSelectIntf(
                "#config_router_add_subinterface_iface_select_field",
                "#router_id",
                "Выберите линк",
                false
            );
            break;
        case "105":
            UpdateRouterForm("config_router_add_ipip_tunnel_script");
            FillDeviceSelectIntf(
                "#config_router_add_ipip_tunnel_iface_select_ip_field",
                "#router_id"
            );
            break;
        case "106":
            UpdateRouterForm("config_router_add_gre_interface_script");
            FillDeviceSelectIntf("#config_router_add_gre_interface_select_ip_field", "#router_id");
            break;
        case "107":
            UpdateRouterForm("config_router_add_arp_proxy_script");
            FillDeviceSelectIntf(
                "#config_router_add_arp_proxy_iface_select_field",
                "#router_id",
                "Выберите линк",
                false
            );
            break;
        case "109":
            UpdateRouterForm("config_router_add_port_forwarding_tcp_script");
            FillDeviceSelectIntf(
                "#config_router_add_port_forwarding_tcp_iface_select_field",
                "#router_id",
                "Выберите линк",
                false
            );
            break;
        case "110":
            UpdateRouterForm("config_router_add_port_forwarding_udp_script");
            FillDeviceSelectIntf(
                "#config_router_add_port_forwarding_udp_iface_select_field",
                "#router_id",
                "Выберите линк",
                false
            );
            break;
        default:
            console.log("Unknown target.value");
    }
};

export const ConfigRouterJob = function (router_jobs: any[], shared: number = 0) {
    let elem: any = document.getElementById("config_router_job_script")!.innerHTML;
    const router_id = document.getElementById("router_id") as HTMLInputElement | null;

    if (!elem || !router_id) {
        return;
    }

    insertHtmlBefore(elem, router_id);

    document
        .getElementById("config_router_job_select_field")!
        .addEventListener("change", ConfigRouterJobOnChange);

    UpdateJobCounter("config_router_job_counter", router_id.value);

    elem = document.getElementById("config_router_job_list_script")!.innerHTML;
    if (!elem) {
        return;
    }

    insertHtmlBefore(elem, router_id);

    if (!router_jobs) {
        return;
    }

    router_jobs.forEach((_item: any, i: number) => {
        const jid = router_jobs[i].id;
        const list = document.getElementById("config_router_job_list");
        if (!list) return;

        if (i == 0) {
            list.insertAdjacentHTML("beforeend", '<label class="text-sm">Команды</label>');
        }

        const html = buildJobElemHtml(
            "config_router_job_list_elem_script",
            "config_router_job_delete",
            "config_router_job_edit",
            jid,
            router_jobs[i].print_cmd
        );
        if (!html) return;
        list.insertAdjacentHTML("beforeend", html);

        document
            .getElementById("config_router_job_delete_" + jid)
            ?.addEventListener("click", (event: Event) => {
                event.preventDefault();
                if (!shared) {
                    DeleteJobFromRouter(router_id.value, jid, state.network_guid);
                }
            });

        document
            .getElementById("config_router_job_edit_" + jid)
            ?.addEventListener("click", (event: Event) => {
                event.preventDefault();
                if (!shared) {
                    EditJobInRouter(router_id.value, jid, state.network_guid);
                }
            });
    });
};

export const ConfigServerJob = function (server_jobs: any[], shared: number = 0) {
    let elem: any = document.getElementById("config_server_job_script")!.innerHTML;
    const server_id = document.getElementById("server_id") as HTMLInputElement | null;

    if (!elem || !server_id) {
        return;
    }

    insertHtmlBefore(elem, server_id);

    document
        .getElementById("config_server_job_select_field")!
        .addEventListener("change", ConfigServerJobOnChange);

    UpdateJobCounter("config_server_job_counter", server_id.value);

    elem = document.getElementById("config_server_job_list_script")!.innerHTML;
    if (!elem) {
        return;
    }

    insertHtmlBefore(elem, server_id);

    if (!server_jobs) {
        return;
    }

    server_jobs.forEach((_item: any, i: number) => {
        const jid = server_jobs[i].id;
        const list = document.getElementById("config_server_job_list");
        if (!list) return;

        if (i == 0) {
            list.insertAdjacentHTML("beforeend", '<label class="text-sm">Команды</label>');
        }

        const html = buildJobElemHtml(
            "config_server_job_list_elem_script",
            "config_server_job_delete",
            "config_server_job_edit",
            jid,
            server_jobs[i].print_cmd
        );
        if (!html) return;
        list.insertAdjacentHTML("beforeend", html);

        document
            .getElementById("config_server_job_delete_" + jid)
            ?.addEventListener("click", (event: Event) => {
                event.preventDefault();
                if (!shared) {
                    DeleteJobFromServer(server_id.value, jid, state.network_guid);
                }
            });

        document
            .getElementById("config_server_job_edit_" + jid)
            ?.addEventListener("click", (event: Event) => {
                event.preventDefault();
                if (!shared) {
                    EditJobInServer(server_id.value, jid, state.network_guid);
                }
            });
    });
};

export const UpdateServerForm = function (name: string) {
    const elem = document.getElementById(name)!.innerHTML;
    const server_job_list = document.getElementById("config_server_job_list");

    if (!elem || !server_job_list) {
        return;
    }

    removeBySelector('div[name="config_server_select_input"]');
    insertHtmlBefore(elem, server_job_list);
};

export const ConfigServerJobOnChange = function (evnt: any) {
    switch (evnt.target.value) {
        case "0":
            removeBySelector('div[name="config_server_select_input"]');
            break;

        case "1":
            UpdateServerForm("config_server_ping_c_1_script");
            break;

        case "200":
            UpdateServerForm("config_server_start_udp_server_script");
            break;

        case "201":
            UpdateServerForm("config_server_start_tcp_server_script");
            break;

        case "202":
            UpdateServerForm("config_server_block_tcp_udp_port_script");
            break;

        case "203":
            UpdateServerForm("config_server_add_dhcp_server_script");
            FillDeviceSelectIntf(
                "#config_server_add_dhcp_interface_select_iface_field",
                "#server_id",
                "Выберите линк",
                false
            );
            break;

        default:
            console.log("Unknown target.value");
    }
};

export const DisableFormInputs = function () {
    const content = document.querySelector(config_content_id);
    if (content) disableInputsIn(content);
    const saveTag = document.querySelector(config_content_save_tag);
    if (saveTag) disableInputsIn(saveTag);
};

export const DisableVLANInputs = function (n: any) {
    const modalId = "VlanModal_" + n.data.id;

    const apply = () => {
        const openBtn = document.getElementById("config_button_vlan") as HTMLButtonElement | null;
        if (openBtn) openBtn.disabled = false;
        const modalEl = document.getElementById(modalId);
        if (!modalEl) return;
        disableInputsIn(modalEl, ".btn-close");
        modalEl
            .querySelectorAll<HTMLInputElement>(".form-check-input, .form-switch input")
            .forEach((el) => {
                el.disabled = true;
            });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", apply, { once: true });
    } else {
        apply();
    }
};

export const UpdateRouterForm = function (name: string) {
    const elem = document.getElementById(name)!.innerHTML;
    const router_job_list = document.getElementById("config_router_job_list");

    if (!elem || !router_job_list) {
        return;
    }

    removeBySelector('div[name="config_router_select_input"]');
    insertHtmlBefore(elem, router_job_list);
};

export const FillDeviceSelectIntf = function (
    select_id: string,
    device: string,
    field_msg: string = "Интерфейс начальной точки",
    return_ip: boolean = true
) {
    const deviceEl = document.querySelector(device) as HTMLInputElement | null;
    const device_id = deviceEl?.value;

    if (!device_id) {
        console.log("Не нашел device_id");
        return;
    }

    const device_node = state.nodes.find((node: any) => node.data.id === device_id);
    const device_type = device.slice(1, -3); // "#router_id" -> "router"

    if (!device_node) {
        console.log("Не нашел device_node");
        return;
    }

    const selectEl = document.querySelector(select_id) as HTMLSelectElement | null;
    if (!selectEl) return;

    if (!device_node.interface.length) {
        selectEl.insertAdjacentHTML(
            "beforeend",
            '<option selected value="0">Мало интерфейсов</option>'
        );
        return;
    }
    selectEl.insertAdjacentHTML("beforeend", `<option selected value="0">${field_msg}</option>`);

    selectEl.addEventListener("change", function () {
        const selectedOption = selectEl.options[selectEl.selectedIndex];
        const selectedLabel = selectedOption?.textContent ?? "";
        const hidden = document.getElementById(
            device_type + "_connection_host_label_hidden"
        ) as HTMLInputElement | null;
        if (hidden) hidden.value = selectedLabel;
    });

    device_node.interface.forEach((iface: any) => {
        const iface_id = iface.id;
        const iface_ip = iface.ip;

        if (!iface_id || (return_ip && !iface_ip)) {
            console.log("Не нашел ip/id у интерфейса");
            return;
        }

        const connect_id = iface.connect;
        if (!connect_id) {
            console.log("Не нашел подключение у интерфейса");
            return;
        }

        const edge = state.edges.find((e: any) => e.data.id === connect_id);
        if (!edge) {
            console.log("Не нашел ребро по подключению интерфейса");
            return;
        }

        const edge_source = edge.data.source;
        const edge_target = edge.data.target;

        if (!edge_source || !edge_target) {
            console.log("Не получилось найти target и source у ребра");
            return;
        }

        const device_connection = device_node.data.id === edge_target ? edge_source : edge_target;

        const device_connection_host_node = state.nodes.find(
            (node: any) => node.data.id === device_connection
        );
        const device_connection_host_label = device_connection_host_node
            ? device_connection_host_node.data.label
            : "Unknown";

        selectEl.insertAdjacentHTML(
            "beforeend",
            '<option value="' +
                (return_ip ? iface_ip : iface_id) +
                '">' +
                device_connection_host_label +
                "</option>"
        );
    });
};

export const DisableVXLANInputs = function (n: any) {
    const modalId = "VxlanConfigModal" + n.data.id;

    const apply = () => {
        const openBtn = document.getElementById("config_button_vxlan") as HTMLButtonElement | null;
        if (openBtn) openBtn.disabled = false;

        const modalEl = document.getElementById(modalId);
        if (modalEl) {
            disableInputsIn(modalEl, ".btn-close");
            modalEl
                .querySelectorAll<HTMLInputElement>(".form-check-input, .form-switch input")
                .forEach((el) => {
                    el.disabled = true;
                });

            const handler = (modalEl as any).__vxlanHiddenHandler as EventListener | undefined;
            if (handler) {
                modalEl.removeEventListener("hidden.bs.modal", handler);
                delete (modalEl as any).__vxlanHiddenHandler;
            }
        }

        const style = document.createElement("style");
        style.type = "text/css";
        style.textContent = `
        .network-interface .btn-danger,
        .client-interface .btn-danger {
            display: none !important;
        }
    `;
        document.head.appendChild(style);
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", apply, { once: true });
    } else {
        apply();
    }
};

// ========== DEVICE-SPECIFIC COMMAND EDITING ==========

/// Edit job in host
