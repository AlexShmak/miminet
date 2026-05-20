import { state } from "../lib/state";
import { EnterEditMode } from "../netfront/runtime";
import { UpdateRouterForm, UpdateServerForm, UpdateSwitchForm, FillDeviceSelectIntf } from "./jobs";

const setVal = (id: string, value: any) => {
    const el = document.getElementById(id) as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | null;
    if (el) el.value = String(value ?? "");
};

const highlightFormArea = (selector: string) => {
    document.querySelectorAll(selector).forEach((el) => el.classList.add("editing-form-area"));
};

export const EditJobInHost = function (host_id: string, job_id: string, _network_guid: string) {
    const job = state.jobs.find((j: any) => j.id === job_id);

    if (!job) {
        console.error("Job not found:", job_id);
        return;
    }

    EnterEditMode("host", job_id, job.job_id);

    const selectField = document.getElementById(
        "config_host_job_select_field"
    ) as HTMLSelectElement | null;
    if (!selectField) return;

    selectField.value = job.job_id.toString();
    selectField.dispatchEvent(new Event("change"));

    setTimeout(() => {
        switch (job.job_id.toString()) {
            case "1":
                setVal("config_host_ping_c_1_ip", job.arg_1);
                break;
            case "2":
                setVal("config_host_ping_with_options_options_input_field", job.arg_1);
                setVal("config_host_ping_with_options_ip_input_field", job.arg_2);
                break;
            case "5":
                setVal("config_host_traceroute_with_options_options_input_field", job.arg_1);
                setVal("config_host_traceroute_with_options_ip_input_field", job.arg_2);
                break;
            case "3":
                setVal("config_host_send_udp_data_size_input_field", job.arg_1);
                setVal("config_host_send_udp_data_ip_input_field", job.arg_2);
                setVal("config_host_send_udp_data_port_input_field", job.arg_3);
                break;
            case "4":
                setVal("config_host_send_tcp_data_size_input_field", job.arg_1);
                setVal("config_host_send_tcp_data_ip_input_field", job.arg_2);
                setVal("config_host_send_tcp_data_port_input_field", job.arg_3);
                break;
            case "102":
                setVal("config_host_add_route_ip_input_field", job.arg_1);
                setVal("config_host_add_route_mask_input_field", job.arg_2 || "0");
                setVal("config_host_add_route_gw_input_field", job.arg_3);
                break;
            case "103":
                setVal("config_host_add_arp_cache_ip_input_field", job.arg_1);
                setVal("config_host_add_arp_cache_mac_input_field", job.arg_2);
                break;
            case "108":
                break;
        }
    }, 200);
};

