import { state } from "../lib/state";
import { CheckSimulation, InsertWaitingTime } from "./simulation";
import { DrawGraphStatic, DrawSharedGraph } from "./draw";
import { ajaxWithAuth } from "../lib/jwt_auth";

declare const ym: any;

export const RunSimulation = function (network_guid: string) {
    ajaxWithAuth({
        type: "POST",
        url: ExternalUrlFor("/run_simulation?guid=" + network_guid),
        data: "",
        success: function (data: any, textStatus: any, xhr: any) {
            if (xhr.status === 201) {
                state.lastSimulationId = data.simulation_id;
                console.log("Simulation is running!");
                // Ok, run CheckSimulation
                if (data.simulation_id) {
                    CheckSimulation(data.simulation_id);
                }
            }
        },
        error: function (_err: any) {
            console.log("Cannot run simulation guid = " + network_guid);
            SetNetworkPlayerState(-1);
        },
        contentType: "application/json",
        dataType: "json",
    });
};

export const FilterPackets = function () {
    const tcpRegex = /TCP \((ACK|SYN|FIN)/;
    packets = packets
        .map((step: any) =>
            step.filter(
                (pkt: any) =>
                    !(
                        (state.packetFilterState.hideARP && pkt.data.label.startsWith("ARP")) ||
                        (state.packetFilterState.hideSTP &&
                            (pkt.data.label.startsWith("STP") ||
                                pkt.data.label.startsWith("RSTP"))) ||
                        (state.packetFilterState.hideSYN && tcpRegex.test(pkt.data.label))
                    )
            )
        )
        .filter((step: any) => step.length > 0);
};

export const UpdateFilterStates = function (settings: any) {
    if (!settings) {
        return;
    }

    Object.assign(state.packetFilterState, settings);
    $("#ARPFilterCheckbox").prop("checked", state.packetFilterState.hideARP);
    $("#STPFilterCheckbox").prop("checked", state.packetFilterState.hideSTP);
    $("#SYNFilterCheckbox").prop("checked", state.packetFilterState.hideSYN);
};

export const SaveAnimationFilters = function () {
    if (!window.isAuthenticated) {
        return;
    }

    const payload = {
        hideARP: Boolean(state.packetFilterState.hideARP),
        hideSTP: Boolean(state.packetFilterState.hideSTP),
        hideSYN: Boolean(state.packetFilterState.hideSYN),
    };

    $.ajax({
        type: "POST",
        url: "/user/animation_filters",
        data: JSON.stringify(payload),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (data: any) {
            if (!data) {
                return;
            }

            const saved = {
                hideARP: Boolean(data.hideARP),
                hideSTP: Boolean(data.hideSTP),
                hideSYN: Boolean(data.hideSYN),
            };

            UpdateFilterStates(saved);
        },
        error: function (xhr) {
            console.log("Cannot save animation filters");
            console.log(xhr);
        },
    });
};

export const SetPacketFilter = function (shared: number = 0) {
    // If network player UI is absent (e.g., not on network page), skip.
    if (
        !document.getElementById("NetworkPlayer") ||
        !document.getElementById("PacketSliderInput")
    ) {
        return;
    }

    console.log("Packet filter call");
    // SetPacketFilter first call on emulated network
    if (packets && !state.packetsNotFiltered) {
        state.packetsNotFiltered = JSON.parse(JSON.stringify(packets)); // Array deep copy
    }
    // Numerous filter call, we grab our packets copy to filter it
    else if (state.packetsNotFiltered) {
        packets = JSON.parse(JSON.stringify(state.packetsNotFiltered));
    }

    state.packetFilterState.hideARP = $("#ARPFilterCheckbox").is(":checked");
    state.packetFilterState.hideSTP = $("#STPFilterCheckbox").is(":checked");
    state.packetFilterState.hideSYN = $("#SYNFilterCheckbox").is(":checked");

    if (packets) {
        FilterPackets();
        if (shared) {
            SetSharedNetworkPlayerState();
        } else {
            SetNetworkPlayerState(0);
        }
    }
};

// 2 states:
// Do we need emulation
// We have a packets and ready to play packets
export const SetNetworkPlayerState = function (simulation_id: number) {
    // Reset?
    if (simulation_id === -1) {
        state.packetsNotFiltered = null;
        packets = null;
        pcaps = [];
        SetNetworkPlayerState(0);
        return;
    }

    // If we have packets, then we're ready to run
    if (packets) {
        $("#NetworkPlayer").empty();
        $("#NetworkPlayer").append(
            '<button type="button" class="btn btn-danger me-2" id="NetworkStopButton"><i class="bx bx-stop fs-xl"></i></button>'
        );
        $("#NetworkPlayer").append(
            '<button type="button" class="btn btn-success" id="NetworkPlayPauseButton" onclick="if (typeof window.ym != \'undefined\'){ym(92293993,\'reachGoal\',\'PlayPauseButton\');}"><i class="bx bx-play fs-xl"></i></button>'
        );

        // Init player
        PacketPlayer.getInstance().InitPlayer(packets);

        // Configure the slider
        if (!$("#PacketSliderInput")[0] || !($("#PacketSliderInput")[0] as any).noUiSlider) {
            return;
        }

        ($("#PacketSliderInput")[0] as any).noUiSlider.updateOptions({
            start: [1],
            range: {
                min: 1,
                max: packets.length,
            },
            format: {
                to: function (val: any) {
                    return "" + val;
                },
                from: function (val: any) {
                    return "" + val;
                },
            },
            tooltips: false,
        });

        // Show Slider on
        $("#PacketSliderInput").show();

        const pkt_count = packets.reduce(
            (currentCount: number, row: any) => currentCount + row.length,
            0
        );
        $("#NetworkPlayerLabel").text(
            packets.length +
                " " +
                NumWord(packets.length, ["шаг", "шага", "шагов"]) +
                " / " +
                pkt_count +
                " " +
                NumWord(pkt_count, ["пакет", "пакета", "пакетов"])
        );

        ($("#PacketSliderInput")[0] as any).noUiSlider.on("slide", function (e: any) {
            if (!e) return;
            const x = Math.round(e[0]);
            PacketPlayer.getInstance().setAnimationTrafficStep(x - 1);
        });

        ($("#PacketSliderInput")[0] as any).noUiSlider.on("update", function (e: any) {
            if (!e) return;
            const x = Math.round(e[0]);
            if (packets.length === 0) {
                $("#NetworkPlayerLabel").text("0 пакетов");
                return;
            }
            $("#NetworkPlayerLabel").text(
                "Шаг: " +
                    x +
                    "/" +
                    packets.length +
                    " (" +
                    packets[x - 1].length +
                    " " +
                    NumWord(packets[x - 1].length, ["пакет", "пакета", "пакетов"]) +
                    ")"
            );
        });

        // Set click handlers
        $("#NetworkPlayPauseButton").click(function () {
            // If btn-success then start to play
            if ($(this).hasClass("btn-success")) {
                $(this).removeClass("btn-success");
                $(this).addClass("btn-warning");

                $(this).empty();
                $(this).append('<i class="bx bx-pause fs-xl"></i>');

                // If not in pause. Draw a new layout and go.
                if (!PacketPlayer.getInstance().getPlayerPause()) {
                    DrawGraphStatic(nodes, edges);
                }

                PacketPlayer.getInstance().setAnimationTrafficStepCallback(function () {
                    ($("#PacketSliderInput")[0] as any).noUiSlider.set(
                        PacketPlayer.getInstance().getAnimationTrafficStep()
                    );
                });

                PacketPlayer.getInstance().StartPlayer(state.global_cy);
                return;
            } else {
                $(this).removeClass("btn-warning");
                $(this).addClass("btn-success");
                $(this).empty();
                $(this).append('<i class="bx bx-play fs-xl"></i>');

                PacketPlayer.getInstance().PausePlayer();
                return;
            }
        });

        $("#NetworkStopButton").click(function () {
            PacketPlayer.getInstance().resetAnimationTrafficStepCallback();
            PacketPlayer.getInstance().StopPlayer();

            // Reset slider.
            ($("#PacketSliderInput")[0] as any).noUiSlider.set(0);

            DrawGraphStatic(nodes, edges);

            $("#NetworkPlayPauseButton").removeClass("btn-success");
            $("#NetworkPlayPauseButton").removeClass("btn-warning");
            $("#NetworkPlayPauseButton").empty();
            $("#NetworkPlayPauseButton").addClass("btn-success");
            $("#NetworkPlayPauseButton").append('<i class="bx bx-play fs-xl"></i>');
            return;
        });

        return;
    }

    // No packets.
    // The network is simulating?
    if (simulation_id) {
        $("#NetworkPlayer").empty();
        $("#PacketSliderInput").hide();
        $("#NetworkPlayer").append(
            '<button type="button" class="btn btn-primary w-100" id="NetworkEmulateButton" disabled>Эмулируется...</button>'
        );
        InsertWaitingTime();
        CheckSimulation(simulation_id);
        return;
    }

    // No packets and no simulation.
    // Add emulation button.
    $("#NetworkPlayer").empty();
    $("#PacketSliderInput").hide();
    $("#NetworkPlayer").append(
        '<button type="button" class="btn btn-primary w-100" id="NetworkEmulateButton">Эмулировать</button>'
    );
    $("#NetworkPlayerLabel").empty();

    $("#NetworkEmulateButton").click(function () {
        // Check for job. If no job - show modal and exit.
        if (!jobs.length) {
            ($("#noJobsModal") as any).modal("toggle");
            return;
        }

        if (nodes.length > 80) {
            ($("#tooManyHostModal") as any).modal("toggle");
            return;
        }

        if (typeof window.ym != "undefined") {
            ym(92293993, "reachGoal", "NetworkEmulate");
        }

        RunSimulation(network_guid);

        $("#NetworkPlayer").empty();
        $("#NetworkPlayer").append(
            '<button type="button" class="btn btn-primary w-100" id="NetworkEmulateButton" disabled>Эмулируется...</button>'
        );
        InsertWaitingTime();
        return;
    });

    return;
};

// 2 states:
// No packets - disable button.
// We have a packets and ready to play packets
export const SetSharedNetworkPlayerState = function () {
    // If we have packets, then we're ready to run
    if (packets) {
        $("#NetworkPlayer").empty();
        $("#NetworkPlayer").append(
            '<button type="button" class="btn btn-danger me-2" id="NetworkStopButton"><i class="bx bx-stop fs-xl"></i></button>'
        );
        $("#NetworkPlayer").append(
            '<button type="button" class="btn btn-success" id="NetworkPlayPauseButton" onclick="if (typeof window.ym != \'undefined\'){ym(92293993,\'reachGoal\',\'PlayPauseButton\');}"><i class="bx bx-play fs-xl"></i></button>'
        );

        // Init player
        PacketPlayer.getInstance().InitPlayer(packets);

        // Configure the slider
        ($("#PacketSliderInput")[0] as any).noUiSlider.updateOptions({
            start: [1],
            range: {
                min: 1,
                max: packets.length,
            },
            format: {
                to: function (val: any) {
                    return "" + val;
                },
                from: function (val: any) {
                    return "" + val;
                },
            },
            tooltips: false,
        });

        // Show Slider on
        $("#PacketSliderInput").show();

        const pkt_count = packets.reduce(
            (currentCount: number, row: any) => currentCount + row.length,
            0
        );
        $("#NetworkPlayerLabel").text(
            packets.length +
                " " +
                NumWord(packets.length, ["шаг", "шага", "шагов"]) +
                " / " +
                pkt_count +
                " " +
                NumWord(pkt_count, ["пакет", "пакета", "пакетов"])
        );

        ($("#PacketSliderInput")[0] as any).noUiSlider.on("slide", function (e: any) {
            if (!e) return;
            const x = Math.round(e[0]);
            PacketPlayer.getInstance().setAnimationTrafficStep(x - 1);
        });

        ($("#PacketSliderInput")[0] as any).noUiSlider.on("update", function (e: any) {
            if (!e) return;
            const x = Math.round(e[0]);
            if (packets.length === 0) {
                $("#NetworkPlayerLabel").text("0 пакетов");
                return;
            }
            $("#NetworkPlayerLabel").text(
                "Шаг: " +
                    x +
                    "/" +
                    packets.length +
                    " (" +
                    packets[x - 1].length +
                    " " +
                    NumWord(packets[x - 1].length, ["пакет", "пакета", "пакетов"]) +
                    ")"
            );
        });

        // Set click handlers
        $("#NetworkPlayPauseButton").click(function () {
            // If btn-success then start to play
            if ($(this).hasClass("btn-success")) {
                $(this).removeClass("btn-success");
                $(this).addClass("btn-warning");

                $(this).empty();
                $(this).append('<i class="bx bx-pause fs-xl"></i>');

                // If not in pause. Draw a new layout and go.
                if (!PacketPlayer.getInstance().getPlayerPause()) {
                    DrawGraphStatic(nodes, edges);
                }

                PacketPlayer.getInstance().setAnimationTrafficStepCallback(function () {
                    ($("#PacketSliderInput")[0] as any).noUiSlider.set(
                        PacketPlayer.getInstance().getAnimationTrafficStep()
                    );
                });

                PacketPlayer.getInstance().StartPlayer(state.global_cy);
            } else {
                $(this).removeClass("btn-warning");
                $(this).addClass("btn-success");
                $(this).empty();
                $(this).append('<i class="bx bx-play fs-xl"></i>');

                PacketPlayer.getInstance().PausePlayer();
                return;
            }
        });

        $("#NetworkStopButton").click(function () {
            PacketPlayer.getInstance().resetAnimationTrafficStepCallback();
            PacketPlayer.getInstance().StopPlayer();

            // Reset slider.
            ($("#PacketSliderInput")[0] as any).noUiSlider.set(0);

            DrawSharedGraph(nodes, edges);

            $("#NetworkPlayPauseButton").removeClass("btn-success");
            $("#NetworkPlayPauseButton").removeClass("btn-warning");
            $("#NetworkPlayPauseButton").empty();
            $("#NetworkPlayPauseButton").addClass("btn-success");
            $("#NetworkPlayPauseButton").append('<i class="bx bx-play fs-xl"></i>');
            return;
        });

        return;
    }

    // No packets
    // Add info button
    $("#NetworkPlayer").empty();
    $("#PacketSliderInput").hide();
    $("#NetworkPlayerLabel").empty();
    $("#NetworkPlayer").append(
        '<button type="button" class="btn btn-primary w-100" id="NetworkEmulateButton" disabled>Нет эмуляции</button>'
    );
    return;
};

// Take a picture and update it.
export const TakeGraphPictureAndUpdate = function () {
    if (!state.global_cy) {
        return;
    }

    const png_blob = state.global_cy.png({ output: "blob", maxWidth: 512, maxHeight: 512 });

    ajaxWithAuth({
        type: "POST",
        url: ExternalUrlFor("/network/upload_network_picture?guid=" + network_guid),
        data: png_blob,
        processData: false,
        error: function (xhr: any) {
            if (xhr.status != 200) {
                console.log("Cannot upload graph picture");
            }
        },
        dataType: "image/png",
    });
};

// Calculate drop offsets
export const CalculateDropOffset = function (elem_x: number, elem_y: number) {
    const network_scheme = document.getElementById("network_scheme");
    const ret = { x: 0, y: 0 };

    console.log(elem_x + ", " + elem_y);

    if (network_scheme) {
        ret.x += network_scheme.offsetLeft - 25;
        ret.y += network_scheme.offsetTop - 15;
    }

    if (state.global_cy) {
        ret.x = ret.x + state.global_cy.pan().x;
        ret.y = ret.y + state.global_cy.pan().y;

        ret.x = (elem_x - ret.x) / state.global_cy.zoom();
        ret.y = (elem_y - ret.y) / state.global_cy.zoom();

        // Apply snap-to-grid
        const baseGridSize = 25;
        ret.x = Math.round(ret.x / baseGridSize) * baseGridSize;
        ret.y = Math.round(ret.y / baseGridSize) * baseGridSize;
    }

    return ret;
};

export const UpdateNetworkConfig = function () {
    if (!state.global_cy) {
        return;
    }

    const payload = {
        network_title: network_title,
        network_description: network_description,
        zoom: state.global_cy.zoom(),
        pan_x: state.global_cy.pan().x,
        pan_y: state.global_cy.pan().y,
    };

    ajaxWithAuth({
        type: "POST",
        url: ExternalUrlFor("/network/update_network_config?guid=" + network_guid),
        data: JSON.stringify(payload),
        contentType: "application/json; charset=utf-8",
        success: function (_data: any, _textStatus: any, _xhr: any) {},
        error: function (xhr: any) {
            console.log("Cannot update network config");
            console.log(xhr);
        },
        dataType: "json",
    });
};

export const CopyNetwork = function () {
    ajaxWithAuth({
        type: "POST",
        url: ExternalUrlFor("/network/copy_network?guid=" + network_guid),
        data: "",
        success: function (data: any, textStatus: any, xhr: any) {
            if (xhr.status === 200) {
                console.log("Copy network is made.");
                ($("#ModalCopy") as any).modal("show");
                $(".modal-option").click(function () {
                    const selectedOption = $(this).attr("data-option");
                    if (selectedOption === "edit") {
                        const newUrl = data.new_url;
                        window.location.href = newUrl;
                        console.log("Go to editing");
                    } else if (selectedOption === "continue") {
                        console.log("Continue here");
                    }
                    ($("#ModalCopy") as any).modal("hide");
                });
            }
        },
        error: function (_err: any) {
            console.log("Copy has not been made.");
        },
        contentType: "application/json",
        dataType: "json",
    });
};

export const NumWord = function (value: number, words: string[]) {
    value = Math.abs(value) % 100;
    const num = value % 10;
    if (value > 10 && value < 20) return words[2];
    if (num > 1 && num < 5) return words[1];
    if (num == 1) return words[0];
    return words[2];
};

export const SaveNetworkObject = function () {
    const n = JSON.parse(JSON.stringify(nodes));
    const e = JSON.parse(JSON.stringify(edges));

    state.networkCache.push({
        nodes: n,
        edges: e,
    });

    return 0;
};

export const RestoreNetworkObject = function () {
    const x: any = state.networkCache.pop();

    if (!x) {
        return;
    }

    nodes = x.nodes;
    edges = x.edges;

    return 0;
};

export let editingJobId: any = null;
export let editingDeviceType: any = null;

export const EnterEditMode = function (deviceType: string, jobId: string, jobTypeId: any) {
    editingJobId = jobId;
    editingDeviceType = deviceType;

    // Change submit button text
    const submitButton = document.getElementById(`config_${deviceType}_main_form_submit_button`);
    if (submitButton) {
        submitButton.textContent = "Сохранить изменения";
    }

    // Change label text from "Выполнить команду" to "Редактировать команду"
    const selectLabel = $(`label[for="config_${deviceType}_job_select_field"]`);
    if (selectLabel.length) {
        selectLabel.text("Редактировать команду");
    }

    // Hide the select dropdown and show command name
    const selectField = document.getElementById(`config_${deviceType}_job_select_field`);
    if (selectField) {
        selectField.style.display = "none";

        // Remove old command display if exists
        const existingDisplay = document.getElementById(
            `config_${deviceType}_edit_command_display`
        );
        if (existingDisplay) {
            existingDisplay.remove();
        }

        // Get command name from the selected option in HTML
        const selectedOption = selectField.querySelector(`option[value="${jobTypeId}"]`);
        const commandName = selectedOption ? selectedOption.textContent : "Команда";

        // Create and insert command name display
        const commandDisplay = document.createElement("input");
        commandDisplay.type = "text";
        commandDisplay.id = `config_${deviceType}_edit_command_display`;
        commandDisplay.className = "form-control form-control-sm";
        commandDisplay.value = commandName;
        commandDisplay.disabled = true;
        selectField.parentNode!.insertBefore(commandDisplay, selectField.nextSibling);
    }

    // Highlight the editing command
    $(`#config_${deviceType}_job_list li`).removeClass("editing-command");
    const listItem = $(`#config_${deviceType}_job_delete_${jobId}`).closest("li");
    listItem.addClass("editing-command");

    // Highlight only the input fields area after it's inserted into DOM
    setTimeout(() => {
        const jobList = document.getElementById(`config_${deviceType}_job_list`);
        if (jobList) {
            const inputDiv = $(jobList).prev(`div[name="config_${deviceType}_select_input"]`);
            if (inputDiv.length) {
                inputDiv.addClass("editing-form-area");
            }
        }

        // Scroll to the "Редактировать команду" label (select field)
        // This helps when user clicks edit on a command at the bottom of the list
        const labelEl = $(`label[for="config_${deviceType}_job_select_field"]`);
        if (labelEl.length) {
            labelEl[0].scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest",
            });
        }
    }, 50);
};

