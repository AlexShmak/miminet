/**
 * Ambient declarations for runtime globals the bundle still touches.
 *
 * Most of what used to live here is gone now — the per-page state vars
 * (`nodes`, `edges`, `jobs`, …) moved into `lib/state.ts`, and the
 * cross-module function references became real ESM imports.
 *
 * What's left:
 * - 3rd-party UMD globals loaded as classic `<script src="…">` tags
 *   that we use by bare name (cytoscape, Pjax, Yandex Metrica's `ym`).
 * - Per-page Jinja-emitted form-id constants — small enough to keep as
 *   ambient consts until templates emit them via `data-` attributes.
 * - Window properties the bundle reads/writes (auth flag set inline,
 *   classic-script state singletons in netfront/state.ts).
 */

declare const cy: any;
declare const eh: any;
declare const simulation: any;

declare const ExternalUrlFor: any;

declare const Pjax: any;

// cytoscape loaded via classic <script src="cytoscape.min.js">. The
// @types/cytoscape package types it as a module, but since we read it
// as a runtime global the simplest shim is `any`. Per-callsite typing
// can be added when each subsystem stabilises.
declare const cytoscape: any;

// Yandex Metrica goal-tracking, loaded externally.
declare function ym(...args: any[]): any;

// Bootstrap 5 exposes its UMD bundle on `window.bootstrap`. The bundle
// uses Modal.getOrCreateInstance(el).show() / .hide() / .toggle().
interface BootstrapModalInstance {
    show: () => void;
    hide: () => void;
    toggle: () => void;
    dispose: () => void;
}
interface BootstrapModalCtor {
    getOrCreateInstance: (el: Element, options?: unknown) => BootstrapModalInstance;
    getInstance: (el: Element) => BootstrapModalInstance | null;
    new (el: Element, options?: unknown): BootstrapModalInstance;
}
interface BootstrapAlertInstance {
    close: () => void;
    dispose: () => void;
}
interface BootstrapAlertCtor {
    getOrCreateInstance: (el: Element, options?: unknown) => BootstrapAlertInstance;
    new (el: Element, options?: unknown): BootstrapAlertInstance;
}
interface BootstrapTooltipCtor {
    new (el: Element, options?: unknown): unknown;
    getOrCreateInstance: (el: Element, options?: unknown) => unknown;
}

interface Window {
    bootstrap: {
        Modal: BootstrapModalCtor;
        Alert: BootstrapAlertCtor;
        Tooltip: BootstrapTooltipCtor;
    };
    // Set inline in base.html from Flask's `current_user.is_authenticated`.
    isAuthenticated?: boolean;
    // Set inline in base.html from the request endpoint.
    isSharedNetwork?: boolean;
    // Yandex Metrica.
    ym?: any;

    // Classic-script state singletons that netfront/state.ts seeds on
    // bundle load (kept for back-compat with the few selenium checks
    // that still go through window).
    SimulationId?: number;
    lastSimulationId?: number;
    global_cy?: any;
    global_eh?: any;
    NetworkUpdateTimeoutId?: number;
    NetworkCache?: unknown[];
    packetsNotFiltered?: any;
    packetFilterState?: {
        hideARP: boolean;
        hideSTP: boolean;
        hideSYN: boolean;
    };
    gridCanvasLayer?: any;
    gridEnabled?: boolean;
    currentGridZoom?: number;

    // Read by lib/initial_state.ts shim for selenium fixture compat.
    packets?: any;
    pcaps?: string[];
}