export const EditJobInRouter = function (router_id: string, job_id: string, _network_guid: string) {
    const job = state.jobs.find((j: any) => j.id === job_id);

    if (!job) {
        console.error("Job not found:", job_id);
        return;
    }

    EnterEditMode("router", job_id, job.job_id);

    const selectField = document.getElementById(
        "config_router_job_select_field"
    ) as HTMLSelectElement | null;
    if (!selectField) return;

    selectField.value = job.job_id.toString();
    selectField.dispatchEvent(new Event("change"));

    setTimeout(() => {
        switch (job.job_id.toString()) {
            case "1":
                UpdateRouterForm("config_router_ping_c_1_script");
                setVal("config_router_ping_c_1_ip", job.arg_1);
                break;
            case "100":
                UpdateRouterForm("config_router_add_ip_mask_script");
                FillDeviceSelectIntf(
                    "#config_router_add_ip_mask_iface_select_field",
                    "#router_id",
                    "Выберите линк",
                    false
                );
                setVal("config_router_add_ip_mask_iface_select_field", job.arg_1);
                setVal("config_router_add_ip_mask_ip_input_field", job.arg_2);
                setVal("config_router_add_ip_mask_mask_input_field", job.arg_3 || "0");
                break;
            case "101":
                UpdateRouterForm("config_router_add_nat_masquerade_script");
                FillDeviceSelectIntf(
                    "#config_router_add_nat_masquerade_iface_select_field",
                    "#router_id",
                    "Выберите линк",
                    false
                );
                setVal("config_router_add_nat_masquerade_iface_select_field", job.arg_1);
                break;
            case "102":
                UpdateRouterForm("config_router_add_route_script");
                setVal("config_router_add_route_ip_input_field", job.arg_1);
                setVal("config_router_add_route_mask_input_field", job.arg_2 || "0");
                setVal("config_router_add_route_gw_input_field", job.arg_3);
                break;
            case "104":
                UpdateRouterForm("config_router_add_subinterface_script");
                FillDeviceSelectIntf(
                    "#config_router_add_subinterface_iface_select_field",
                    "#router_id",
                    "Выберите линк",
                    false
                );
                setVal("config_router_add_subinterface_iface_select_field", job.arg_1);
                setVal("config_router_add_subinterface_ip_input_field", job.arg_2);
                setVal("config_router_add_subinterface_mask_input_field", job.arg_3 || "0");
                setVal("config_router_add_subinterface_vlan_input_field", job.arg_4 || "1");
                break;
            case "105":
                UpdateRouterForm("config_router_add_ipip_tunnel_script");
                FillDeviceSelectIntf(
                    "#config_router_add_ipip_tunnel_iface_select_ip_field",
                    "#router_id"
                );
                setVal("config_router_add_ipip_tunnel_iface_select_ip_field", job.arg_1);
                setVal("config_router_add_ipip_tunnel_end_ip_input_field", job.arg_2);
                setVal("config_router_add_ipip_tunnel_interface_ip_input_field", job.arg_3);
                setVal("config_router_add_ipip_tunnel_interface_name_field", job.arg_4);
                break;
            case "106":
                UpdateRouterForm("config_router_add_gre_interface_script");
                FillDeviceSelectIntf(
                    "#config_router_add_gre_interface_select_ip_field",
                    "#router_id"
                );
                setVal("config_router_add_gre_interface_select_ip_field", job.arg_1);
                setVal("config_router_add_gre_interface_end_ip_input_field", job.arg_2);
                setVal("config_router_add_gre_interface_ip_input_field", job.arg_3);
                setVal("config_router_add_gre_interface_name_field", job.arg_4);
                break;
            case "107":
                UpdateRouterForm("config_router_add_arp_proxy_script");
                FillDeviceSelectIntf(
                    "#config_router_add_arp_proxy_iface_select_field",
                    "#router_id",
                    "Выберите линк",
                    false
                );
                setVal("config_router_add_arp_proxy_iface_select_field", job.arg_1);
                break;
            case "109":
                UpdateRouterForm("config_router_add_port_forwarding_tcp_script");
                FillDeviceSelectIntf(
                    "#config_router_add_port_forwarding_tcp_iface_select_field",
                    "#router_id",
                    "Выберите линк",
                    false
                );
                setVal("config_router_add_port_forwarding_tcp_iface_select_field", job.arg_1);
                setVal("config_router_add_port_forwarding_tcp_port_input_field", job.arg_2);
                setVal("config_router_add_port_forwarding_tcp_dest_ip_input_field", job.arg_3);
                setVal("config_router_add_port_forwarding_tcp_dest_port_input_field", job.arg_4);
                break;
            case "110":
                UpdateRouterForm("config_router_add_port_forwarding_udp_script");
                FillDeviceSelectIntf(
                    "#config_router_add_port_forwarding_udp_iface_select_field",
                    "#router_id",
                    "Выберите линк",
                    false
                );
                setVal("config_router_add_port_forwarding_udp_iface_select_field", job.arg_1);
                setVal("config_router_add_port_forwarding_udp_port_input_field", job.arg_2);
                setVal("config_router_add_port_forwarding_udp_dest_ip_input_field", job.arg_3);
                setVal("config_router_add_port_forwarding_udp_dest_port_input_field", job.arg_4);
                break;
            default:
                console.error("Unknown job type for editing:", job.job_id);
        }

        setTimeout(() => {
            highlightFormArea('div[name="config_router_select_input"]');
        }, 100);
    }, 200);
};