// Function to exit edit mode
export const ExitEditMode = function (deviceType: string) {
    editingJobId = null;
    editingDeviceType = null;

    // Reset submit button text
    const submitButton = document.getElementById(`config_${deviceType}_main_form_submit_button`);
    if (submitButton) {
        submitButton.textContent = "Сохранить";
    }

    // Reset label text back to "Выполнить команду"
    const selectLabel = $(`label[for="config_${deviceType}_job_select_field"]`);
    if (selectLabel.length) {
        selectLabel.text("Выполнить команду");
    }

    // Remove command text display
    const commandDisplay = document.getElementById(`config_${deviceType}_edit_command_display`);
    if (commandDisplay) {
        commandDisplay.remove();
    }

    // Show the select dropdown again
    const selectField = document.getElementById(
        `config_${deviceType}_job_select_field`
    ) as HTMLSelectElement | null;
    if (selectField) {
        selectField.style.display = "block";
        selectField.value = "0";
    }

    // Remove highlight from command and input areas
    $(`#config_${deviceType}_job_list li`).removeClass("editing-command");
    $(`div[name="config_${deviceType}_select_input"]`).removeClass("editing-form-area");

    // Clear form inputs
    $('div[name="config_' + deviceType + '_select_input"]').remove();
};

// Function to delete old job and save new configuration
export const DeleteAndSaveJob = function (
    deviceType: string,
    updateFunction: (data: any, deviceId: string) => any,
    formData: any,
    deviceId: string
) {
    if (!editingJobId || editingDeviceType !== deviceType) {
        // Not in edit mode, just save
        updateFunction(formData, deviceId);
        return;
    }

    // In edit mode: pass editing_job_id to server
    // Server will validate first, then delete old and add new atomically
    formData += "&editing_job_id=" + encodeURIComponent(editingJobId);

    updateFunction(formData, deviceId);
};

