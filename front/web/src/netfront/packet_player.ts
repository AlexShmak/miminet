import { state } from "../lib/state";
// Packet animation player.
// Migrated from front/src/static/miminet_animation.js.
//
// Originally an IIFE-revealing-module singleton: `PacketPlayer.getInstance()`
// returns a controller object. Kept the singleton shape for compatibility
// with consumers that still call `PacketPlayer.getInstance().X(...)`.

import { uid, LINK_DOWN_JOB_ID } from "./state";
import { FindEdgeIdByJob, MarkLinkDownEdges } from "./network_ops";

interface PlayerInstance {
    InitPlayer: (packet: any) => void;
    StopPlayer: () => void;
    StartPlayer: (cy: any) => void;
    PausePlayer: () => void;
    getPlayerPause: () => number;
    getPlayerPlay: () => number;
    setAnimationTrafficStepCallback: (s: () => void) => void;
    resetAnimationTrafficStepCallback: () => void;
    getAnimationTrafficStep: () => number;
    setAnimationTrafficStep: (n: number) => void;
}

export const PacketPlayer = (function () {
    let animation_traffic_step = 0;
    const _animation_guid = uid();
    let animation_packets: any[] = [];
    let traffic: any[] = [];
    let network_cy: any = null;
    let player_pause = 0;
    let player_play = 0;
    let pkts_on_the_fly = 0;

    let animation_traffic_step_callback: () => void = function () {};

    let instance: PlayerInstance | undefined;

    const InitPlayer = function (packet: any) {
        setTraffic(packet);
        setAnimationTrafficStep(0);
        clearAnimationPackets();
        setPlayerPause(0);
        setPlayerPlay(0);
        pkts_on_the_fly = 0;
    };

    const StartPlayer = function (cy: any) {
        if (!traffic) {
            console.log("Nothing to animate. Traffic is null");
            return 0;
        }

        // Where to play
        setCy(cy);

        // If we in pause
        if (getPlayerPause()) {
            setPlayerPause(0);
            PlayAnimation();
            return;
        }

        // If we already in play mode
        if (getPlayerPlay()) {
            return;
        }

        PlayNextStep();
    };

    const StopPlayer = function () {
        // Stop all animations
        animation_packets.forEach(function (p: any) {
            p.stop();
        });

        if (!network_cy) {
            return;
        }

        // Remove all state.packets
        const pkts = network_cy.elements().filter('[type = "packet"]');

        pkts.forEach(function (p_item: any) {
            network_cy.remove(p_item);
        });

        // Restore design-time link-down styling
        MarkLinkDownEdges(network_cy);

        setAnimationTrafficStep(0);
        clearAnimationPackets();
        setPlayerPause(0);
        setPlayerPlay(0);
        pkts_on_the_fly = 0;
        return;
    };

    const PausePlayer = function () {
        animation_packets.forEach(function (p: any) {
            p.pause();
        });

        setPlayerPause(1);
    };

    const flashEdge = function (edge: any, opacitySequence: number[], duration: number) {
        let chain: Promise<unknown> = Promise.resolve();
        opacitySequence.forEach(function (opacity) {
            chain = chain.then(function () {
                return edge
                    .animation({ style: { opacity: opacity } }, { duration: duration })
                    .play()
                    .promise("completed");
            });
        });
        return chain;
    };

    const AnimateLinkDown = function (step: number) {
        if (!network_cy) return;

        state.jobs.forEach(function (j: any) {
            if (j.job_id == LINK_DOWN_JOB_ID && j.level == step) {
                const edgeId = FindEdgeIdByJob(j);
                if (!edgeId) return;

                const edge = network_cy.edges('[id="' + edgeId + '"]');
                if (edge.length === 0) return;

                flashEdge(edge, [0.3, 1, 0.3], 150).then(function () {
                    edge.removeClass("link-down");
                    edge.addClass("link-down-active");
                    edge.removeStyle();
                });
            }
        });
    };

    const PlayNextStep = function () {
        // Clear animated state.packets.
        clearAnimationPackets();

        // Set player to play
        setPlayerPlay(1);

        const ats = getAnimationTrafficStep();

        if (ats >= traffic.length) {
            console.log("Animation is end");
            (document.getElementById("NetworkStopButton") as HTMLButtonElement | null)?.click();
            return;
        }

        // Animate link-down state.edges for this step
        AnimateLinkDown(ats);

        PlayStep();
        increaseAnimationTrafficStep();
        getAnimationTrafficStepCallback().call(undefined);
        return;
    };

    const PlayStep = function () {
        if (!network_cy) {
            console.log("No global cy");
            return 0;
        }

        if (!traffic) {
            console.log("Nothing to animate. Traffic is null");
            return 0;
        }

        if (!traffic.length) {
            console.log("0 state.packets, nothing to animate");
            return;
        }

        const ats = getAnimationTrafficStep();

        if (ats >= traffic.length) {
            console.log("Animation is end");
            (document.getElementById("NetworkStopButton") as HTMLButtonElement | null)?.click();
            return;
        }

        const pkts = traffic[getAnimationTrafficStep()];

        if (pkts.length == 0) {
            console.log("Step " + ats + " has 0 state.packets. Skip it.");
            return 0;
        }

        PlayerSetPackets(pkts);
        PlayAnimation();
    };

    const PlayAnimation = function () {
        animation_packets.forEach(function (p: any) {
            if (!p.completed()) {
                p.play();
            }
        });
    };

    const PlayerSetPackets = function (pkts: any[]) {
        const zoom = network_cy.zoom();
        const px = network_cy.pan().x;
        const py = network_cy.pan().y;
        const edgeMap: Record<string, number> = {};

        pkts.forEach(function (p_item: any) {
            const pp_item = structuredClone(p_item) as any;
            pp_item["data"]["id"] = uid();

            const edge = network_cy.edges('[id = "' + pp_item["config"]["path"] + '"]');

            if (!edge.source()) return;

            const pkt_id = pp_item["data"]["id"];
            let from_xy: any = undefined;
            let to_xy: any = undefined;

            if (edge.source().id() === pp_item["config"]["source"]) {
                from_xy = edge.sourceEndpoint();
                to_xy = edge.targetEndpoint();
            } else if (edge.source().id() === pp_item["config"]["target"]) {
                from_xy = edge.targetEndpoint();
                to_xy = edge.sourceEndpoint();
            } else {
                console.log("Got edge but source and target id is not equal");
                return;
            }

            const curve = edge.rscratch();

            // Start coordinates
            pp_item["renderedPosition"] = {
                x: from_xy["x"] * zoom + px,
                y: from_xy["y"] * zoom + py,
            };

            // User can't grab nor select
            pp_item["grabbable"] = false;
            pp_item["selectable"] = false;

            network_cy.add(pp_item);
            pkts_on_the_fly++;
            network_cy.elements().last().addClass("hidden");

            let edge_wait = 0;

            if (edgeMap[p_item.config.path]) {
                edge_wait = edgeMap[p_item.config.path] * 500;
                edgeMap[p_item.config.path] = edgeMap[p_item.config.path] + 1;
            } else {
                edgeMap[p_item.config.path] = 1;
            }

            const a_pkt = network_cy
                .nodes()
                .last()
                .animation(
                    {
                        renderedPosition: {
                            x: from_xy["x"] * zoom + px,
                            y: from_xy["y"] * zoom + py,
                        },
                    },
                    {
                        duration: getAnimationTrafficStep() ? 500 + edge_wait : 0 + edge_wait,
                        complete: function () {
                            const pkt = network_cy.elements().filter('[id = "' + pkt_id + '"]')[0];

                            if (!pkt) return;

                            pkt.removeClass("hidden");

                            const a_pkt2 = pkt.animation(
                                {
                                    renderedPosition: {
                                        x: to_xy["x"] * zoom + px,
                                        y: to_xy["y"] * zoom + py,
                                    },
                                },
                                {
                                    duration: 1000,
                                    complete: function () {
                                        network_cy.remove('[id = "' + pkt_id + '"]');
                                        pkts_on_the_fly--;

                                        // If it's the last packet
                                        if (!pkts_on_the_fly) {
                                            PlayNextStep();
                                        }
                                    },
                                    step: function (this: any) {
                                        this.easingImpl = (() => {
                                            return (
                                                start: number,
                                                end: number,
                                                percent: number
                                            ) => {
                                                if (curve.ctrlpts) {
                                                    const tolerance = 0.01;
                                                    const isClose = (a: number, b: number) =>
                                                        Math.abs(a - b) < tolerance;

                                                    const isXAnimation =
                                                        isClose(start, curve.startX) ||
                                                        isClose(end, curve.startX) ||
                                                        isClose(start, curve.endX) ||
                                                        isClose(end, curve.endX);

                                                    const middle = isXAnimation
                                                        ? curve.ctrlpts[0]
                                                        : curve.ctrlpts[1];

                                                    return (
                                                        (1 - percent) * (1 - percent) * start +
                                                        2 * percent * (1 - percent) * middle +
                                                        percent * percent * end
                                                    );
                                                } else {
                                                    return start + (end - start) * percent;
                                                }
                                            };
                                        })();
                                    },
                                }
                            );

                            addAnimationPackets(a_pkt2);
                            a_pkt2.play();
                        },
                    }
                );

            addAnimationPackets(a_pkt);
        });
    };

    const increaseAnimationTrafficStep = function () {
        animation_traffic_step++;
        return;
    };

    const setAnimationTrafficStep = function (n: number) {
        if (n >= parseInt(String(n), 10)) {
            animation_traffic_step = n;
        }
        return;
    };

    const getAnimationTrafficStep = function () {
        return animation_traffic_step;
    };

    const setTraffic = function (packets: any[]) {
        traffic = packets;
        return;
    };

    const setCy = function (cy: any) {
        network_cy = cy;
        return;
    };

    const clearAnimationPackets = function () {
        // Stop all animations
        animation_packets.forEach(function (p: any) {
            p.stop();
        });

        animation_packets = [];
        return;
    };

    const addAnimationPackets = function (a_pkts: any) {
        animation_packets.push(a_pkts);
        return;
    };

    const setPlayerPause = function (s: number) {
        player_pause = s;
        return;
    };

    const getPlayerPause = function () {
        return player_pause;
    };

    const setPlayerPlay = function (s: number) {
        player_play = s;
        return;
    };

    const getPlayerPlay = function () {
        return player_play;
    };

    const setAnimationTrafficStepCallback = function (s: () => void) {
        animation_traffic_step_callback = s;
        return;
    };

    const resetAnimationTrafficStepCallback = function () {
        animation_traffic_step_callback = function () {};
        return;
    };

    const getAnimationTrafficStepCallback = function () {
        return animation_traffic_step_callback;
    };

    const createInstance = function (): PlayerInstance {
        return {
            InitPlayer,
            StopPlayer,
            StartPlayer,
            PausePlayer,
            getPlayerPause,
            getPlayerPlay,
            setAnimationTrafficStepCallback,
            resetAnimationTrafficStepCallback,
            getAnimationTrafficStep,
            setAnimationTrafficStep,
        };
    };

    return {
        getInstance: function (): PlayerInstance {
            return instance || (instance = createInstance());
        },
    };
})();
