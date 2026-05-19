// Singleton React root for the SimulationPlayer component. The
// existing `SetNetworkPlayerState` / `SetSharedNetworkPlayerState`
// entrypoints in netfront/runtime.ts now call into here instead of
// imperatively rebuilding the DOM.

import { createRoot, type Root } from "react-dom/client";
import { SimulationPlayer } from "../components/SimulationPlayer";

let root: Root | null = null;
let revision = 0;

function getOrCreateContainer(): HTMLElement | null {
    // The player markup lives next to a stable `#NetworkPlayer` anchor
    // in each template. Mount the React root into the parent wrapper,
    // wiping the static markup so React owns it.
    const networkPlayer = document.getElementById("NetworkPlayer");
    if (!networkPlayer) {
        return null;
    }
    const wrapper = networkPlayer.parentElement;
    if (!wrapper) {
        return null;
    }
    let mount = wrapper.querySelector<HTMLElement>("[data-simulation-player-root]");
    if (!mount) {
        wrapper.innerHTML = "";
        mount = document.createElement("div");
        mount.setAttribute("data-simulation-player-root", "");
        wrapper.appendChild(mount);
    }
    return mount;
}

export function mountSimulationPlayer(props: { mode: "editor" | "shared"; simulationId: number }) {
    const container = getOrCreateContainer();
    if (!container) {
        return;
    }
    if (!root) {
        root = createRoot(container);
    }
    revision += 1;
    root.render(
        <SimulationPlayer mode={props.mode} simulationId={props.simulationId} revision={revision} />
    );
}
