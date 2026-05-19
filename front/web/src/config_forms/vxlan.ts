// VXLAN modal config wiring for routers.
// Migrated from front/src/static/config_vxlan.js.

import { SetNetworkPlayerState } from "../netfront/runtime";
import { DrawGraph } from "../netfront/draw";
import { PostNodesEdges } from "../netfront/network_ops";

function isValidVNI(vni: any): boolean {
    const num = Number(vni);
    return Number.isInteger(num) && num >= 1 && num <= 16777214;
}

function isValidIP(ip: string): boolean {
    const ipv4Regex = /^(25[0-5]|2[0-4]\d|[0-1]?\d{1,2})(\.(25[0-5]|2[0-4]\d|[0-1]?\d{1,2})){3}$/;
    return ipv4Regex.test(ip);
}

function isDuplicateNetworkEntry(currentDevice: any, vni: any, targetIp: any): boolean {
    return currentDevice.interface.some(
        (iface: any) =>
            iface.vxlan_connection_type === 1 &&
            iface.vxlan_vni_to_target_ip &&
            iface.vxlan_vni_to_target_ip.some(
                (entry: any) => entry[0] === vni && entry[1] === targetIp
            )
    );
}

function isLinkAlreadyAdded(currentDevice: any, interfaceId: any, role: string): boolean {
    return currentDevice.interface.some((iface: any) => {
        if (iface.id === interfaceId) {
            if (role === "client") {
                return (
                    iface.vxlan_connection_type === 1 &&
                    Array.isArray(iface.vxlan_vni_to_target_ip) &&
                    iface.vxlan_vni_to_target_ip.length > 0
                );
            } else if (role === "network") {
                return iface.vxlan_connection_type === 0 && iface.vxlan_vni !== null;
            }
        }
        return false;
    });
}

export function areVxlanInterfaceFieldsFilled(currentDevice: any): boolean {
    return currentDevice.interface.some(
        (iface: any) =>
            ((iface.vxlan_vni !== null && iface.vxlan_vni !== undefined) ||
                (iface.vxlan_vni_to_target_ip !== null &&
                    iface.vxlan_vni_to_target_ip !== undefined &&
                    iface.vxlan_vni_to_target_ip.length > 0)) &&
            iface.vxlan_connection_type !== null &&
            iface.vxlan_connection_type !== undefined
    );
}

function updateVxlanButtonStyle(currentDevice: any) {
    const isVxlanEnabled = areVxlanInterfaceFieldsFilled(currentDevice);

    if (isVxlanEnabled) {
        $("#config_button_vxlan")
            .addClass("btn-outline-primary")
            .removeClass("btn-outline-secondary");
    } else {
        $("#config_button_vxlan")
            .removeClass("btn-outline-primary")
            .addClass("btn-outline-secondary");
    }
}

function resetVxlanInterfaceFields(currentDevice: any) {
    currentDevice.interface.forEach((iface: any) => {
        iface.vxlan_vni = null;
        iface.vxlan_connection_type = null;
        iface.vxlan_vni_to_target_ip = null;
    });
}

function clearClientFields(tableId: string) {
    $("#" + tableId)
        .find(".client-vni")
        .val("");
    $("#" + tableId)
        .find(".client-device")
        .prop("selectedIndex", 0);
}

function clearNetworkFields(tableId: string) {
    $("#" + tableId)
        .find(".network-vni")
        .val("");
    $("#" + tableId)
        .find(".remote-vtep-ip")
        .val("");
    $("#" + tableId)
        .find(".out-interface")
        .prop("selectedIndex", 0);
}

function restoreVxlanFormData(tableId: string) {
    clearClientFields(tableId);
    clearNetworkFields(tableId);
}

function showAlert(message: string, type: string = "info", modalId: string) {
    const alertContainer = $("#" + modalId + " .vxlanAlertContainer");
    const alertId = `alert-${Date.now()}`;

    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Закрыть"></button>
        </div>
    `;

    alertContainer.append(alertHTML);

    setTimeout(() => {
        ($(`#${alertId}`) as any).alert("close");
    }, 5000);
}

function removeDevice(iface: any, tableId: string) {
    iface.vxlan_vni = null;
    iface.vxlan_connection_type = null;
    iface.vxlan_vni_to_target_ip = null;

    const deviceList = $("#" + tableId).find(".devices-list")[0];
    const deviceItems = deviceList.getElementsByClassName("client-interface");

    for (const item of Array.from(deviceItems)) {
        if ((item as HTMLElement).dataset.id === iface.id) {
            deviceList.removeChild(item);
            break;
        }
    }
}

