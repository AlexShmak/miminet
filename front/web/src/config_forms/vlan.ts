import { state } from "../lib/state";
// VLAN modal config wiring for L2 switches.
//
// `interface` is a reserved word in TypeScript, so the local-variable
// `interface` from the source has been renamed to `iface`.

import { SetNetworkPlayerState } from "../netfront/runtime";
import { DrawGraph } from "../netfront/draw";
import { PostNodesEdges } from "../netfront/network_ops";

export function areInterfaceFieldsFilled(device: any): boolean {
    return device.interface.some(
        (iface: any) =>
            iface.vlan !== null &&
            iface.vlan !== undefined &&
            iface.type_connection !== null &&
            iface.type_connection !== undefined
    );
}

function resetInterfaceFields(device: any) {
    device.interface.forEach((iface: any) => {
        iface.vlan = null;
        iface.type_connection = null;
    });
}

function updateVlanButtonStyle(currentDevice: any) {
    const btn = document.getElementById("config_button_vlan");
    if (!btn) return;
    if (areInterfaceFieldsFilled(currentDevice)) {
        btn.classList.add("btn-outline-primary");
        btn.classList.remove("btn-outline-secondary");
    } else {
        btn.classList.remove("btn-outline-primary");
        btn.classList.add("btn-outline-secondary");
    }
}

function generateTableContent(currentDevice: any, tableSelector: string) {
    const tbody = document.querySelector(tableSelector + " tbody");
    if (!tbody) return;
    tbody.replaceChildren();

    const edgesMap = new Map<string, any>();
    for (let i = 0; i < state.edges.length; i++) {
        edgesMap.set(state.edges[i].data.id, state.edges[i]);
    }

    const nodesMap = new Map<string, any>();
    for (let i = 0; i < state.nodes.length; i++) {
        nodesMap.set(state.nodes[i].data.id, state.nodes[i].data.label);
    }

    for (let i = 0; i < currentDevice.interface.length; i++) {
        const iface = currentDevice.interface[i];
        const connectedEdge = edgesMap.get(iface.connect);
        if (connectedEdge === undefined) continue;

        const targetDeviceId =
            connectedEdge.data.source === currentDevice.data.id
                ? connectedEdge.data.target
                : connectedEdge.data.source;

        const vlan = iface.vlan !== null && iface.vlan !== undefined ? iface.vlan : 1;
        const type_connection =
            iface.type_connection !== null && iface.type_connection !== undefined
                ? iface.type_connection
                : 0;

        const selectedAccess = type_connection === 0 ? "selected" : "";
        const selectedTrunk = type_connection === 1 ? "selected" : "";

        const row =
            '<tr data-id="' +
            iface.id +
            '">' +
            "<td>" +
            nodesMap.get(targetDeviceId) +
            "</td>" +
            '<td><input type="text" value="' +
            vlan +
            '" class="form-control vlan-input" /></td>' +
            "<td>" +
            '<select class="form-select type-connection-select">' +
            '<option value="Access" ' +
            selectedAccess +
            ">Access</option>" +
            '<option value="Trunk" ' +
            selectedTrunk +
            ">Trunk</option>" +
            "</select>" +
            "</td>" +
            "</tr>";

        tbody.insertAdjacentHTML("beforeend", row);
    }

    document.querySelectorAll<HTMLSelectElement>(".type-connection-select").forEach((sel) => {
        sel.addEventListener("change", function () {
            const typeConnection = this.value;
            const row = this.closest("tr");
            const vlanInput = row?.querySelector(".vlan-input") as HTMLInputElement | null;
            if (!vlanInput) return;

            const vlanPattern = "^(?:[1-9]|[1-9]\\d{1,2}|[1-3]\\d{3}|40[0-9]{2}|409[0-4])";
            const vlanListPattern = "^" + vlanPattern + "(\\s*(,|\\s)\\s*" + vlanPattern + ")*$";

            if (typeConnection === "Trunk") {
                vlanInput.setAttribute("pattern", vlanListPattern);
            } else {
                const raw = vlanInput.value;
                const currentVlanValues = String(raw)
                    .split(/[\s,]+/)
                    .map(Number);
                vlanInput.value = String(currentVlanValues[0] || 1);
                vlanInput.setAttribute("pattern", vlanPattern);
            }
        });
    });
}

function saveCurrentFormData(currentDevice: any, tableSelector: string) {
    document.querySelectorAll(tableSelector + " tbody tr").forEach((row) => {
        const interfaceId = (row as HTMLElement).dataset.id;
        const vlanInput = (row.querySelector("input") as HTMLInputElement | null)?.value ?? "";
        const selVal = (row.querySelector("select") as HTMLSelectElement | null)?.value ?? "Access";
        const type_connection = selVal === "Access" ? 0 : 1;

        const iface = currentDevice.interface.find((item: any) => item.id === interfaceId);
        if (!iface) return;

        const vlanSplit = /[\s,]+/;
        const vlanValues =
            type_connection === 1
                ? String(vlanInput).split(vlanSplit).map(Number)
                : [Number(vlanInput)];
        const validVlanValues = vlanValues.every((value) => value >= 1 && value <= 4094);

        if (validVlanValues) {
            iface.vlan = type_connection === 1 ? vlanValues : vlanValues[0];
        }
        iface.type_connection = type_connection;
    });
}

