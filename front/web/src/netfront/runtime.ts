import { state } from "../lib/state";
import { CheckSimulation } from "./simulation";
import { ajaxWithAuth } from "../lib/jwt_auth";
import { mountSimulationPlayer } from "../lib/simulation_player_mount";

export const RunSimulation = function (_network_guid: string) {
    ajaxWithAuth({
        type: "POST",
        url: ExternalUrlFor("/run_simulation?guid=" + state.network_guid),
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
            console.log("Cannot run simulation guid = " + state.network_guid);
            SetNetworkPlayerState(-1);
        },
        contentType: "application/json",
        dataType: "json",
    });
};

export const FilterPackets = function () {
    const tcpRegex = /TCP \((ACK|SYN|FIN)/;
    state.packets = state.packets
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
    const arpEl = document.getElementById("ARPFilterCheckbox") as HTMLInputElement | null;
    if (arpEl) arpEl.checked = !!state.packetFilterState.hideARP;
    const stpEl = document.getElementById("STPFilterCheckbox") as HTMLInputElement | null;
    if (stpEl) stpEl.checked = !!state.packetFilterState.hideSTP;
    const synEl = document.getElementById("SYNFilterCheckbox") as HTMLInputElement | null;
    if (synEl) synEl.checked = !!state.packetFilterState.hideSYN;
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

    ajaxWithAuth({
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
    // Only meaningful on a network page (which sets `network_guid`
    // from the initial-state JSON). Off-network pages have nothing to
    // filter, so bail early without touching state.
    if (!state.network_guid) {
        return;
    }

    // SetPacketFilter first call on emulated network
    if (state.packets && !state.packetsNotFiltered) {
        state.packetsNotFiltered = JSON.parse(JSON.stringify(state.packets)); // Array deep copy
    }
    // Numerous filter call, we grab our state.packets copy to filter it
    else if (state.packetsNotFiltered) {
        state.packets = JSON.parse(JSON.stringify(state.packetsNotFiltered));
    }

    state.packetFilterState.hideARP = !!(
        document.getElementById("ARPFilterCheckbox") as HTMLInputElement | null
    )?.checked;
    state.packetFilterState.hideSTP = !!(
        document.getElementById("STPFilterCheckbox") as HTMLInputElement | null
    )?.checked;
    state.packetFilterState.hideSYN = !!(
        document.getElementById("SYNFilterCheckbox") as HTMLInputElement | null
    )?.checked;

    if (state.packets) {
        FilterPackets();
        if (shared) {
            SetSharedNetworkPlayerState();
        } else {
            SetNetworkPlayerState(0);
        }
    }
};

// Thin wrapper: real UI lives in components/SimulationPlayer.tsx. The
// reset case (-1) still needs imperative state cleanup because the
// rest of the bundle calls this entrypoint to signal "the user did
// something that invalidates packets" (config change, drag-and-drop,
// edit, etc.).
export const SetNetworkPlayerState = function (simulation_id: number) {
    if (simulation_id === -1) {
        state.packetsNotFiltered = null;
        state.packets = null;
        state.pcaps = [];
        mountSimulationPlayer({ mode: "editor", simulationId: 0 });
        return;
    }
    mountSimulationPlayer({ mode: "editor", simulationId: simulation_id });
};

export const SetSharedNetworkPlayerState = function () {
    mountSimulationPlayer({ mode: "shared", simulationId: 0 });
};

// Take a picture and update it.
export const TakeGraphPictureAndUpdate = function () {
    if (!state.global_cy) {
        return;
    }

    const png_blob = state.global_cy.png({ output: "blob", maxWidth: 512, maxHeight: 512 });

    ajaxWithAuth({
        type: "POST",
        url: ExternalUrlFor("/network/upload_network_picture?guid=" + state.network_guid),
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
        network_title: state.network_title,
        network_description: state.network_description,
        zoom: state.global_cy.zoom(),
        pan_x: state.global_cy.pan().x,
        pan_y: state.global_cy.pan().y,
    };

    ajaxWithAuth({
        type: "POST",
        url: ExternalUrlFor("/network/update_network_config?guid=" + state.network_guid),
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
        url: ExternalUrlFor("/network/copy_network?guid=" + state.network_guid),
        data: "",
        success: function (data: any, textStatus: any, xhr: any) {
            if (xhr.status === 200) {
                console.log("Copy network is made.");
                const modalEl = document.getElementById("ModalCopy");
                if (!modalEl) return;
                const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
                document.querySelectorAll(".modal-option").forEach((btn) => {
                    btn.addEventListener("click", function (this: HTMLElement) {
                        const selectedOption = this.getAttribute("data-option");
                        if (selectedOption === "edit") {
                            window.location.href = data.new_url;
                            console.log("Go to editing");
                        } else if (selectedOption === "continue") {
                            console.log("Continue here");
                        }
                        modal.hide();
                    });
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
    const n = JSON.parse(JSON.stringify(state.nodes));
    const e = JSON.parse(JSON.stringify(state.edges));

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

    state.nodes = x.nodes;
    state.edges = x.edges;

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
    const selectLabel = document.querySelector(
        `label[for="config_${deviceType}_job_select_field"]`
    ) as HTMLLabelElement | null;
    if (selectLabel) {
        selectLabel.textContent = "Редактировать команду";
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
    document
        .querySelectorAll(`#config_${deviceType}_job_list li`)
        .forEach((li) => li.classList.remove("editing-command"));
    const listItem = document
        .getElementById(`config_${deviceType}_job_delete_${jobId}`)
        ?.closest("li");
    if (listItem) listItem.classList.add("editing-command");

    // Highlight only the input fields area after it's inserted into DOM
    setTimeout(() => {
        const jobList = document.getElementById(`config_${deviceType}_job_list`);
        const inputDiv = jobList?.previousElementSibling;
        if (
            inputDiv instanceof HTMLElement &&
            inputDiv.getAttribute("name") === `config_${deviceType}_select_input`
        ) {
            inputDiv.classList.add("editing-form-area");
        }

        // Scroll to the "Редактировать команду" label (select field)
        const labelEl = document.querySelector(
            `label[for="config_${deviceType}_job_select_field"]`
        ) as HTMLLabelElement | null;
        if (labelEl) {
            labelEl.scrollIntoView({
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
    const selectLabel = document.querySelector(
        `label[for="config_${deviceType}_job_select_field"]`
    ) as HTMLLabelElement | null;
    if (selectLabel) {
        selectLabel.textContent = "Выполнить команду";
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
    document
        .querySelectorAll(`#config_${deviceType}_job_list li`)
        .forEach((li) => li.classList.remove("editing-command"));
    document
        .querySelectorAll(`div[name="config_${deviceType}_select_input"]`)
        .forEach((div) => div.classList.remove("editing-form-area"));

    // Clear form inputs
    document
        .querySelectorAll(`div[name="config_${deviceType}_select_input"]`)
        .forEach((div) => div.remove());
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
    // Grid should be offset by pan to stay aligned with state.nodes
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