function removeInterface(iface: any, vni: any, targetIp: any, tableId: string) {
    const interfaceList = $("#" + tableId).find(".interfaces-list")[0];
    const interfaceItems = interfaceList.getElementsByClassName("network-interface");
    if (Array.isArray(iface.vxlan_vni_to_target_ip)) {
        iface.vxlan_vni_to_target_ip = iface.vxlan_vni_to_target_ip.filter(
            (item: any) => item[0] !== vni || item[1] !== targetIp
        );
    }

    for (const item of Array.from(interfaceItems)) {
        const textContent = item.textContent || (item as HTMLElement).innerText;
        if (
            textContent.includes(`VNI: ${vni}`) &&
            textContent.includes(`Удаленный IP: ${targetIp}`)
        ) {
            interfaceList.removeChild(item);
            break;
        }
    }
}

function createNetIfaceRow(iface: any, deviceName: any, vni: any, ip: any, tableId: string) {
    const networkRow = document.createElement("li");
    networkRow.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "align-items-center",
        "network-interface"
    );
    networkRow.dataset.id = iface.id;
    networkRow.textContent = `Линк к: ${deviceName}, VNI: ${vni}, Удаленный IP: ${ip}`;
    const removeButton = document.createElement("button");
    removeButton.classList.add("btn", "btn-danger", "btn-sm");
    removeButton.textContent = "Удалить";
    removeButton.onclick = function () {
        removeInterface(iface, vni, ip, tableId);
    };
    networkRow.appendChild(removeButton);
    return networkRow;
}

function createClientRow(iface: any, deviceName: any, tableId: string) {
    const clientRow = document.createElement("li");
    clientRow.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "align-items-center",
        "client-interface"
    );
    clientRow.dataset.id = iface.id;
    clientRow.textContent = `Линк к: ${deviceName}, VNI: ${iface.vxlan_vni}`;
    const removeButton = document.createElement("button");
    removeButton.classList.add("btn", "btn-danger", "btn-sm");
    removeButton.textContent = "Удалить";
    removeButton.onclick = function () {
        removeDevice(iface, tableId);
    };
    clientRow.appendChild(removeButton);
    return clientRow;
}

function getInterfaceAndConnectedNodes(currentDevice: any): Array<[any, any]> {
    const result: Array<[any, any]> = [];

    const edgesMap = new Map<string, any>();
    for (let i = 0; i < edges.length; i++) {
        edgesMap.set(edges[i].data.id, edges[i]);
    }

    const nodesMap = new Map<string, any>();
    for (let i = 0; i < nodes.length; i++) {
        nodesMap.set(nodes[i].data.id, nodes[i].data.label);
    }

    for (let i = 0; i < currentDevice.interface.length; i++) {
        const interfaceInfo = currentDevice.interface[i];
        const connectedEdge = edgesMap.get(interfaceInfo.connect);
        if (connectedEdge !== undefined) {
            let targetDeviceId;
            if (connectedEdge.data.source === currentDevice.data.id) {
                targetDeviceId = connectedEdge.data.target;
            } else {
                targetDeviceId = connectedEdge.data.source;
            }
            const connectedNode = nodesMap.get(targetDeviceId);
            result.push([interfaceInfo, connectedNode]);
        }
    }

    return result;
}

function generateDropdownMenues(tableId: string, ifaceToDeviseList: Array<[any, any]>) {
    const select_client_link = $("#" + tableId).find(".client-device")[0];
    const select_out_link = $("#" + tableId).find(".out-interface")[0];
    while (select_client_link.firstChild) {
        select_client_link.removeChild(select_client_link.firstChild);
    }
    while (select_out_link.firstChild) {
        select_out_link.removeChild(select_out_link.firstChild);
    }
    ifaceToDeviseList.forEach(([iface, connectedNode]) => {
        const option = document.createElement("option");
        option.value = iface.id;
        option.textContent = connectedNode;
        select_client_link.appendChild(option);

        const option2 = document.createElement("option");
        option2.value = iface.id;
        option2.textContent = connectedNode;
        select_out_link.appendChild(option2);
    });
}

function generateClientsContent(tableId: string, ifaceToDeviseList: Array<[any, any]>) {
    const devices_list = $("#" + tableId).find(".devices-list")[0];
    while (devices_list.firstChild) {
        devices_list.removeChild(devices_list.firstChild);
    }
    ifaceToDeviseList.forEach(([iface, connectedNode]) => {
        if (
            iface.vxlan_vni !== null &&
            iface.vxlan_vni !== undefined &&
            iface.vxlan_connection_type === 0
        ) {
            const row = createClientRow(iface, connectedNode, tableId);
            devices_list.appendChild(row);
        }
    });
}

