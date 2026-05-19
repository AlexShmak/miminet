import { state } from "../lib/state";
import { ExitEditMode, editingJobId, editingDeviceType } from "./runtime";
import {
    ConfigHostForm,
    ConfigRouterForm,
    ConfigServerForm,
    ConfigHubForm,
    ConfigSwitchForm,
    ConfigEdgeForm,
} from "../config_forms/device";
import {
    SharedConfigHostForm,
    SharedConfigRouterForm,
    SharedConfigServerForm,
    SharedConfigHubForm,
    SharedConfigSwitchForm,
    SharedConfigEdgeForm,
} from "../config_forms/shared";
import {
    ConfigHostName,
    ConfigRouterName,
    ConfigServerName,
    ConfigHostInterface,
    ConfigRouterInterface,
    ConfigServerInterface,
    ConfigHubInterface,
    ConfigSwitchInterface,
    ConfigHubIndent,
    ConfigSwitchIndent,
} from "../config_forms/helpers";
import {
    ConfigHubName,
    ConfigSwitchName,
    ConfigEdgeNetworkIssues,
    ConfigEdgeEndpoints,
} from "../config_forms/device";
import { uid } from "./state";
import { ConfigRSTP } from "../config_forms/stp";
import { ConfigVLAN } from "../config_forms/vlan";
import { ConfigVxlan } from "../config_forms/vxlan";
import {
    ConfigHostJob,
    ConfigRouterJob,
    ConfigServerJob,
    ConfigSwitchJob,
    ConfigHostGateway,
    ConfigRouterGateway,
    ConfigServerGateway,
    DisableFormInputs,
    DisableVLANInputs,
    DisableVXLANInputs,
} from "../config_forms/jobs";

export const ActionWithInterface = function (n: any, i: number, fun: (...args: any[]) => any) {
    const iface_id = n.interface[i].id;

    if (!iface_id) {
        return;
    }

    const connect_id = n.interface[i].connect;

    if (!connect_id) {
        return;
    }

    const edge = state.edges.find((e: any) => e.data.id === connect_id);

    if (!edge) {
        return;
    }

    const source_host = edge.data.source;
    const target_host = edge.data.target;

    if (!source_host || !target_host) {
        return;
    }

    const connected_to = n.data.id === target_host ? source_host : target_host;

    const connected_to_host = state.nodes.find((node: any) => node.data.id === connected_to);
    const connected_to_host_label = connected_to_host ? connected_to_host.data.label : "Unknown";

    const ip_addr = n.interface[i].ip || "";
    const netmask = n.interface[i].netmask || "";

    fun(iface_id, ip_addr, netmask, connected_to_host_label);
};

export const ShowHostConfig = function (n: any, shared: number = 0) {
    // Exit edit mode when switching to different device
    if (editingJobId && editingDeviceType) {
        ExitEditMode(editingDeviceType);
    }

    let hostname = n.config.label;
    hostname = hostname || n.data.id;

    // Create form
    if (shared) {
        SharedConfigHostForm(n.data.id);
    } else {
        ConfigHostForm(n.data.id);
    }

    // Add hostname
    ConfigHostName(hostname);

    // Add state.jobs
    let host_jobs = [];

    if (state.jobs) {
        host_jobs = state.jobs.filter((j: any) => j.host_id === n.data.id);
    }

    ConfigHostJob(host_jobs, shared);

    // Add interfaces
    $.each(n.interface, function (i: number) {
        ActionWithInterface(n, i, ConfigHostInterface);
    });

    if (n.interface.length) {
        let default_gw = "";

        if ("default_gw" in n.config) {
            default_gw = n.config.default_gw;
        }

        ConfigHostGateway(default_gw);
    }

    if (shared) {
        DisableFormInputs();
    }
};

export const ShowRouterConfig = function (n: any, shared: number = 0) {
    // Exit edit mode when switching to different device
    if (editingJobId && editingDeviceType) {
        ExitEditMode(editingDeviceType);
    }

    let hostname = n.config.label;
    hostname = hostname || n.data.id;

    // Create form
    if (shared) {
        SharedConfigRouterForm(n.data.id);
    } else {
        ConfigRouterForm(n.data.id);
    }

    // Add hostname
    ConfigRouterName(hostname);

    // Add state.jobs
    let router_jobs = [];

    if (state.jobs) {
        router_jobs = state.jobs.filter((j: any) => j.host_id === n.data.id);
    }

    ConfigRouterJob(router_jobs, shared);

    // Add interfaces
    $.each(n.interface, function (i: number) {
        ActionWithInterface(n, i, ConfigRouterInterface);
    });

    if (n.interface.length) {
        let default_gw = "";

        if ("default_gw" in n.config) {
            default_gw = n.config.default_gw;
        }

        ConfigRouterGateway(default_gw);
    }

    ConfigVxlan(n);

    if (shared) {
        DisableFormInputs();
        DisableVXLANInputs(n);
    }
};