// Grid drawing functions
export const initGrid = function (cy: any) {
    if (!cy) return;

    // Clean up previous listener
    if (
        typeof state.gridCanvasLayer !== "undefined" &&
        state.gridCanvasLayer &&
        state.gridCanvasLayer.resizeAndDrawCanvas
    ) {
        window.removeEventListener("resize", state.gridCanvasLayer.resizeAndDrawCanvas);
    }

    // Remove old grid canvas if exists
    const oldCanvas = document.getElementById("grid-canvas-static");
    if (oldCanvas) {
        oldCanvas.remove();
    }

    // Create canvas with absolute positioning to overlay on top of cytoscape container
    const canvas = document.createElement("canvas");
    canvas.id = "grid-canvas-static";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";

    const container = cy.container();
    container.insertBefore(canvas, container.firstChild);

    const ctx = canvas.getContext("2d");

    const resizeAndDrawCanvas = function () {
        const pixelRatio = window.devicePixelRatio || 1;

        // Use container dimensions instead of window dimensions to prevent distortion
        // when container is not full screen
        canvas.width = container.clientWidth * pixelRatio;
        canvas.height = container.clientHeight * pixelRatio;

        // Always redraw when resizing
        if (state.gridCanvasLayer) {
            drawGrid();
        }
    };

    state.gridCanvasLayer = {
        canvas: canvas,
        ctx: ctx,
        resizeAndDrawCanvas: resizeAndDrawCanvas,
    };

    resizeAndDrawCanvas();

    // Add event listener for resize
    window.addEventListener("resize", resizeAndDrawCanvas);

    // Add cy resize listener to handle container resizing specifically
    if (cy) {
        cy.on("resize", resizeAndDrawCanvas);
    }

    // Initialize current zoom from cytoscape
    if (cy && cy.zoom) {
        state.currentGridZoom = cy.zoom();
    }

    // Draw grid
    drawGrid();
};