function restoreFormData(currentDevice: any, tableSelector: string) {
    document.querySelectorAll(tableSelector + " tbody tr").forEach((row) => {
        const interfaceId = (row as HTMLElement).dataset.id;
        const iface = currentDevice.interface.find((item: any) => item.id === interfaceId);
        if (!iface) return;

        let vlanValue: any = iface.vlan;
        if (Array.isArray(vlanValue)) {
            vlanValue = vlanValue.join(", ");
        } else if (vlanValue === null || vlanValue === undefined) {
            vlanValue = 1;
        }

        const inp = row.querySelector("input") as HTMLInputElement | null;
        if (inp) inp.value = String(vlanValue);
        const sel = row.querySelector("select") as HTMLSelectElement | null;
        if (sel) sel.value = iface.type_connection === 0 ? "Access" : "Trunk";
    });
}

function setupEventHandlers(currentDevice: any, modalId: string, tableId: string) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);

    const enableCheckbox = modalEl.querySelector("#config_switch_vlan") as HTMLInputElement | null;
    if (enableCheckbox) {
        const fresh = enableCheckbox.cloneNode(true) as HTMLInputElement;
        enableCheckbox.parentNode?.replaceChild(fresh, enableCheckbox);
        fresh.addEventListener("click", function () {
            const table = document.getElementById(tableId);
            if (!table) return;
            if (fresh.checked) {
                table.style.display = "";
                generateTableContent(currentDevice, "#" + tableId);
            } else {
                table.style.display = "none";
            }
        });
    }

    modalEl
        .querySelectorAll("#vlanConfigurationCancelIcon, #vlanConfigurationCancel")
        .forEach((el) => {
            el.addEventListener("click", () => {
                restoreFormData(currentDevice, "#" + tableId);
                modal.hide();
            });
        });

    const submitBtn = modalEl.querySelector("#vlanConfigurationSubmit");
    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            const checkbox = modalEl.querySelector(
                "#config_switch_vlan"
            ) as HTMLInputElement | null;
            if (checkbox?.checked) {
                saveCurrentFormData(currentDevice, "#" + tableId);
                const index = state.nodes.findIndex((n: any) => n.data.id == currentDevice.data.id);
                if (index >= 0) {
                    state.nodes[index].interface = currentDevice.interface;
                }
            } else {
                resetInterfaceFields(currentDevice);
            }
            modal.hide();
            updateVlanButtonStyle(currentDevice);

            SetNetworkPlayerState(-1);
            DrawGraph();
            PostNodesEdges();
        });
    }

    const openBtn = document.getElementById("config_button_vlan");
    if (openBtn) {
        const fresh = openBtn.cloneNode(true) as HTMLElement;
        openBtn.parentNode?.replaceChild(fresh, openBtn);
        fresh.addEventListener("click", () => {
            const table = document.getElementById(tableId);
            const checkbox = modalEl.querySelector(
                "#config_switch_vlan"
            ) as HTMLInputElement | null;
            if (areInterfaceFieldsFilled(currentDevice)) {
                if (checkbox) checkbox.checked = true;
                if (table) table.style.display = "";
                generateTableContent(currentDevice, "#" + tableId);
            } else {
                if (checkbox) checkbox.checked = false;
                if (table) table.style.display = "none";
            }
            modal.show();
        });
    }

    updateVlanButtonStyle(currentDevice);
}

export const ConfigVLAN = function (currentDevice: any) {
    const modalId = "VlanModal_" + currentDevice.data.id;
    const tableId = "config_table_vlan_" + currentDevice.data.id;

    document.getElementById(modalId)?.remove();

    const buttonHTML = document.getElementById("config_button_vlan_script")!.innerHTML;
    let modalHTML = document.getElementById("config_modal_vlan_script")!.innerHTML;
    let tableHTML = document.getElementById("config_table_vlan_script")!.innerHTML;

    modalHTML = modalHTML.replace('id="VlanModal"', 'id="' + modalId + '"');
    tableHTML = tableHTML.replace('id="config_table_vlan"', 'id="' + tableId + '"');

    const nameWrap = document.getElementById("config_switch_name");
    if (nameWrap) {
        const tmpl = document.createElement("template");
        tmpl.innerHTML = buttonHTML;
        nameWrap.append(tmpl.content);
        const btn = document.getElementById("config_button_vlan");
        btn?.setAttribute("data-bs-target", "#" + modalId);
    }

    const modalTmpl = document.createElement("template");
    modalTmpl.innerHTML = modalHTML;
    document.body.append(modalTmpl.content);

    const modalBody = document.querySelector("#" + modalId + " .modal-body");
    if (modalBody) {
        const tableTmpl = document.createElement("template");
        tableTmpl.innerHTML = tableHTML;
        modalBody.append(tableTmpl.content);
        const tableEl = document.getElementById(tableId);
        if (tableEl) tableEl.style.display = "none";
    }

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
        new (window.bootstrap as any).Tooltip(el);
    });
    setupEventHandlers(currentDevice, modalId, tableId);
};
