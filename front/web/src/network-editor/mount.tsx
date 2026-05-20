// Singleton React root for the NetworkEditor component. `DrawGraph()`
// goes through here — first call mounts the component, every later
// call bumps the revision to trigger a re-sync of cy with the latest
// `state.nodes`/`state.edges`.

import { createRoot, type Root } from "react-dom/client";
import { NetworkEditor } from "./NetworkEditor";

let root: Root | null = null;
let revision = 0;

function getOrCreateContainer(): HTMLElement {
    let mount = document.getElementById("network-editor-react-root");
    if (!mount) {
        mount = document.createElement("div");
        mount.id = "network-editor-react-root";
        // Hidden — the component owns side effects only; the visible
        // canvas is the existing `#network_scheme` div.
        mount.style.display = "none";
        document.body.appendChild(mount);
    }
    return mount;
}

export function mountNetworkEditor() {
    const container = getOrCreateContainer();
    if (!root) {
        root = createRoot(container);
    }
    revision += 1;
    root.render(<NetworkEditor revision={revision} />);
}
