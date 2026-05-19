import { state } from "../lib/state";
import { MarkLinkDownEdges, prepareStylesheet } from "./network_ops";
import { initGrid } from "./runtime";
import {
    ShowHostConfig,
    ShowRouterConfig,
    ShowServerConfig,
    ShowHubConfig,
    ShowSwitchConfig,
    ShowEdgeConfig,
} from "./show_config";
import { ClearConfigForm } from "../config_forms/common";
import { PacketPlayer } from "./packet_player";
import { mountNetworkEditor } from "../lib/network_editor_mount";

// Thin wrapper: cy + handlers + edge-handles plugin all live in
// components/NetworkEditor.tsx. Each call mounts or re-renders that
// component with a bumped revision, which re-syncs cy with the
// current state.nodes/state.edges.
export const DrawGraph = function () {
    mountNetworkEditor();
};

export const DrawGraphStatic = function (shared: number = 0) {
    const network_scheme_id = shared ? "network_scheme_shared" : "network_scheme";

    let cy: any;
    if (state.global_cy) {
        cy = state.global_cy;
        cy.elements().remove();
    } else {
        cy = cytoscape({
            container: document.getElementById(network_scheme_id),
            boxSelectionEnabled: true,
            autounselectify: false,
            style: prepareStylesheet(),
            elements: [],
            layout: "preset",
            zoom: state.network_zoom,
            pan: { x: state.network_pan_x, y: state.network_pan_y },
            fit: true,
        });

        state.global_cy = cy;
    }

    // Turn off state.edges creation.
    if (state.global_eh) {
        state.global_eh.disable();
    }

    cy.autounselectify(false);
    cy.add(state.nodes);
    cy.add(state.edges);
    MarkLinkDownEdges(cy);
    cy.nodes().ungrabify();

    // Initialize grid
    initGrid(cy);

    return;
};

export const DrawSharedGraph = function () {
    let selected_edge_id: any = 0;

    // Do we already have one?
    let cy: any;
    if (state.global_cy) {
        cy = state.global_cy;
        cy.elements().remove();
    } else {
        cy = cytoscape({
            container: document.getElementById("network_scheme_shared"),
            boxSelectionEnabled: true,
            autounselectify: true,
            style: prepareStylesheet(),
            elements: [],
            layout: "preset",
            zoom: state.network_zoom,
            pan: { x: state.network_pan_x, y: state.network_pan_y },
            fit: true,
        });

        state.global_cy = cy;
    }

    cy.autounselectify(true);

    cy.minZoom(0.5);
    cy.maxZoom(2);

    cy.add(state.nodes);
    cy.add(state.edges);
    MarkLinkDownEdges(cy);

    // Click on object
    cy.on("click", function (evt: any) {
        const evtTarget = evt.target;
        if (evtTarget === cy) {
            ClearConfigForm("");
            selected_edge_id = 0;
            return;
        }

        // Is this edge ?
        if (evtTarget.group() === "edges") {
            selected_edge_id = evtTarget.data().id;
            ShowEdgeConfig(selected_edge_id, 1);
            return;
        }

        const target_id = evt.target.id();
        const n = state.nodes.find((node: any) => node.data.id === target_id);

        if (!n) {
            return;
        }

        selected_edge_id = 0;

        if (n.config.type === "host") {
            ShowHostConfig(n, 1);
        } else if (n.config.type === "l1_hub") {
            ShowHubConfig(n, 1);
        } else if (n.config.type === "l2_switch") {
            ShowSwitchConfig(n, 1);
        } else if (n.config.type === "router") {
            ShowRouterConfig(n, 1);
        } else if (n.config.type === "server") {
            ShowServerConfig(n, 1);
        }
    });

    // Initialize grid
    initGrid(cy);
};

export const DrawIndexGraphStatic = function (
    container_id: string,
    graph_network_zoom: number,
    graph_network_pan_x: number,
    graph_network_pan_y: number
) {
    const index_cy = cytoscape({
        container: document.getElementById(container_id),
        boxSelectionEnabled: true,
        autounselectify: false,
        style: prepareStylesheet(),
        elements: [],
        layout: "preset",
        zoom: graph_network_zoom,
        pan: { x: graph_network_pan_x, y: graph_network_pan_y },
        fit: true,
    });

    index_cy.autounselectify(false);

    index_cy.add(state.nodes);
    index_cy.add(state.edges);
    index_cy.panningEnabled(false);

    index_cy.nodes().ungrabify();
    return index_cy;
};

// Boot helper for the index.html demo. Reads the data from state
// (populated by lib/initial_state.ts from the JSON script tag) and
// drives the playback loop. Exposed on window via attachGlobals so the
// inline kickoff `<script>` in templates/index.html can call it.
export const BootIndexDemo = function () {
    const cy = DrawIndexGraphStatic("index_network_example", 2, -170, -90);
    PacketPlayer.getInstance().InitPlayer(state.packets);
    PacketPlayer.getInstance().StartPlayer(cy);
    return cy;
};

// Check whether simulation is over and we can run state.packets
