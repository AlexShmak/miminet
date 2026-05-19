// Combined simulation player: stop / play-pause / range-slider /
// status-label, plus the "Эмулировать" / "Эмулируется..." / "Нет
// эмуляции" idle states. Replaces the giant jQuery-driven
// SetNetworkPlayerState / SetSharedNetworkPlayerState functions and
// the noUiSlider plugin.
//
// The component reads from the shared `state` object — packets show up
// asynchronously after the run-simulation ajax completes, and many
// other things in the bundle imperatively reset packets to null. To
// stay in sync with those external mutations, the parent mount helper
// passes a `revision` prop that bumps on every SetNetworkPlayerState
// call; the component recomputes derived UI state from `state.packets`
// whenever revision changes.

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { state } from "../lib/state";
import { PacketPlayer } from "../netfront/packet_player";
import { CheckSimulation, InsertWaitingTime } from "../netfront/simulation";
import { RunSimulation } from "../netfront/runtime";
import { DrawGraphStatic, DrawSharedGraph } from "../netfront/draw";

interface Props {
    mode: "editor" | "shared";
    simulationId: number;
    revision: number;
}

const numWord = (value: number, words: [string, string, string]): string => {
    value = Math.abs(value) % 100;
    const num = value % 10;
    if (value > 10 && value < 20) return words[2];
    if (num > 1 && num < 5) return words[1];
    if (num === 1) return words[0];
    return words[2];
};

