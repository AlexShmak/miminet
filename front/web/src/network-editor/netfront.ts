import { state } from "../shared/state";
// Drag-and-drop wiring: device palette icons (.drag) get dropped onto
// the cytoscape canvas (#network_scheme) to create new state.nodes.
//
// Implementation note: the previous jQuery UI version (draggable +
// droppable) was replaced with a plain mouse-event handler because
// Selenium's ActionChains uses synthetic mouse events that don't trigger
// HTML5 native drag events — so this layer must operate on mousedown /
// mousemove / mouseup directly.

import {
    SetNetworkPlayerState,
    SaveNetworkObject,
    CalculateDropOffset,
    TakeGraphPictureAndUpdate,
} from "./runtime";
import { HostUid, RouterUid, ServerUid } from "./state";
import { l1HubUid, l2SwitchUid } from "../device-config/show_config";
import { PostNodes } from "./network_ops";
import { DrawGraph } from "./draw";
import { PacketPlayer } from "../simulation/packet_player";

type DragSession = {
    sourceType: string;
    helper: HTMLElement;
    offsetX: number;
    offsetY: number;
};

let activeDrag: DragSession | null = null;

function isOverScheme(scheme: HTMLElement, clientX: number, clientY: number): boolean {
    const rect = scheme.getBoundingClientRect();
    return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
    );
}

function handleDrop(type: string, pageX: number, pageY: number) {
    if (PacketPlayer.getInstance().getPlayerPlay()) return;

    SetNetworkPlayerState(-1);
    SaveNetworkObject();

    const pos = CalculateDropOffset(pageX, pageY);

    if (type === "host") {
        const node_id = HostUid();
        state.nodes.push({
            data: { id: node_id, label: node_id },
            position: { x: pos.x, y: pos.y },
            classes: ["host"],
            config: { type: "host", label: node_id },
            interface: [],
        });
    } else if (type === "l2_switch") {
        const node_id = l2SwitchUid();
        state.nodes.push({
            data: { id: node_id, label: node_id },
            position: { x: pos.x, y: pos.y },
            classes: ["l2_switch"],
            config: { type: "l2_switch", label: node_id, stp: 0 },
            interface: [],
        });
    } else if (type === "l1_hub") {
        const node_id = l1HubUid();
        state.nodes.push({
            data: { id: node_id, label: node_id },
            position: { x: pos.x, y: pos.y },
            classes: ["l1_hub"],
            config: { type: "l1_hub", label: node_id },
            interface: [],
        });
    } else if (type === "l3_router") {
        const node_id = RouterUid();
        state.nodes.push({
            data: { id: node_id, label: node_id },
            position: { x: pos.x, y: pos.y },
            classes: ["l3_router"],
            config: { type: "router", label: node_id },
            interface: [],
        });
    } else if (type === "server") {
        const node_id = ServerUid();
        state.nodes.push({
            data: { id: node_id, label: node_id },
            position: { x: pos.x, y: pos.y },
            classes: ["server"],
            config: { type: "server", label: node_id },
            interface: [],
        });
    } else {
        return;
    }

    PostNodes();
    DrawGraph();
    TakeGraphPictureAndUpdate();
}

function startDrag(source: HTMLElement, event: MouseEvent) {
    const type = source.id;
    if (!type) return;

    const rect = source.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const helper = source.cloneNode(true) as HTMLElement;
    helper.style.position = "absolute";
    helper.style.pointerEvents = "none";
    helper.style.zIndex = "10000";
    helper.style.left = `${event.pageX - offsetX}px`;
    helper.style.top = `${event.pageY - offsetY}px`;
    helper.style.opacity = "0.85";
    helper.classList.add("drag-helper");
    document.body.appendChild(helper);

    activeDrag = { sourceType: type, helper, offsetX, offsetY };
}

function onMouseMove(event: MouseEvent) {
    if (!activeDrag) return;
    activeDrag.helper.style.left = `${event.pageX - activeDrag.offsetX}px`;
    activeDrag.helper.style.top = `${event.pageY - activeDrag.offsetY}px`;
}

function onMouseUp(event: MouseEvent) {
    if (!activeDrag) return;
    const session = activeDrag;
    activeDrag = null;

    const scheme = document.getElementById("network_scheme");
    const overTarget = scheme && isOverScheme(scheme, event.clientX, event.clientY);

    // Use the helper's final page-relative top-left as the drop position,
    // matching the legacy behavior of jQuery UI's `ui.position.{left,top}`.
    const dropPageX = event.pageX - session.offsetX;
    const dropPageY = event.pageY - session.offsetY;

    session.helper.remove();

    if (overTarget) {
        handleDrop(session.sourceType, dropPageX, dropPageY);
    }
}

export function initNetfrontDragDrop() {
    const palette = document.querySelectorAll<HTMLElement>(".drag");
    palette.forEach((el) => {
        el.addEventListener("mousedown", (event: MouseEvent) => {
            if (event.button !== 0) return; // left button only
            event.preventDefault();
            startDrag(el, event);
        });
    });

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

// Bind once the palette + canvas exist. The bundle still loads
// synchronously before <body> closes, so DOMContentLoaded is the
// reliable trigger.
const ready = () => {
    if (!document.getElementById("network_scheme")) {
        return;
    }
    initNetfrontDragDrop();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
} else {
    ready();
}