function generateNetworkInterfacesContent(tableId: string, ifaceToDeviseList: Array<[any, any]>) {
    const interfaces_list = $("#" + tableId).find(".interfaces-list")[0];

    while (interfaces_list.firstChild) {
        interfaces_list.removeChild(interfaces_list.firstChild);
    }

    ifaceToDeviseList.forEach(([iface, connectedNode]) => {
        const connectionType = iface.vxlan_connection_type;
        const targetIpList = iface.vxlan_vni_to_target_ip;
        if (
            connectionType === 1 &&
            targetIpList !== null &&
            targetIpList !== undefined &&
            targetIpList
        ) {
            for (let j = 0; j < targetIpList.length; j++) {
                const row = createNetIfaceRow(
                    iface,
                    connectedNode,
                    targetIpList[j][0],
                    targetIpList[j][1],
                    tableId
                );
                interfaces_list.appendChild(row);
            }
        }
    });
}

function addClientVxlanInterface(currentDevice: any, tableId: string, modalId: string) {
    const vni = $("#" + tableId)
        .find(".client-vni")
        .val();
    const deviceEntry = $("#" + tableId)
        .find(".client-device")
        .find("option:selected")
        .val();

    if (!deviceEntry) {
        showAlert("Пожалуйста, выберите клиентский интерфейс.", "warning", modalId);
        return;
    }

    if (!isValidVNI(vni)) {
        showAlert("Неверный VNI. Пожалуйста, введите число от 1 до 16777214.", "danger", modalId);
        return;
    }

    if (isLinkAlreadyAdded(currentDevice, deviceEntry, "client")) {
        showAlert(
            "Этот интерфейс уже используется как сетевой. Пожалуйста, выберите другой интерфейс.",
            "danger",
            modalId
        );
        return;
    }

    if (deviceEntry === null || deviceEntry === undefined || deviceEntry === "") {
        return;
    }
    const iface = currentDevice.interface.find(function (item: any) {
        return item.id === deviceEntry;
    });
    if (iface) {
        if (
            iface.vxlan_connection_type === 0 &&
            iface.vxlan_vni !== null &&
            iface.vxlan_vni !== undefined
        ) {
            showAlert(
                "Этот интерфейс уже привязан к VNI: " + String(iface.vxlan_vni),
                "warning",
                modalId
            );
            return;
        }
        iface.vxlan_vni = Number(vni);
        iface.vxlan_connection_type = 0;
        iface.vxlan_vni_to_target_ip = null;
    }
    clearClientFields(tableId);
}

function addNetworkVxlanInterface(currentDevice: any, tableId: string, modalId: string) {
    const vni = $("#" + tableId)
        .find(".network-vni")
        .val();
    const targetIp = $("#" + tableId)
        .find(".remote-vtep-ip")
        .val();
    const deviceEntry = $("#" + tableId)
        .find(".out-interface")
        .find("option:selected")
        .val();

    if (!deviceEntry) {
        showAlert("Пожалуйста, выберите исходящий интерфейс.", "warning", modalId);
        return;
    }

    if (!isValidVNI(vni)) {
        showAlert("Неверный VNI. Пожалуйста, введите число от 1 до 16777214.", "danger", modalId);
        return;
    }

    if (!isValidIP(String(targetIp))) {
        showAlert(
            "Неверный IP-адрес. Пожалуйста, введите действительный IPv4 адрес.",
            "danger",
            modalId
        );
        return;
    }

    if (isLinkAlreadyAdded(currentDevice, deviceEntry, "network")) {
        showAlert(
            "Этот интерфейс уже используется как клиентский. Пожалуйста, выберите другой интерфейс.",
            "danger",
            modalId
        );
        return;
    }

    if (isDuplicateNetworkEntry(currentDevice, vni, targetIp)) {
        showAlert("Такая запись VXLAN уже существует на этом интерфейсе.", "warning", modalId);
        return;
    }

    if (deviceEntry === null || deviceEntry === undefined || deviceEntry === "") {
        return;
    }
    const iface = currentDevice.interface.find(function (item: any) {
        return item.id === deviceEntry;
    });
    if (iface) {
        iface.vxlan_vni = null;
        iface.vxlan_connection_type = 1;
        if (!Array.isArray(iface.vxlan_vni_to_target_ip)) {
            iface.vxlan_vni_to_target_ip = [];
        }

        iface.vxlan_vni_to_target_ip.push([vni, targetIp]);
    }
    clearNetworkFields(tableId);
}

