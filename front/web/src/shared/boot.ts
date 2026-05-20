// Page-aware bootstrap. Reads `state.mode` (set by shared/initial_state.ts
// from the JSON script tag) and runs the matching wiring without any
// inline kickoff <script> in the Jinja template.
//
// Also registers the document-level event delegation that replaces the
// inline `onclick="X()"` attributes.

import { state } from "./state";
import { DrawGraph } from "../network-editor/draw";
import { DrawSharedGraph } from "../network-editor/draw";
import { BootIndexDemo } from "../network-editor/draw";
import {
    SetNetworkPlayerState,
    SetSharedNetworkPlayerState,
    CopyNetwork,
} from "../network-editor/runtime";

declare const ym: any;

function wireImpulseBanner() {
    const close_impulse_btn = document.getElementById("ImpulseCloseButton");
    const impulse_div = document.getElementById("ImpulseDiv");

    if (impulse_div) {
        const impulse_ts = localStorage.getItem("impulse_2026");

        if (impulse_ts) {
            const now = Date.now();
            const diff = now - Number(impulse_ts);
            const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
            if (diff > threeDaysMs) {
                impulse_div.classList.remove("d-none");
            }
        } else {
            impulse_div.classList.remove("d-none");
        }
    }

    if (close_impulse_btn) {
        close_impulse_btn.addEventListener(
            "click",
            function () {
                if (typeof window.ym !== "undefined") {
                    ym(92293993, "reachGoal", "ImpulseClose");
                }
                localStorage.setItem("impulse_2026", Date.now().toString());
            },
            false
        );
    }
}

function wireIndexDemoClick() {
    const target = document.getElementById("index_network_example");
    if (target) {
        target.onclick = function () {
            window.open(
                "https://miminet.ru/web_network_shared?guid=d9012b77-fd52-48b0-b618-a3c3f55caf15",
                "_blank"
            );
        };
    }
}

// Click delegation for [data-action="..."] buttons — replaces inline
// onclick handlers without polluting `window` with every bundle export.
function wireDataActionDelegation() {
    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement | null;
        if (!target) return;
        const actionable = target.closest("[data-action]") as HTMLElement | null;
        if (!actionable) return;
        const action = actionable.getAttribute("data-action");
        switch (action) {
            case "copy-network":
                CopyNetwork();
                break;
            default:
                console.warn("Unknown data-action:", action);
        }
    });
}

function boot() {
    wireDataActionDelegation();

    switch (state.mode) {
        case "editor":
            SetNetworkPlayerState(state.simulation_id);
            DrawGraph();
            wireImpulseBanner();
            break;
        case "shared":
            SetSharedNetworkPlayerState();
            DrawSharedGraph();
            wireImpulseBanner();
            break;
        case "index":
            BootIndexDemo();
            wireIndexDemoClick();
            break;
        case "":
            // No miminet page mode set — nothing to boot.
            break;
        default:
            console.warn("Unknown miminet mode:", state.mode);
    }
}

// Run on DOM ready so the elements we wire/click delegate to exist.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}