export const drawGrid = function () {
    if (!state.gridCanvasLayer) {
        return;
    }

    const canvas = state.gridCanvasLayer.canvas;
    const ctx = state.gridCanvasLayer.ctx;

    if (!canvas || !ctx) {
        return;
    }

    // Scale grid with zoom: at max zoom (2.0) = 50px like before, at min zoom (0.5) = small cells
    const gridSize = 25 * state.currentGridZoom; // 25 * 2.0 = 50px (max zoom), 25 * 0.5 = 12.5px (min zoom)
    const pixelRatio = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const screenWidth = canvas.width / pixelRatio;
    const screenHeight = canvas.height / pixelRatio;

    // Get pan offset to align grid with cytoscape coordinate system
    let panX = 0;
    let panY = 0;
    if (state.global_cy && state.global_cy.pan) {
        const pan = state.global_cy.pan();
        panX = pan.x;
        panY = pan.y;
    }

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    // Draw grid lines across entire viewport
    ctx.strokeStyle = "rgba(200, 200, 200, 0.4)";
    ctx.lineWidth = 1;

    ctx.beginPath();

    // Calculate grid origin with pan offset
    // Grid should be offset by pan to stay aligned with nodes
    const gridOriginX = panX % gridSize;
    const gridOriginY = panY % gridSize;

    // Vertical lines across entire viewport
    const startX = Math.floor(-gridOriginX / gridSize) * gridSize + gridOriginX;
    for (let x = startX; x <= screenWidth; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, screenHeight);
    }

    // Horizontal lines across entire viewport
    const startY = Math.floor(-gridOriginY / gridSize) * gridSize + gridOriginY;
    for (let y = startY; y <= screenHeight; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(screenWidth, y);
    }

    ctx.stroke();
};

// Update grid when config panel opens/closes
export const updateGridForConfigPanel = function () {
    if (state.gridCanvasLayer && state.gridCanvasLayer.resizeAndDrawCanvas) {
        // Small delay to let DOM update
        setTimeout(function () {
            state.gridCanvasLayer.resizeAndDrawCanvas();
        }, 50);
    }
};
