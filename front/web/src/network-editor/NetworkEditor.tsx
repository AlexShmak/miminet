// Editor-mode network canvas: owns the cytoscape instance lifecycle,
// edge-handles plugin, click/zoom/pan/dragfree/keyup handlers, and the
// selected-node/edge state.
//
// Replaces the imperative `DrawGraph` body in network-editor/draw.ts. The
// component renders nothing (cytoscape mounts into the existing
// `#network_scheme` div); its job is purely side-effect management.
//
// Subsequent `DrawGraph()` calls land here via the singleton mount in
// network-editor/mount.tsx, which bumps `revision`; a refresh
// effect re-syncs the cy elements with `state.nodes`/`state.edges`
// without rebuilding cy.

import { useEffect, useRef, useState } from "react";
import { state } from "../shared/state";
import {
    MarkLinkDownEdges,
    SnapNodesToGrid,
    prepareStylesheet,
    AddEdge,
    MoveNodes,
    DeleteNode,
    DeleteEdge,
    DeleteJob,
    PostNodesEdges,
} from "./network_ops";
import {
    UpdateNetworkConfig,
    drawGrid,
    TakeGraphPictureAndUpdate,
    SetNetworkPlayerState,
    SaveNetworkObject,
    RestoreNetworkObject,
    initGrid,
} from "./runtime";
import {
    ShowHostConfig,
    ShowRouterConfig,
    ShowServerConfig,
    ShowHubConfig,
    ShowSwitchConfig,
    ShowEdgeConfig,
} from "../device-config/show_config";
import { ClearConfigForm } from "../device-config/common";

interface Props {
    revision: number;
}