export const EditJobInServer = function (server_id: string, job_id: string, _network_guid: string) {
    const job = state.jobs.find((j: any) => j.id === job_id);

    if (!job) {
        console.error("Job not found:", job_id);
        return;
    }

    EnterEditMode("server", job_id, job.job_id);

    const selectField = document.getElementById(
        "config_server_job_select_field"
    ) as HTMLSelectElement | null;
    if (!selectField) return;

    selectField.value = job.job_id.toString();
    selectField.dispatchEvent(new Event("change"));

    setTimeout(() => {
        switch (job.job_id.toString()) {
            case "1":
                UpdateServerForm("config_server_ping_c_1_script");
                setVal("config_server_ping_c_1_ip", job.arg_1);
                break;
            case "200":
                UpdateServerForm("config_server_start_udp_server_script");
                setVal("config_server_start_udp_server_ip_input_field", job.arg_1);
                setVal("config_server_start_udp_server_port_input_field", job.arg_2 || "0");
                break;
            case "201":
                UpdateServerForm("config_server_start_tcp_server_script");
                setVal("config_server_start_tcp_server_ip_input_field", job.arg_1);
                setVal("config_server_start_tcp_server_port_input_field", job.arg_2 || "0");
                break;
            case "202":
                UpdateServerForm("config_server_block_tcp_udp_port_script");
                setVal("config_server_block_tcp_udp_port_input_field", job.arg_1 || "0");
                break;
            case "203":
                UpdateServerForm("config_server_add_dhcp_server_script");
                FillDeviceSelectIntf(
                    "#config_server_add_dhcp_interface_select_iface_field",
                    "#server_id",
                    "Выберите линк",
                    false
                );
                setVal("config_server_add_dhcp_ip_range_1_input_field", job.arg_1);
                setVal("config_server_add_dhcp_ip_range_2_input_field", job.arg_2);
                setVal("config_server_add_dhcp_mask_input_field", job.arg_3 || "0");
                setVal("config_server_add_dhcp_gateway_input_field", job.arg_4);
                setVal("config_server_add_dhcp_interface_select_iface_field", job.arg_5);
                break;
            default:
                console.error("Unknown job type for editing:", job.job_id);
        }

        setTimeout(() => {
            highlightFormArea('div[name="config_server_select_input"]');
        }, 100);
    }, 200);
};

export const EditJobInSwitch = function (switch_id: string, job_id: string, _network_guid: string) {
    const job = state.jobs.find((j: any) => j.id === job_id);

    if (!job) {
        console.error("Job not found:", job_id);
        return;
    }

    EnterEditMode("switch", job_id, job.job_id);

    const selectField = document.getElementById(
        "config_switch_job_select_field"
    ) as HTMLSelectElement | null;
    if (!selectField) return;

    selectField.value = job.job_id.toString();
    selectField.dispatchEvent(new Event("change"));

    setTimeout(() => {
        switch (job.job_id.toString()) {
            case "6":
                UpdateSwitchForm("config_switch_link_down_script");
                FillDeviceSelectIntf(
                    "#config_switch_link_down_iface_select_field",
                    "#switch_id",
                    "Выберете линк",
                    false
                );
                setVal("config_switch_link_down_iface_select_field", job.arg_1);
                break;
            case "7":
                UpdateSwitchForm("config_switch_sleep_script");
                setVal("config_switch_sleep", job.arg_1);
                break;

            default:
                console.error("Unknown job type for editing:", job.job_id);
        }

        setTimeout(() => {
            highlightFormArea('div[name="config_switch_select_input"]');
        }, 100);
    }, 200);
};
