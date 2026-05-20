// Sanity checks for the shared `state` object — it's the source of
// truth for the bundle's runtime data and the window-bridge layer.

import { describe, it, expect } from "vitest";
import { state, LINK_DOWN_JOB_ID, uid } from "../../src/lib/state";

describe("state initial defaults", () => {
    it("has empty arrays / safe scalars for initial-state fields", () => {
        // These start empty and are populated by lib/initial_state.ts
        // from the JSON `<script>` tag. Modules that read them at
        // bundle-load time depend on the defaults below being safe.
        expect(Array.isArray(state.nodes)).toBe(true);
        expect(Array.isArray(state.edges)).toBe(true);
        expect(Array.isArray(state.jobs)).toBe(true);
        expect(Array.isArray(state.pcaps)).toBe(true);
        expect(state.network_guid).toBe("");
        expect(state.network_title).toBe("");
        expect(state.network_description).toBe("");
        expect(state.network_zoom).toBe(1);
        expect(state.network_pan_x).toBe(0);
        expect(state.network_pan_y).toBe(0);
        expect(state.mode).toBe("");
        expect(state.simulation_id).toBe(-1);
    });

    it("packetFilterState defaults to all-disabled", () => {
        // packetFilterState comes through the window bridge — the
        // fallback in the getter is the default below.
        const initialFilter = state.packetFilterState;
        expect(initialFilter.hideARP).toBe(false);
        expect(initialFilter.hideSTP).toBe(false);
        expect(initialFilter.hideSYN).toBe(false);
    });

    it("LINK_DOWN_JOB_ID is stable at 6", () => {
        // Backend reads this id to identify link-down jobs; changing
        // it without the backend change breaks STP/link-down tests.
        expect(LINK_DOWN_JOB_ID).toBe(6);
    });
});

describe("uid()", () => {
    it("returns a non-empty string", () => {
        expect(typeof uid()).toBe("string");
        expect(uid().length).toBeGreaterThan(0);
    });

    it("is unlikely to collide on rapid calls", () => {
        const set = new Set<string>();
        for (let i = 0; i < 1000; i++) {
            set.add(uid());
        }
        // Hard requirement: at least 999 unique out of 1000 — random
        // suffix prevents same-millisecond collisions.
        expect(set.size).toBeGreaterThanOrEqual(999);
    });
});