export function NetworkEditor({ revision }: Props) {
    const cyRef = useRef<any>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

    // Latest-value refs so the long-lived event handlers below can
    // read fresh state without having to be torn down on every change.
    const selectedNodeIdRef = useRef<string | null>(null);
    const selectedEdgeIdRef = useRef<string | null>(null);
    useEffect(() => {
        selectedNodeIdRef.current = selectedNodeId;
    }, [selectedNodeId]);
    useEffect(() => {
        selectedEdgeIdRef.current = selectedEdgeId;
    }, [selectedEdgeId]);

    // Mount: create cytoscape, wire all handlers and the edge-handles
    // plugin, install keyup. Tear everything down on unmount.
    useEffect(() => {
        const container = document.getElementById("network_scheme");
        if (!container) {
            return;
        }

        const cy = cytoscape({
            container,
            boxSelectionEnabled: true,
            autounselectify: true,
            style: prepareStylesheet(),
            elements: [],
            layout: "preset",
            zoom: state.network_zoom,
            pan: { x: state.network_pan_x, y: state.network_pan_y },
            fit: true,
        });

        cyRef.current = cy;
        state.global_cy = cy;

        const edgeHandlesDefaults = {
            canConnect: function (sourceNode: any, targetNode: any) {
                return !sourceNode.same(targetNode);
            },
            edgeParams: function (_sourceNode: any, _targetNode: any) {
                return {};
            },
            hoverDelay: 150,
            snap: false,
            snapThreshold: 50,
            snapFrequency: 15,
            noEdgeEventsInDraw: true,
            disableBrowserGestures: true,
        };
        state.global_eh = cy.edgehandles(edgeHandlesDefaults);

        cy.minZoom(0.5);
        cy.maxZoom(2);

        cy.add(state.nodes);
        cy.add(state.edges);
        MarkLinkDownEdges(cy);
        SnapNodesToGrid(cy);

        cy.on("zoom", function () {
            if (state.networkUpdateTimeoutId >= 0) {
                clearTimeout(state.networkUpdateTimeoutId);
                state.networkUpdateTimeoutId = -1;
            }
            state.networkUpdateTimeoutId = setTimeout(UpdateNetworkConfig, 2000);
            if (state.gridCanvasLayer) {
                state.currentGridZoom = cy.zoom();
                drawGrid();
            }
        });

        cy.on("pan", function () {
            if (state.networkUpdateTimeoutId >= 0) {
                clearTimeout(state.networkUpdateTimeoutId);
                state.networkUpdateTimeoutId = -1;
            }
            state.networkUpdateTimeoutId = setTimeout(UpdateNetworkConfig, 2000);
            if (state.gridCanvasLayer) {
                drawGrid();
            }
        });

        cy.on("dragfree", "node", function (this: any) {
            const n = state.nodes.find((node: any) => node.data.id === this.id());
            if (!n) {
                return;
            }
            let posX = this.position().x;
            let posY = this.position().y;
            const baseGridSize = 25;
            posX = Math.round(posX / baseGridSize) * baseGridSize;
            posY = Math.round(posY / baseGridSize) * baseGridSize;
            this.position({ x: posX, y: posY });
            n.position.x = posX;
            n.position.y = posY;
            MoveNodes();
            TakeGraphPictureAndUpdate();
        });

        cy.on("click", function (evt: any) {
            const evtTarget = evt.target;
            if (evtTarget === cy) {
                ClearConfigForm("");
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
                return;
            }
            if (evtTarget.group() === "edges") {
                const id = evtTarget.data().id;
                setSelectedEdgeId(id);
                setSelectedNodeId(null);
                ShowEdgeConfig(id);
                return;
            }
            const target_id = evt.target.id();
            const n = state.nodes.find((node: any) => node.data.id === target_id);
            if (!n) {
                return;
            }
            setSelectedNodeId(n.data.id);
            setSelectedEdgeId(null);

            if (n.config.type === "host") {
                ShowHostConfig(n);
            } else if (n.config.type === "l1_hub") {
                ShowHubConfig(n);
            } else if (n.config.type === "l2_switch") {
                ShowSwitchConfig(n);
            } else if (n.config.type === "router") {
                ShowRouterConfig(n);
            } else if (n.config.type === "server") {
                ShowServerConfig(n);
            }
        });

        cy.on("ehcomplete", (_event: any, sourceNode: any, targetNode: any, _addedEdge: any) => {
            AddEdge(sourceNode._private.data.id, targetNode._private.data.id);
            PostNodesEdges();
            TakeGraphPictureAndUpdate();
            SetNetworkPlayerState(-1);
        });

        const keyupHandler = (e: any) => {
            const evtTarget = e.target as unknown as HTMLInputElement | null;
            if (evtTarget && evtTarget.form) {
                return;
            }
            const nodeId = selectedNodeIdRef.current;
            const edgeId = selectedEdgeIdRef.current;

            if (e.keyCode === 46 && nodeId) {
                SaveNetworkObject();
                DeleteNode(nodeId);
                DeleteJob(nodeId);
                ClearConfigForm("");
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
                PostNodesEdges();
                cy.elements().remove();
                cy.add(state.nodes);
                cy.add(state.edges);
                TakeGraphPictureAndUpdate();
                SetNetworkPlayerState(-1);
            }
            if (e.keyCode === 46 && edgeId) {
                SaveNetworkObject();
                const ed = state.edges.find((edge: any) => edge.data.id === edgeId);
                if (ed) {
                    if (ed.data.source.startsWith("l2sw")) {
                        DeleteJob(ed.data.source);
                    }
                    if (ed.data.target.startsWith("l2sw")) {
                        DeleteJob(ed.data.target);
                    }
                }
                DeleteEdge(edgeId);
                ClearConfigForm("");
                setSelectedEdgeId(null);
                PostNodesEdges();
                cy.elements().remove();
                cy.add(state.nodes);
                cy.add(state.edges);
                TakeGraphPictureAndUpdate();
                SetNetworkPlayerState(-1);
            }
            if (e.keyCode === 90 && e.ctrlKey) {
                ClearConfigForm("");
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
                RestoreNetworkObject();
                PostNodesEdges();
                cy.elements().remove();
                cy.add(state.nodes);
                cy.add(state.edges);
                TakeGraphPictureAndUpdate();
                SetNetworkPlayerState(-1);
            }
        };
        document.addEventListener("keyup", keyupHandler);

        initGrid(cy);

        return () => {
            document.removeEventListener("keyup", keyupHandler);
            cy.destroy();
            cyRef.current = null;
            if (state.global_cy === cy) {
                state.global_cy = undefined;
            }
            state.global_eh = undefined;
        };
        // Run once: cy lifecycle is tied to the component mount, not
        // to state changes. Refreshes happen in the next effect.
    }, []);

    // Refresh effect: re-sync elements when DrawGraph bumps revision.
    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;
        // Skip on first revision since the mount effect already
        // populated cy from state.nodes/state.edges.
        if (revision === 0) return;
        cy.elements().remove();
        cy.autounselectify(true);
        cy.add(state.nodes);
        cy.add(state.edges);
        MarkLinkDownEdges(cy);
        cy.nodes().grabify();
        if (state.global_eh) {
            state.global_eh.enable();
        }
    }, [revision]);

    return null;
}
