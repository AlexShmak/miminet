import { state } from "../lib/state";
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
} from "./show_config";
import { ClearConfigForm } from "../config_forms/common";

export const DrawGraph = function() {

    let selecteed_node_id: any = 0;
    let selected_edge_id: any = 0;

    // Do we already have one?
    let cy: any;

    if (state.global_cy)
    {
        let cy = state.global_cy;

        var collection = cy.elements();
        cy.remove(collection);
        cy.autounselectify(true);
        cy.add(nodes);
        cy.add(edges);
        MarkLinkDownEdges(cy);
        cy.nodes().grabify();
        state.global_eh.enable();
        return;
    }

    cy = cytoscape({
        container: document.getElementById("network_scheme"),
        boxSelectionEnabled: true,
        autounselectify: true,
        style: prepareStylesheet(),
        elements: [],
        layout: 'preset',
        zoom: network_zoom,
        pan: { x: network_pan_x, y: network_pan_y },
        fit: true,
    });

    state.global_cy = cy;

    // the default values of each option are outlined below:
    let defaults = {
        canConnect: function( sourceNode, targetNode ){

            // whether an edge can be created between source and target
        return !sourceNode.same(targetNode); // e.g. disallow loops
        },

        edgeParams: function( sourceNode, targetNode ){

            // for edges between the specified source and target
            // return element object to be passed to cy.add() for edge
            return {};
        },

        hoverDelay: 150, // time spent hovering over a target node before it is considered selected
        snap: false, // when enabled, the edge can be drawn by just moving close to a target node (can be confusing on compound graphs)
        snapThreshold: 50, // the target node must be less than or equal to this many pixels away from the cursor/finger
        snapFrequency: 15, // the number of times per second (Hz) that snap checks done (lower is less expensive)
        noEdgeEventsInDraw: true, // set events:no to edges during draws, prevents mouseouts on compounds
        disableBrowserGestures: true // during an edge drawing gesture, disable browser gestures such as two-finger trackpad swipe and pinch-to-zoom
    };

    state.global_eh = cy.edgehandles(defaults);

    cy.minZoom(0.5);
    cy.maxZoom(2);

    cy.add(nodes);
    cy.add(edges);

    // Mark edges that have a link-down job configured
    MarkLinkDownEdges(cy);

    // Auto-snap existing network nodes on load
    SnapNodesToGrid(cy);

    // Changing zoom
    cy.on('zoom', function(evt){

        if (state.networkUpdateTimeoutId >= 0){
            clearTimeout(state.networkUpdateTimeoutId);
            state.networkUpdateTimeoutId = -1;
        }

        state.networkUpdateTimeoutId = setTimeout(UpdateNetworkConfig, 2000);
        
        // Update grid zoom and redraw
        if (state.gridCanvasLayer) {
            state.currentGridZoom = cy.zoom();
            drawGrid();
        }
    });

    // Changing the pan
    cy.on('pan', function(evt){

        if (state.networkUpdateTimeoutId >= 0){
            clearTimeout(state.networkUpdateTimeoutId);
            state.networkUpdateTimeoutId = -1;
        }

        state.networkUpdateTimeoutId = setTimeout(UpdateNetworkConfig, 2000);
        
        // Update grid when panning to keep it aligned with nodes
        if (state.gridCanvasLayer) {
            drawGrid();
        }
    });

    // Looking for a position changing
    cy.on('dragfree', 'node', function(this: any, evt){

        //let node_id = evt.target.id();
        let n = nodes.find(n => n.data.id === this.id());

        if (!n) {
            return;
        }

        // Get current position
        let posX = this.position().x;
        let posY = this.position().y;

        // Snap to grid (like draw.io)
        const baseGridSize = 25;
        
        // Snap position to nearest grid intersection
        posX = Math.round(posX / baseGridSize) * baseGridSize;
        posY = Math.round(posY / baseGridSize) * baseGridSize;
        
        // Apply snapped position back to node
        this.position({
            x: posX,
            y: posY
        });

        n.position.x = posX;
        n.position.y = posY;

        MoveNodes();
        TakeGraphPictureAndUpdate();
    });

    // Click on object
    cy.on('click', function (evt) {

        let evtTarget = evt.target;

        // Is this cy ?
        if (evtTarget === cy) {
            ClearConfigForm('');
            selecteed_node_id = 0;
            selected_edge_id = 0;
            return;
        }

        // Is this edge ?
        if (evtTarget.group() === 'edges'){
            selected_edge_id = evtTarget.data().id;
            ShowEdgeConfig(selected_edge_id);
            selecteed_node_id = 0;
            return;
        }

        // Maybe host ?
        var target_id = evt.target.id();
        let n = nodes.find(n => n.data.id === target_id);

        if (!n) {
            return;
        }

        selecteed_node_id = n.data.id;
        selected_edge_id = 0;

        if (n.config.type === 'host'){
            ShowHostConfig(n);
        } else if (n.config.type === 'l1_hub'){
            ShowHubConfig(n);
        } else if (n.config.type === 'l2_switch'){
            ShowSwitchConfig(n);
        } else if (n.config.type === 'router'){
            ShowRouterConfig(n);
        } else if (n.config.type === 'server'){
            ShowServerConfig(n);
        }
    });

    // Add edge to the edges[] and then save it to the server.
    cy.on('ehcomplete', (event, sourceNode, targetNode, addedEdge) => {
        AddEdge(sourceNode._private.data.id, targetNode._private.data.id);
        PostNodesEdges();
        TakeGraphPictureAndUpdate();

        SetNetworkPlayerState(-1);
    });

    $(document).on('keyup', function(e){

        const evtTarget = e.target as unknown as HTMLInputElement | null;
        if (evtTarget && evtTarget.form) {
            return;
        }

        if (e.keyCode == 46 && selecteed_node_id) {

            // Save the network state.
            SaveNetworkObject();

            DeleteNode(selecteed_node_id);
            DeleteJob(selecteed_node_id);

            ClearConfigForm('');
            selecteed_node_id = 0;
            selected_edge_id = 0;

            PostNodesEdges();               // Update network on server
            cy.elements().remove();
            cy.add(nodes);
            cy.add(edges);

            TakeGraphPictureAndUpdate();

            // Reset network state
            SetNetworkPlayerState(-1);
        }
        if (e.keyCode ==  46 && selected_edge_id) {

            // Save the network state.
            SaveNetworkObject();
            
            // If the source or target is a switch, delete the jobs.
            let ed = edges.find(ed => ed.data.id === selected_edge_id);
            if (ed){
                if (ed.data.source.startsWith("l2sw")){
                    DeleteJob(ed.data.source)
                }
                if (ed.data.target.startsWith("l2sw")){
                    DeleteJob(ed.data.target)
                }
            }
            DeleteEdge(selected_edge_id);

            ClearConfigForm('');
            selected_edge_id = 0;

            PostNodesEdges();               // Update network on server
            cy.elements().remove();
            cy.add(nodes);
            cy.add(edges);

            TakeGraphPictureAndUpdate();

            // Reset network state
            SetNetworkPlayerState(-1);
        }

        if (e.keyCode == 90 && e.ctrlKey){

            ClearConfigForm('');
            selecteed_node_id = 0;
            selected_edge_id = 0;

            RestoreNetworkObject();

            PostNodesEdges();               // Update network on server
            cy.elements().remove();
            cy.add(nodes);
            cy.add(edges);

            TakeGraphPictureAndUpdate();

            // Reset network state
            SetNetworkPlayerState(-1);
        }

    });
    
    // Initialize grid
    initGrid(cy);
}

