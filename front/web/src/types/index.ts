/**
 * Shared frontend types.
 *
 * Most shapes are kept intentionally loose (`any`) where the runtime still
 * mutates them dynamically and the contract with the backend is not yet
 * fully nailed down. Later phases will tighten these as feature areas move
 * to React.
 */

// A single interface on a node — IP, netmask, peer-link id, optional VLAN.
export interface NetIface {
    id: string;
    name: string;
    connect?: string;
    ip?: string;
    netmask?: string | number;
    type_connection?: number;
    vlan?: number | number[];
    [key: string]: any;
}

// Per-device config blob attached to a node.
export interface NodeConfig {
    type: string;
    label?: string;
    default_gw?: string;
    stp?: number;
    priority?: number;
    [key: string]: any;
}

// Cytoscape-shaped node element from server / state.
export interface NetNode {
    classes?: string[] | string;
    data: { id: string; label?: string; [key: string]: any };
    config: NodeConfig;
    interface: NetIface[];
    position?: { x: number; y: number };
    [key: string]: any;
}

// Cytoscape-shaped edge element.
export interface NetEdge {
    data: {
        id: string;
        source: string;
        target: string;
        label?: string;
        weight?: number;
        loss_percentage?: number | string;
        duplicate_percentage?: number | string;
        [key: string]: any;
    };
    classes?: string[] | string;
    [key: string]: any;
}

// Job/command attached to a host/router/server/switch.
export interface NetJob {
    id: string;
    host_id: string;
    job_id: number | string;
    print_cmd?: string;
    arg_1?: string;
    arg_2?: string;
    arg_3?: string;
    arg_4?: string;
    arg_5?: string;
    [key: string]: any;
}

// Generic ajax response from /host/*_save_config and /host/delete_job.
export interface SaveConfigResponse {
    nodes?: NetNode[];
    edges?: NetEdge[];
    jobs?: NetJob[];
    warning?: string;
    message?: string;
    packets?: string;
    pcaps?: string[];
    [key: string]: any;
}

// Packet-filter checkbox state.
export interface PacketFilterState {
    hideARP: boolean;
    hideSTP: boolean;
    hideSYN: boolean;
}

// Device kinds referenced in EnterEditMode/ExitEditMode.
export type DeviceKind = 'host' | 'router' | 'server' | 'switch' | 'hub';
