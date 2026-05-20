import { describe, it, expect } from "vitest";
import {
    isValidVNI,
    isValidIP,
    areVxlanInterfaceFieldsFilled,
} from "../../src/device-config/vxlan";
import { areInterfaceFieldsFilled } from "../../src/device-config/vlan";

describe("isValidVNI", () => {
    it("accepts 1 to 16777214", () => {
        expect(isValidVNI(1)).toBe(true);
        expect(isValidVNI(100)).toBe(true);
        expect(isValidVNI(16777214)).toBe(true);
    });

    it("rejects 0 and negatives", () => {
        expect(isValidVNI(0)).toBe(false);
        expect(isValidVNI(-1)).toBe(false);
    });

    it("rejects values above the max", () => {
        expect(isValidVNI(16777215)).toBe(false);
        expect(isValidVNI(100000000)).toBe(false);
    });

    it("rejects non-integers", () => {
        expect(isValidVNI(1.5)).toBe(false);
        expect(isValidVNI("abc")).toBe(false);
        expect(isValidVNI(NaN)).toBe(false);
        expect(isValidVNI(null)).toBe(false);
        expect(isValidVNI(undefined)).toBe(false);
    });

    it("accepts numeric strings (Number coerces them)", () => {
        expect(isValidVNI("100")).toBe(true);
        expect(isValidVNI("1")).toBe(true);
    });
});

describe("isValidIP", () => {
    it("accepts well-formed IPv4 addresses", () => {
        expect(isValidIP("192.168.1.1")).toBe(true);
        expect(isValidIP("10.0.0.1")).toBe(true);
        expect(isValidIP("255.255.255.255")).toBe(true);
        expect(isValidIP("0.0.0.0")).toBe(true);
    });

    it("rejects octets above 255", () => {
        expect(isValidIP("256.0.0.0")).toBe(false);
        expect(isValidIP("192.168.1.999")).toBe(false);
    });

    it("rejects non-IPv4 strings", () => {
        expect(isValidIP("hello")).toBe(false);
        expect(isValidIP("")).toBe(false);
        expect(isValidIP("1.2.3")).toBe(false);
        expect(isValidIP("1.2.3.4.5")).toBe(false);
        expect(isValidIP("::1")).toBe(false);
    });
});

describe("areInterfaceFieldsFilled (VLAN)", () => {
    it("returns true when any interface has both vlan and type_connection", () => {
        const device = {
            interface: [
                { id: "a", vlan: null, type_connection: null },
                { id: "b", vlan: 10, type_connection: 0 },
            ],
        };
        expect(areInterfaceFieldsFilled(device)).toBe(true);
    });

    it("returns false when no interface has both fields", () => {
        const device = {
            interface: [
                { id: "a", vlan: null, type_connection: null },
                { id: "b", vlan: 10, type_connection: null },
                { id: "c", vlan: null, type_connection: 1 },
            ],
        };
        expect(areInterfaceFieldsFilled(device)).toBe(false);
    });

    it("returns false on empty interface list", () => {
        expect(areInterfaceFieldsFilled({ interface: [] })).toBe(false);
    });

    it("accepts vlan=0 and type_connection=0 as filled (only null/undefined are 'unfilled')", () => {
        const device = {
            interface: [{ id: "a", vlan: 0, type_connection: 0 }],
        };
        expect(areInterfaceFieldsFilled(device)).toBe(true);
    });
});

describe("areVxlanInterfaceFieldsFilled", () => {
    it("returns true with a client-mode iface that has vxlan_vni", () => {
        const device = {
            interface: [{ vxlan_vni: 100, vxlan_connection_type: 0 }],
        };
        expect(areVxlanInterfaceFieldsFilled(device)).toBe(true);
    });

    it("returns true with a network-mode iface that has vxlan_vni_to_target_ip", () => {
        const device = {
            interface: [
                {
                    vxlan_vni: null,
                    vxlan_connection_type: 1,
                    vxlan_vni_to_target_ip: [[100, "192.168.1.1"]],
                },
            ],
        };
        expect(areVxlanInterfaceFieldsFilled(device)).toBe(true);
    });

    it("returns false when vxlan_connection_type is unset", () => {
        const device = {
            interface: [{ vxlan_vni: 100, vxlan_connection_type: null }],
        };
        expect(areVxlanInterfaceFieldsFilled(device)).toBe(false);
    });

    it("returns false on empty target_ip array even if connection_type set", () => {
        const device = {
            interface: [
                {
                    vxlan_vni: null,
                    vxlan_connection_type: 1,
                    vxlan_vni_to_target_ip: [],
                },
            ],
        };
        expect(areVxlanInterfaceFieldsFilled(device)).toBe(false);
    });
});
