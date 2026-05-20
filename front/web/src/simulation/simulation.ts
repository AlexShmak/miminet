// Migrated from front/src/static/simulation/simulation.js
//
// State access goes through `state` (which bridges to window globals).
// Bare references to other classic-script functions (ajaxWithAuth,
// ExternalUrlFor, SetPacketFilter, SetNetworkPlayerState, DrawGraph,
// state.network_guid, etc.) still resolve via the shared classic-script
// scope — the bundled IIFE is loaded as a classic <script>, so it
// inherits that scope.

import { state } from "../shared/state";
import { SetPacketFilter, SetNetworkPlayerState } from "../network-editor/runtime";
import { DrawGraph } from "../network-editor/draw";
import { ajaxWithAuth } from "../shared/jwt_auth";

export const CheckSimulation = function (simulation_id: number) {
    ajaxWithAuth({
        type: "GET",
        url: ExternalUrlFor(
            "/check_simulation?simulation_id=" +
                simulation_id +
                "&state.network_guid=" +
                state.network_guid
        ),
        data: "",
        success: function (data: any, textStatus: any, xhr: any) {
            // If we got 210 (processing) wait 2 sec and call themself again
            if (xhr.status === 210) {
                setTimeout(CheckSimulation, 2000, simulation_id);
            }

            // Simulation is ended up and we can grab the state.packets
            if (xhr.status === 200) {
                window.packets = JSON.parse(data.packets);
                window.pcaps = data.pcaps;

                // Set filters
                state.packetsNotFiltered = null;
                SetPacketFilter();

                const answerButton = document.querySelector(
                    'button[name="answerQuestion"]'
                ) as HTMLButtonElement | null;
                if (answerButton) {
                    answerButton.disabled = false;
                }
            }
        },
        error: function (_xhr: any) {
            console.log("Cannot check simulation id = " + simulation_id);
            if (state.lastSimulationId == simulation_id) {
                SetNetworkPlayerState(-1);
            }
        },
        contentType: "application/json",
        dataType: "json",
    });
};

// Update edge configuration
export const UpdateEdgeConfiguration = (data: any) => {
    SetNetworkPlayerState(-1);

    return ajaxWithAuth({
        type: "POST",
        url: ExternalUrlFor("/edge/save_config"),
        data: data,
        complete: function () {
            DrawGraph();
            const submitBtn = document.getElementById("config_edge_main_form_submit_button");
            if (submitBtn) submitBtn.innerHTML = "Сохранить";
        },
        error: function (xhr: any) {
            console.log("Не удалось обновить конфигурацию ребра");
            console.log(xhr);
        },
        dataType: "json",
    });
};

export const InsertWaitingTime = function () {
    // Get last emulation task time
    // and send request to get count of emulating networks before this time
    ajaxWithAuth({
        type: "GET",
        url: ExternalUrlFor("/emulation_queue/time"),
        data: "",
        success: function (data: any) {
            // Run helper function with time param
            InsertWaitingTimeHelper(data.time);
        },
        error: function (err: any) {
            console.error("Failed to fetch queue time:", err);
        },
        contentType: "application/json",
        dataType: "json",
    });
};

export const InsertWaitingTimeHelper = function (time_filter: any) {
    // Insert field with queue size
    ajaxWithAuth({
        type: "GET",
        url: ExternalUrlFor("/emulation_queue/size?time-filter=" + time_filter.toString()),
        data: "",
        success: function (data: any) {
            const queue_size = parseInt(data.size);
            const firstBtn = document.querySelector(
                "#NetworkPlayer button"
            ) as HTMLButtonElement | null;
            if (firstBtn && !firstBtn.disabled) {
                console.log(firstBtn.disabled);
                return;
            }
            const label = document.getElementById("NetworkPlayerLabel");
            if (queue_size <= 1) {
                if (label) label.textContent = "Ожидание 10-15 сек.";
            } else {
                if (label) label.textContent = `Место в очереди ${queue_size}`;
                setTimeout(() => InsertWaitingTimeHelper(time_filter), 500);
            }
        },
        error: function (err: any) {
            console.error("Failed to fetch queue size:", err);
        },
        contentType: "application/json",
        dataType: "json",
    });
};
