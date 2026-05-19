/**
 * Ambient declarations for classic-script globals that ES modules in
 * web/src/ still read. These names are defined elsewhere — `var nodes =
 * {{ nodes | safe }}` etc. in network*.html templates, or by classic
 * scripts like netfront.js — and need to be reachable from TS without
 * pulling jQuery / Cytoscape type packages just yet.
 *
 * The cross-module function declarations below mirror the pattern of
 * `attachGlobals` in main.ts: every ESM export is re-attached to
 * `window`, so bare-name references between modules still resolve. As
 * we migrate to explicit imports the matching `declare function` lines
 * can be deleted.
 */

// Templates emit `var nodes = ...`, `var edges = ...`, `var jobs = ...`
// at top level and the code mutates these in place (e.g. RestoreNetworkObject).
declare let nodes: any;
declare let edges: any;
declare let jobs: any;
declare const cy: any;
declare const eh: any;
declare const simulation: any;

declare const ExternalUrlFor: any;
declare const network_guid: string;
declare const csrf_token: string;
declare let pcaps: string[];
// `var packets = {{ packets | safe }}` in templates; mutable.
declare let packets: any;

// network.html / index.html Jinja-templated viewport hints.
declare const network_zoom: number;
declare const network_pan_x: number;
declare const network_pan_y: number;
declare const network_title: string;
declare const network_description: string;

declare const config_content_id: string;
declare const config_content_save_tag: string;
declare const config_content_save_id: string;
declare const config_hub_main_form_id: string;
declare const config_edge_main_form_id: string;
declare const config_switch_main_form_id: string;

declare const Pjax: any;

// cytoscape loaded via classic <script src="cytoscape.min.js">. The
// @types/cytoscape package types it as a module, but since we read it
// as a runtime global the simplest shim is `any`. Per-callsite typing
// can be added when each subsystem stabilises.
declare const cytoscape: any;

// Cross-module bare function references — see header comment.
declare function updateGridForConfigPanel(...args: any[]): any;
declare function DeleteAndSaveJob(...args: any[]): any;
declare function UpdateHostConfiguration(...args: any[]): any;
declare function UpdateRouterConfiguration(...args: any[]): any;
declare function UpdateServerConfiguration(...args: any[]): any;
declare function UpdateHubConfiguration(...args: any[]): any;
declare function UpdateSwitchConfiguration(...args: any[]): any;
declare function UpdateEdgeConfiguration(...args: any[]): any;
declare function UpdateHostConfigurationForm(...args: any[]): any;
declare function addIpFieldHandlers(...args: any[]): any;
declare function EnterEditMode(...args: any[]): any;