export const ShowServerConfig = function (n: any, shared: number = 0) {
    // Exit edit mode when switching to different device
    if (editingJobId && editingDeviceType) {
        ExitEditMode(editingDeviceType);
    }

    let hostname = n.config.label;
    hostname = hostname || n.data.id;

    // Create form
    if (shared) {
        SharedConfigServerForm(n.data.id);
    } else {
        ConfigServerForm(n.data.id);
    }

    // Add hostname
    ConfigServerName(hostname);

    // Add state.jobs
    let host_jobs = [];

    if (state.jobs) {
        host_jobs = state.jobs.filter((j: any) => j.host_id === n.data.id);
    }

    ConfigServerJob(host_jobs, shared);

    // Add interfaces
    $.each(n.interface, function (i: number) {
        ActionWithInterface(n, i, ConfigServerInterface);
    });

    if (n.interface.length) {
        let default_gw = "";

        if ("default_gw" in n.config) {
            default_gw = n.config.default_gw;
        }

        ConfigServerGateway(default_gw);
    }

    if (shared) {
        DisableFormInputs();
    }
};

export const ShowHubConfig = function (n: any, shared: number = 0) {
    let hostname = n.config.label;
    hostname = hostname || n.data.id;

    // Create form
    if (shared) {
        SharedConfigHubForm(n.data.id);
    } else {
        ConfigHubForm(n.data.id);
    }

    // Add hostname
    ConfigHubName(hostname);

    // Add interfaces
    $.each(n.interface, function (i: number) {
        ActionWithInterface(n, i, ConfigHubInterface);
    });

    if (n.interface.length) {
        ConfigHubIndent();
    }

    if (shared) {
        DisableFormInputs();
    }
};

export const ShowSwitchConfig = function (n: any, shared: number = 0) {
    let hostname = n.config.label;
    hostname = hostname || n.data.id;

    // Create form
    if (shared) {
        SharedConfigSwitchForm(n.data.id);
    } else {
        ConfigSwitchForm(n.data.id);
    }

    // Add hostname
    ConfigSwitchName(hostname);
    let switch_jobs = [];

    if (state.jobs) {
        switch_jobs = state.jobs.filter((j: any) => j.host_id === n.data.id);
    }

    ConfigSwitchJob(switch_jobs, shared);

    //Add checkbox STP
    //    ConfigSwtichSTP(n.config.stp);

    //Add checkbox RSTP
    //    ConfigSwtichRSTP(n.config.rstp);
    ConfigRSTP(n);

    // Add VLAN
    ConfigVLAN(n);

    // Add interfaces
    $.each(n.interface, function (i: number) {
        ActionWithInterface(n, i, ConfigSwitchInterface);
    });

    if (n.interface.length) {
        ConfigSwitchIndent();
    }

    if (shared) {
        DisableFormInputs();
        DisableVLANInputs(n);
    }
};

export const ShowEdgeConfig = function (edge_id: string, shared: number = 0) {
    const ed = state.edges.find((edge: any) => edge.data.id === edge_id);

    if (!ed) {
        return;
    }

    const edge_source = ed.data.source;
    const edge_target = ed.data.target;
    const edge_loss = ed.data.loss_percentage || 0;
    const edge_duplicate = ed.data.duplicate_percentage || 0;

    // Create form
    if (shared) {
        SharedConfigEdgeForm(edge_id);
    } else {
        ConfigEdgeForm(edge_id);
    }

    ConfigEdgeNetworkIssues(edge_loss, edge_duplicate);

    // Add source and target info
    ConfigEdgeEndpoints(edge_source, edge_target);

    if (shared) {
        DisableFormInputs();
    }
};

export const PacketUid = function () {
    return "pkt_" + uid();
};

export const l1HubUid = function () {
    const hub_name = "l1hub";

    for (let hub_number = 1; hub_number < 100; hub_number++) {
        const hub = hub_name + hub_number;

        const t = state.nodes.find((target: any) => target.data.id === hub);

        if (!t) {
            return hub;
        }
    }

    return "hub_" + uid();
};

export const l2SwitchUid = function () {
    const sw_name = "l2sw";

    for (let sw_number = 1; sw_number < 100; sw_number++) {
        const sw = sw_name + sw_number;

        const t = state.nodes.find((target: any) => target.data.id === sw);

        if (!t) {
            return sw;
        }
    }

    return "sw_" + uid();
};

export const l2SwitchPortUid = function (switch_id: string) {
    const t = state.nodes.find((target: any) => target.data.id === switch_id);

    if (!t) {
        return -1;
    }

    for (let port_number = 1; port_number < 128; port_number++) {
        const port = t.data.id + "_" + port_number;

        const i = t.interface.find((iface: any) => iface.id === port);

        if (!i) {
            return port;
        }
    }
};

export const l1HubPortUid = function (hub_id: string) {
    const t = state.nodes.find((target: any) => target.data.id === hub_id);

    if (!t) {
        return -1;
    }

    for (let port_number = 1; port_number < 128; port_number++) {
        const port = t.data.id + "_" + port_number;

        const i = t.interface.find((iface: any) => iface.id === port);

        if (!i) {
            return port;
        }
    }
};

export const EdgeUid = function () {
    return "edge_" + uid();
};

export const InterfaceUid = function () {
    return "iface_" + Math.random().toString(9).substring(2, 10);
};