function setupVxlanEventHandlers(currentDevice: any, modalId: string, tableId: string) {
    $("#" + modalId)
        .find("#config_vxlan_switch")
        .off("click")
        .on("click", function (this: any) {
            if ($(this).is(":checked")) {
                $("#" + tableId).show();
                const ifaceToDeviseList = getInterfaceAndConnectedNodes(currentDevice);
                generateDropdownMenues(tableId, ifaceToDeviseList);
                generateNetworkInterfacesContent(tableId, ifaceToDeviseList);
                generateClientsContent(tableId, ifaceToDeviseList);
            } else {
                resetVxlanInterfaceFields(currentDevice);
                restoreVxlanFormData(tableId);
                $("#" + tableId).hide();
            }
        });

    $("#" + modalId)
        .find("#vxlanConfigurationCancelIcon")
        .on("click", function () {
            ($("#" + modalId) as any).modal("hide");
        });

    $("#" + modalId).on("hidden.bs.modal.myNamespace", function () {
        updateVxlanButtonStyle(currentDevice);

        SetNetworkPlayerState(-1);
        DrawGraph();
        PostNodesEdges();
    });

    $("#" + modalId)
        .find("#vxlanConfigurationSubmit")
        .on("click", function () {
            ($("#" + modalId) as any).modal("hide");
        });

    $("#config_button_vxlan")
        .off("click")
        .on("click", function () {
            if (areVxlanInterfaceFieldsFilled(currentDevice)) {
                $("#" + modalId)
                    .find("#config_vxlan_switch")
                    .prop("checked", true);
                $("#" + tableId).show();
                const ifaceToDeviseList = getInterfaceAndConnectedNodes(currentDevice);
                generateDropdownMenues(tableId, ifaceToDeviseList);
                generateNetworkInterfacesContent(tableId, ifaceToDeviseList);
                generateClientsContent(tableId, ifaceToDeviseList);
            } else {
                $("#" + modalId)
                    .find("#config_vxlan_switch")
                    .prop("checked", false);
                $("#" + tableId).hide();
            }
            ($("#" + modalId) as any).modal("show");
        });
    $("#" + tableId)
        .find(".add-client-vxlan-interface")
        .off("click")
        .on("click", function () {
            addClientVxlanInterface(currentDevice, tableId, modalId);
            const ifaceToDeviseList = getInterfaceAndConnectedNodes(currentDevice);
            generateClientsContent(tableId, ifaceToDeviseList);
        });

    $("#" + tableId)
        .find(".add-network-vxlan-interface")
        .off("click")
        .on("click", function () {
            addNetworkVxlanInterface(currentDevice, tableId, modalId);
            const ifaceToDeviseList = getInterfaceAndConnectedNodes(currentDevice);
            generateNetworkInterfacesContent(tableId, ifaceToDeviseList);
        });

    updateVxlanButtonStyle(currentDevice);
}

export const ConfigVxlan = function (currentDevice: any) {
    const modalId = "VxlanConfigModal" + currentDevice.data.id;
    const tableId = "VxlanConfigTable" + currentDevice.data.id;

    $("#" + modalId).remove();

    const buttonElem0 = document.getElementById("config_button_vxlan_script");
    const modalElem0 = document.getElementById("config_modal_vxlan_script");
    const tableElem0 = document.getElementById("config_table_vxlan_script");

    if (!buttonElem0 || !modalElem0 || !tableElem0) {
        return;
    }

    const buttonHTML = buttonElem0.innerHTML;
    let modalHTML = modalElem0.innerHTML;
    let tableHTML = tableElem0.innerHTML;

    modalHTML = modalHTML.replace('id="VxlanModal"', 'id="' + modalId + '"');
    tableHTML = tableHTML.replace('id="config_table_vxlan"', 'id="' + tableId + '"');

    const buttonElem = $(buttonHTML).insertAfter("#config_router_name");
    buttonElem.attr("data-bs-target", "#" + modalId);

    $(modalHTML).appendTo("body");
    $(tableHTML)
        .appendTo("#" + modalId + " .modal-body")
        .hide();

    $(function () {
        ($('[data-bs-toggle="tooltip"]') as any).tooltip();
        setupVxlanEventHandlers(currentDevice, modalId, tableId);
    });
};