export function SimulationPlayer({ mode, simulationId, revision }: Props) {
    // Snapshot of state.packets at mount/revision-change time. Tracking
    // it here lets the component re-render when the bundle mutates the
    // shared singleton (via the revision bump).
    const [packets, setPackets] = useState<any[] | null>(state.packets);
    const [currentStep, setCurrentStep] = useState<number>(1);
    // "idle" = play button visible; "playing" = pause button visible.
    const [playerMode, setPlayerMode] = useState<"idle" | "playing">("idle");

    // Re-snapshot state.packets whenever the parent bumps the revision.
    useEffect(() => {
        setPackets(state.packets);
        setCurrentStep(1);
        setPlayerMode("idle");
    }, [revision]);

    const stepCount = Array.isArray(packets) ? packets.length : 0;
    const inFlight = Array.isArray(packets) ? packets.reduce((c, row) => c + row.length, 0) : 0;

    // Polling for simulation result while emulating.
    useEffect(() => {
        if (mode === "editor" && !packets && simulationId > 0) {
            InsertWaitingTime();
            CheckSimulation(simulationId);
        }
    }, [mode, packets, simulationId]);

    // Init the packet player when packets become available.
    useEffect(() => {
        if (!packets) {
            return;
        }
        PacketPlayer.getInstance().InitPlayer(packets);
    }, [packets]);

    // Cleanup callback on unmount or when packets vanish.
    const stepCallbackInstalledRef = useRef(false);
    useEffect(() => {
        return () => {
            if (stepCallbackInstalledRef.current) {
                PacketPlayer.getInstance().resetAnimationTrafficStepCallback();
                stepCallbackInstalledRef.current = false;
            }
        };
    }, []);

    const startPlaying = () => {
        if (playerMode === "playing") return;
        setPlayerMode("playing");

        if (!PacketPlayer.getInstance().getPlayerPause()) {
            // Fresh start — redraw the graph statically before
            // overlaying animated packet sprites.
            if (mode === "editor") {
                DrawGraphStatic();
            } else {
                DrawSharedGraph();
            }
        }

        PacketPlayer.getInstance().setAnimationTrafficStepCallback(function () {
            setCurrentStep(PacketPlayer.getInstance().getAnimationTrafficStep());
        });
        stepCallbackInstalledRef.current = true;

        PacketPlayer.getInstance().StartPlayer(state.global_cy);
    };

    const pausePlaying = () => {
        setPlayerMode("idle");
        PacketPlayer.getInstance().PausePlayer();
    };

    const onStop = () => {
        PacketPlayer.getInstance().resetAnimationTrafficStepCallback();
        stepCallbackInstalledRef.current = false;
        PacketPlayer.getInstance().StopPlayer();
        setCurrentStep(1);
        setPlayerMode("idle");

        if (mode === "editor") {
            DrawGraphStatic();
        } else {
            DrawSharedGraph();
        }
    };

    const onPlayPauseClick = () => {
        if (typeof window.ym !== "undefined") {
            (window as any).ym(92293993, "reachGoal", "PlayPauseButton");
        }
        if (playerMode === "idle") {
            startPlaying();
        } else {
            pausePlaying();
        }
    };

    const onSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        if (Number.isNaN(value)) return;
        setCurrentStep(value);
        PacketPlayer.getInstance().setAnimationTrafficStep(value - 1);
    };

    const onEmulateClick = () => {
        if (!state.jobs.length) {
            ($("#noJobsModal") as any).modal("toggle");
            return;
        }
        if (state.nodes.length > 80) {
            ($("#tooManyHostModal") as any).modal("toggle");
            return;
        }
        if (typeof window.ym !== "undefined") {
            (window as any).ym(92293993, "reachGoal", "NetworkEmulate");
        }
        RunSimulation(state.network_guid);
        InsertWaitingTime();
    };

    // -- Render --

    // Packets ready: full player UI.
    if (packets) {
        const labelText =
            currentStep >= 1 && currentStep <= packets.length
                ? `Шаг: ${currentStep}/${packets.length} (${packets[currentStep - 1].length} ${numWord(
                      packets[currentStep - 1].length,
                      ["пакет", "пакета", "пакетов"]
                  )})`
                : `${packets.length} ${numWord(packets.length, ["шаг", "шага", "шагов"])} / ${inFlight} ${numWord(
                      inFlight,
                      ["пакет", "пакета", "пакетов"]
                  )}`;
        return (
            <>
                <div className="d-flex justify-content-center ws-shadow" id="NetworkPlayer">
                    <button
                        type="button"
                        className="btn btn-danger me-2"
                        id="NetworkStopButton"
                        onClick={onStop}
                    >
                        <i className="bx bx-stop fs-xl" />
                    </button>
                    <button
                        type="button"
                        className={`btn ${playerMode === "playing" ? "btn-warning" : "btn-success"}`}
                        id="NetworkPlayPauseButton"
                        onClick={onPlayPauseClick}
                    >
                        <i
                            className={`bx ${playerMode === "playing" ? "bx-pause" : "bx-play"} fs-xl`}
                        />
                    </button>
                </div>
                <div id="PacketSlider">
                    <div className="pt-3">
                        <input
                            type="range"
                            id="PacketSliderInput"
                            className="form-range mt-0 mb-2"
                            min={1}
                            max={Math.max(1, stepCount)}
                            step={1}
                            value={currentStep}
                            onChange={onSliderChange}
                        />
                    </div>
                </div>
                <small
                    id="NetworkPlayerLabel"
                    className="d-flex justify-content-center text-muted text-center"
                >
                    {labelText}
                </small>
            </>
        );
    }

    // Shared mode without packets: disabled "Нет эмуляции" button.
    if (mode === "shared") {
        return (
            <>
                <div className="d-flex justify-content-center ws-shadow" id="NetworkPlayer">
                    <button
                        type="button"
                        className="btn btn-primary w-100"
                        id="NetworkEmulateButton"
                        disabled
                    >
                        Нет эмуляции
                    </button>
                </div>
                <small
                    id="NetworkPlayerLabel"
                    className="d-flex justify-content-center text-muted text-center"
                />
            </>
        );
    }

    // Editor mode, currently simulating: disabled status button.
    if (simulationId > 0) {
        return (
            <>
                <div className="d-flex justify-content-center ws-shadow" id="NetworkPlayer">
                    <button
                        type="button"
                        className="btn btn-primary w-100"
                        id="NetworkEmulateButton"
                        disabled
                    >
                        Эмулируется...
                    </button>
                </div>
                <small
                    id="NetworkPlayerLabel"
                    className="d-flex justify-content-center text-muted text-center"
                />
            </>
        );
    }

    // Editor mode, idle: "Эмулировать" button.
    return (
        <>
            <div className="d-flex justify-content-center ws-shadow" id="NetworkPlayer">
                <button
                    type="button"
                    className="btn btn-primary w-100"
                    id="NetworkEmulateButton"
                    onClick={onEmulateClick}
                >
                    Эмулировать
                </button>
            </div>
            <small
                id="NetworkPlayerLabel"
                className="d-flex justify-content-center text-muted text-center"
            />
        </>
    );
}
