// Render-branch tests for SimulationPlayer. The component has 4 visual
// states driven by `mode` + `simulationId` + `state.packets`:
//
//   editor + no packets + simulationId === 0  → "Эмулировать" button
//   editor + no packets + simulationId > 0    → "Эмулируется..." (disabled)
//   shared + no packets                       → "Нет эмуляции" (disabled)
//   any mode + packets present                → stop / play-pause / slider
//
// Heavy collaborators (PacketPlayer, ajax, draw helpers) are mocked.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../src/simulation/packet_player", () => ({
    PacketPlayer: {
        getInstance: () => ({
            InitPlayer: vi.fn(),
            StartPlayer: vi.fn(),
            PausePlayer: vi.fn(),
            StopPlayer: vi.fn(),
            getPlayerPause: () => 0,
            setAnimationTrafficStepCallback: vi.fn(),
            resetAnimationTrafficStepCallback: vi.fn(),
            getAnimationTrafficStep: () => 0,
        }),
    },
}));

vi.mock("../../src/simulation/simulation", () => ({
    CheckSimulation: vi.fn(),
    InsertWaitingTime: vi.fn(),
}));

vi.mock("../../src/network-editor/runtime", () => ({
    RunSimulation: vi.fn(),
}));

vi.mock("../../src/network-editor/draw", () => ({
    DrawGraphStatic: vi.fn(),
    DrawSharedGraph: vi.fn(),
}));

import { SimulationPlayer } from "../../src/simulation/SimulationPlayer";
import { state } from "../../src/shared/state";

beforeEach(() => {
    state.packets = null;
    state.jobs = [];
    state.nodes = [];
});

describe("SimulationPlayer", () => {
    it("editor + idle: renders the 'Эмулировать' run button", () => {
        render(<SimulationPlayer mode="editor" simulationId={0} revision={1} />);
        const btn = screen.getByText("Эмулировать") as HTMLButtonElement;
        expect(btn.disabled).toBe(false);
        expect(btn.id).toBe("NetworkEmulateButton");
    });

    it("editor + simulating: renders the disabled 'Эмулируется...' button", () => {
        render(<SimulationPlayer mode="editor" simulationId={42} revision={1} />);
        const btn = screen.getByText("Эмулируется...") as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
    });

    it("shared + no packets: renders the disabled 'Нет эмуляции' button", () => {
        render(<SimulationPlayer mode="shared" simulationId={0} revision={1} />);
        const btn = screen.getByText("Нет эмуляции") as HTMLButtonElement;
        expect(btn.disabled).toBe(true);
    });

    it("editor + packets ready: renders stop / play-pause / slider", () => {
        state.packets = [
            [{ data: { label: "ICMP echo-request" } }],
            [{ data: { label: "ICMP echo-reply" } }],
        ];
        render(<SimulationPlayer mode="editor" simulationId={0} revision={1} />);

        expect(document.getElementById("NetworkStopButton")).toBeTruthy();
        expect(document.getElementById("NetworkPlayPauseButton")).toBeTruthy();
        const slider = document.getElementById("PacketSliderInput") as HTMLInputElement;
        expect(slider).toBeTruthy();
        expect(slider.type).toBe("range");
        expect(slider.min).toBe("1");
        expect(slider.max).toBe("2");
    });

    it("shared + packets ready: renders the same player UI as editor", () => {
        state.packets = [[{ data: { label: "ARP" } }]];
        render(<SimulationPlayer mode="shared" simulationId={0} revision={1} />);

        expect(document.getElementById("NetworkStopButton")).toBeTruthy();
        expect(document.getElementById("NetworkPlayPauseButton")).toBeTruthy();
        expect(document.getElementById("PacketSliderInput")).toBeTruthy();
    });

    it("slider max is at least 1 even if packets is empty array (defensive)", () => {
        state.packets = [];
        render(<SimulationPlayer mode="editor" simulationId={0} revision={1} />);
        const slider = document.getElementById("PacketSliderInput") as HTMLInputElement;
        expect(slider).toBeTruthy();
        expect(parseInt(slider.max, 10)).toBeGreaterThanOrEqual(1);
    });
});
