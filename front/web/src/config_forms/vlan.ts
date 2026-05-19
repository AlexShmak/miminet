// VLAN modal config wiring for L2 switches.
// Migrated from front/src/static/config_vlan.js.
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
    const isVlanEnabled = areInterfaceFieldsFilled(currentDevice);

    if (isVlanEnabled) {
        $("#config_button_vlan")
            .addClass("btn-outline-primary")
            .removeClass("btn-outline-secondary");
    } else {
        $("#config_button_vlan")
            .removeClass("btn-outline-primary")
            .addClass("btn-outline-secondary");
    }
}

function generateTableContent(currentDevice: any, tableSelector: string) {
    // Clearing previous lines in tbody
    $(tableSelector + " tbody").empty();

    const edgesMap = new Map<string, any>();
    for (let i = 0; i < edges.length; i++) {
        edgesMap.set(edges[i].data.id, edges[i]);
    }

    const nodesMap = new Map<string, any>();
    for (let i = 0; i < nodes.length; i++) {
        nodesMap.set(nodes[i].data.id, nodes[i].data.label);
    }

    for (let i = 0; i < currentDevice.interface.length; i++) {
        const iface = currentDevice.interface[i];
        const connectedEdge = edgesMap.get(iface.connect);

        if (connectedEdge !== undefined) {
            let targetDeviceId = connectedEdge.data.target;

            // Checking whether the current device is the source or not
            if (connectedEdge.data.source === currentDevice.data.id) {
                targetDeviceId = connectedEdge.data.target;
            } else {
                targetDeviceId = connectedEdge.data.source;
            }

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

            $(tableSelector + " tbody").append(row);
        }
    }

    $(".type-connection-select").change(function (this: any) {
        const typeConnection = $(this).val();
        const vlanInput = $(this).closest("tr").find(".vlan-input");

        // Number from 1 to 4094
        const vlanPattern = "^(?:[1-9]|[1-9]\\d{1,2}|[1-3]\\d{3}|40[0-9]{2}|409[0-4])";

        // List of VLANs, separated by spaces or commas
        const vlanListPattern = "^" + vlanPattern + "(\\s*(,|\\s)\\s*" + vlanPattern + ")*$";

        if (typeConnection === "Trunk") {
            vlanInput.attr("pattern", vlanListPattern);
        } else {
            const raw = vlanInput.val();
            const currentVlanValues = String(raw)
                .split(/[\s,]+/)
                .map(Number);
            vlanInput.val(currentVlanValues[0] || 1).attr("pattern", vlanPattern);
        }
    });
}

function saveCurrentFormData(currentDevice: any, tableSelector: string) {
    $(tableSelector + " tbody tr").each(function (_index: number, rowEl: any) {
        const row = $(rowEl);
        const interfaceId = row.data("id");
        const vlanInput = row.find("input").val();
        const type_connection = row.find("select").val() === "Access" ? 0 : 1;

        const iface = currentDevice.interface.find(function (item: any) {
            return item.id === interfaceId;
        });

        if (iface) {
            const vlanSplit = /[\s,]+/;
            const vlanValues =
                type_connection === 1
                    ? String(vlanInput).split(vlanSplit).map(Number)
                    : [Number(vlanInput)];
            const validVlanValues = vlanValues.every(function (value) {
                return value >= 1 && value <= 4094;
            });

            if (validVlanValues) {
                iface.vlan = type_connection === 1 ? vlanValues : vlanValues[0];
            }
            iface.type_connection = type_connection;
        }
    });
}

function restoreFormData(currentDevice: any, tableSelector: string) {
    $(tableSelector + " tbody tr").each(function (_index: number, rowEl: any) {
        const row = $(rowEl);
        const interfaceId = row.data("id");

        const iface = currentDevice.interface.find(function (item: any) {
            return item.id === interfaceId;
        });
        if (iface) {
            let vlanValue: any = iface.vlan;
            if (Array.isArray(vlanValue)) {
                vlanValue = vlanValue.join(", ");
            } else if (vlanValue === null || vlanValue === undefined) {
                vlanValue = 1;
            }

            row.find("input").val(vlanValue);
            row.find("select").val(iface.type_connection === 0 ? "Access" : "Trunk");
        }
    });
}

function setupEventHandlers(currentDevice: any, modalId: string, tableId: string) {
    $("#" + modalId)
        .find("#config_switch_vlan")
        .off("click")
        .on("click", function (this: any) {
            if ($(this).is(":checked")) {
                $("#" + tableId).show();
                generateTableContent(currentDevice, "#" + tableId);
            } else {
                $("#" + tableId).hide();
            }
        });

    $("#" + modalId)
        .find("#vlanConfigurationCancelIcon, #vlanConfigurationCancel")
        .on("click", function () {
            restoreFormData(currentDevice, "#" + tableId);
            ($("#" + modalId) as any).modal("hide");
        });

    $("#" + modalId)
        .find("#vlanConfigurationSubmit")
        .on("click", function () {
            if (
                $("#" + modalId)
                    .find("#config_switch_vlan")
                    .is(":checked")
            ) {
                saveCurrentFormData(currentDevice, "#" + tableId);

                // TODO explain why we need this fix
                // (for some reason, nodes aren't updating fast enough)
                const index = nodes.findIndex(function (n: any) {
                    return n.data.id == currentDevice.data.id;
                });

                nodes[index].interface = currentDevice.interface;
            } else {
                resetInterfaceFields(currentDevice);
            }
            ($("#" + modalId) as any).modal("hide");
            updateVlanButtonStyle(currentDevice);

            // Reset network state
            SetNetworkPlayerState(-1);
            DrawGraph();
            PostNodesEdges();
        });

    $("#config_button_vlan")
        .off("click")
        .on("click", function () {
            if (areInterfaceFieldsFilled(currentDevice)) {
                $("#" + modalId)
                    .find("#config_switch_vlan")
                    .prop("checked", true);
                $("#" + tableId).show();
                generateTableContent(currentDevice, "#" + tableId);
            } else {
                $("#" + modalId)
                    .find("#config_switch_vlan")
                    .prop("checked", false);
                $("#" + tableId).hide();
            }
            ($("#" + modalId) as any).modal("show");
        });

    updateVlanButtonStyle(currentDevice);
}

export const ConfigVLAN = function (currentDevice: any) {
    const modalId = "VlanModal_" + currentDevice.data.id;
    const tableId = "config_table_vlan_" + currentDevice.data.id;

    $("#" + modalId).remove();

    const buttonHTML = document.getElementById("config_button_vlan_script")!.innerHTML;
    let modalHTML = document.getElementById("config_modal_vlan_script")!.innerHTML;
    let tableHTML = document.getElementById("config_table_vlan_script")!.innerHTML;

    modalHTML = modalHTML.replace('id="VlanModal"', 'id="' + modalId + '"');
    tableHTML = tableHTML.replace('id="config_table_vlan"', 'id="' + tableId + '"');

    const buttonElem = $(buttonHTML).appendTo("#config_switch_name");
    buttonElem.attr("data-bs-target", "#" + modalId);

    $(modalHTML).appendTo("body");
    $(tableHTML)
        .appendTo("#" + modalId + " .modal-body")
        .hide();

    $(function () {
        ($('[data-bs-toggle="tooltip"]') as any).tooltip();
        setupEventHandlers(currentDevice, modalId, tableId);
    });
};
