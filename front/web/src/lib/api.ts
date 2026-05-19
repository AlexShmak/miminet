// The single public API surface the bundle exposes to inline HTML
// scripts and selenium-style external callers.
//
// All other module exports stay scoped to the bundle's IIFE. Replaces
// the legacy `attachGlobals` pattern that sprinkled every export onto
// `window` without intent.
//
// Inline templates use `miminet.X` (or `window.miminet.X`) instead of
// bare-name calls. Inline `onclick="X()"` handlers are migrated to
// `data-action="..."` attributes wired by lib/boot.ts.

import { state } from "./state";
import { DrawGraph, DrawSharedGraph, BootIndexDemo } from "../netfront/draw";
import {
    SetNetworkPlayerState,
    SetSharedNetworkPlayerState,
    CopyNetwork,
    SetPacketFilter,
    UpdateNetworkConfig,
    SaveAnimationFilters,
    UpdateFilterStates,
} from "../netfront/runtime";
import { AddEdge, PostNodesEdges } from "../netfront/network_ops";
import {
    ShowHostConfig,
    ShowRouterConfig,
    ShowServerConfig,
    ShowHubConfig,
    ShowSwitchConfig,
    ShowEdgeConfig,
} from "../netfront/show_config";

export const MiminetAPI = {
    state,
    DrawGraph,
    DrawSharedGraph,
    BootIndexDemo,
    SetNetworkPlayerState,
    SetSharedNetworkPlayerState,
    CopyNetwork,
};

declare global {
    interface Window {
        miminet?: typeof MiminetAPI;
    }
}

window.miminet = MiminetAPI;

// Bare-name window aliases for the selenium fixture's `execute_script`
// calls in front/tests/utils/networks.py. The fixture invokes bundle
// functions like `AddEdge('a', 'b')` directly by name; until that
// fixture is rewritten to go through `window.miminet`, the aliases
// stay. Keep this list narrow and named — it is NOT a re-implementation
// of the old `attachGlobals` blanket pollution.
const w = window as unknown as Window & Record<string, unknown>;
w.AddEdge = AddEdge;
w.DrawGraph = DrawGraph;
w.PostNodesEdges = PostNodesEdges;
w.ShowHostConfig = ShowHostConfig;
w.ShowRouterConfig = ShowRouterConfig;
w.ShowServerConfig = ShowServerConfig;
w.ShowHubConfig = ShowHubConfig;
w.ShowSwitchConfig = ShowSwitchConfig;
w.ShowEdgeConfig = ShowEdgeConfig;
w.SetPacketFilter = SetPacketFilter;
w.UpdateNetworkConfig = UpdateNetworkConfig;
w.SaveAnimationFilters = SaveAnimationFilters;
w.UpdateFilterStates = UpdateFilterStates;