export const DrawGraphStatic = function(nodes, edges, shared=0) {

    // Do we already have one?
    let cy: any;

    let network_scheme_id = "network_scheme";

    if (shared){
        let network_scheme_id = "network_scheme_shared";
    }

    if (state.global_cy)
    {
        let cy = state.global_cy;
        cy.elements().remove();
    } else {
        cy = cytoscape({
            container: document.getElementById(network_scheme_id),
            boxSelectionEnabled: true,
            autounselectify: false,
            style: prepareStylesheet(),
            elements: [],
            layout: 'preset',
            zoom: network_zoom,
            pan: { x: network_pan_x, y: network_pan_y },
            fit: true,
        });

         state.global_cy = cy;
    }

    // Turn off edges creation.
    if (state.global_eh){
        state.global_eh.disable();
    }

    cy.autounselectify(false);
    cy.add(nodes);
    cy.add(edges);
    MarkLinkDownEdges(cy);
    cy.nodes().ungrabify();

    // Initialize grid
    initGrid(cy);

    return;
}

export const DrawSharedGraph = function(nodes, edges) {

    let selecteed_node_id: any = 0;
    let selected_edge_id: any = 0;

    // Do we already have one?
    let cy: any;

    if (state.global_cy)
    {
        let cy = state.global_cy;
        cy.elements().remove();
    } else {
        cy = cytoscape({
            container: document.getElementById("network_scheme_shared"),
            boxSelectionEnabled: true,
            autounselectify: true,
            style: prepareStylesheet(),
            elements: [],
            layout: 'preset',
            zoom: network_zoom,
            pan: { x: network_pan_x, y: network_pan_y },
            fit: true,
        });

        state.global_cy = cy;
    }

    cy.autounselectify(true);

    cy.minZoom(0.5);
    cy.maxZoom(2);

    cy.add(nodes);
    cy.add(edges);
    MarkLinkDownEdges(cy);

    // Click on object
    cy.on('click', function (evt) {

        let evtTarget = evt.target;
        if (evtTarget === cy) {
            ClearConfigForm('');
            selecteed_node_id = 0;
            selected_edge_id = 0;
            return;
        }

        // Is this edge ?
        if (evtTarget.group() === 'edges'){
            selected_edge_id = evtTarget.data().id;
            ShowEdgeConfig(selected_edge_id, 1);
            selecteed_node_id = 0;
            return;
        }

        var target_id = evt.target.id();
        let n = nodes.find(n => n.data.id === target_id);

        if (!n) {
            return;
        }

        selecteed_node_id = n.data.id;
        selected_edge_id = 0;

        if (n.config.type === 'host'){
            ShowHostConfig(n, 1);
        } else if (n.config.type === 'l1_hub'){
            ShowHubConfig(n, 1);
        } else if (n.config.type === 'l2_switch'){
            ShowSwitchConfig(n, 1);
        } else if (n.config.type === 'router'){
            ShowRouterConfig(n, 1);
        } else if (n.config.type === 'server'){
            ShowServerConfig(n, 1);
        }
    });
    
    // Initialize grid
    initGrid(cy);
}

export const DrawIndexGraphStatic = function(nodes, edges, container_id, graph_network_zoom,
                                    graph_network_pan_x, graph_network_pan_y)
{

    let index_cy = cytoscape({
        container: document.getElementById(container_id),
        boxSelectionEnabled: true,
        autounselectify: false,
        style: prepareStylesheet(),
        elements: [],
        layout: 'preset',
        zoom: graph_network_zoom,
            pan: { x: graph_network_pan_x, y: graph_network_pan_y },
            fit: true,
        });

    index_cy.autounselectify(false);

    index_cy.add(nodes);
    index_cy.add(edges);
    index_cy.panningEnabled(false);

    index_cy.nodes().ungrabify();
    return index_cy;
}

// Check whether simulation is over and we can run packets
