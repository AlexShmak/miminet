// Shared setup for Vitest. Imports @testing-library/jest-dom matchers
// (`expect(...).toBeInTheDocument()` etc.) and stubs the browser-only
// globals the bundle reads at import time so module-load doesn't crash.

import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// jQuery is still loaded at runtime by the production HTML but isn't
// part of the bundle. Many config_forms modules call `$('#x').load(...)`
// at the top level for their side-effect setup. A chainable proxy
// stub keeps module imports from crashing in tests — individual tests
// can mock specific selectors when they need real behaviour.
function chainableJQueryStub(): any {
    const handler: ProxyHandler<any> = {
        get: () => chainableJQueryStub(),
        apply: () => chainableJQueryStub(),
    };
    return new Proxy(function () {}, handler);
}
(globalThis as any).$ = chainableJQueryStub();
(globalThis as any).jQuery = chainableJQueryStub();

// Other classic-script globals the bundle reads at module-load time.
(globalThis as any).ExternalUrlFor = (path: string) => path;
(globalThis as any).ajaxWithAuth = vi.fn();

// cytoscape comes in via a classic <script> tag at runtime, not from
// npm. Tests that exercise canvas code mock it themselves.
(globalThis as any).cytoscape = vi.fn();

// Yandex Metrica goal tracker is conditional via `typeof window.ym !==
// "undefined"`; leave it undefined so the guards take the false branch.

// React Testing Library auto-cleanup after each test prevents leaked
// React roots from affecting subsequent tests.
afterEach(() => {
    cleanup();
});
