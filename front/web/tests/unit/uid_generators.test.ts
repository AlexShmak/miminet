// HostUid / RouterUid / ServerUid scan `state.nodes` for the first
// available "<prefix>_N" name. The collision-fallback path (all 99
// slots taken) returns "<prefix>_" + a random uid().

import { describe, it, expect, beforeEach } from "vitest";
import { HostUid, RouterUid, ServerUid } from "../../src/network-editor/state";
import { state } from "../../src/shared/state";

beforeEach(() => {
    state.nodes = [];
});

describe("HostUid", () => {
    it("returns host_1 when no hosts exist", () => {
        expect(HostUid()).toBe("host_1");
    });

    it("skips taken slots", () => {
        state.nodes = [
            { data: { id: "host_1" } },
            { data: { id: "host_2" } },
            { data: { id: "host_4" } },
        ];
        expect(HostUid()).toBe("host_3");
    });

    it("returns next slot after sequential fills", () => {
        for (let i = 1; i <= 5; i++) state.nodes.push({ data: { id: `host_${i}` } });
        expect(HostUid()).toBe("host_6");
    });

    it("returns a random uid suffix when all 99 slots are taken", () => {
        for (let i = 1; i < 100; i++) state.nodes.push({ data: { id: `host_${i}` } });
        const result = HostUid();
        expect(result).toMatch(/^host_/);
        expect(result).not.toBe("host_99");
        // The random suffix is uid() = Date.now() in base 36 + random
        expect(result.length).toBeGreaterThan("host_".length + 4);
    });

    it("ignores non-host nodes", () => {
        state.nodes = [
            { data: { id: "router_1" } },
            { data: { id: "l2sw1" } },
            { data: { id: "server_1" } },
        ];
        expect(HostUid()).toBe("host_1");
    });
});

describe("RouterUid", () => {
    it("returns router_1 when no routers exist", () => {
        expect(RouterUid()).toBe("router_1");
    });

    it("doesn't collide with hosts of the same number", () => {
        state.nodes = [{ data: { id: "host_1" } }];
        expect(RouterUid()).toBe("router_1");
    });
});

describe("ServerUid", () => {
    it("returns server_1 when none exist", () => {
        expect(ServerUid()).toBe("server_1");
    });

    it("finds gap after a delete-then-add pattern", () => {
        state.nodes = [{ data: { id: "server_1" } }, { data: { id: "server_3" } }];
        expect(ServerUid()).toBe("server_2");
    });
});
