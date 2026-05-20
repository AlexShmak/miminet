import { state } from "../shared/state";
// VXLAN modal config wiring for routers.

import { SetNetworkPlayerState } from "../network-editor/runtime";
import { DrawGraph } from "../network-editor/draw";
import { PostNodesEdges } from "../network-editor/network_ops";

export function isValidVNI(vni: any): boolean {
    const num = Number(vni);
    return Number.isInteger(num) && num >= 1 && num <= 16777214;
}

export function isValidIP(ip: string): boolean {
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
    const btn = document.getElementById("config_button_vxlan");
    if (!btn) return;
    if (areVxlanInterfaceFieldsFilled(currentDevice)) {
        btn.classList.add("btn-outline-primary");
        btn.classList.remove("btn-outline-secondary");
    } else {
        btn.classList.remove("btn-outline-primary");
        btn.classList.add("btn-outline-secondary");
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
    const table = document.getElementById(tableId);
    if (!table) return;
    table.querySelectorAll<HTMLInputElement>(".client-vni").forEach((el) => (el.value = ""));
    table
        .querySelectorAll<HTMLSelectElement>(".client-device")
        .forEach((el) => (el.selectedIndex = 0));
}

function clearNetworkFields(tableId: string) {
    const table = document.getElementById(tableId);
    if (!table) return;
    table.querySelectorAll<HTMLInputElement>(".network-vni").forEach((el) => (el.value = ""));
    table.querySelectorAll<HTMLInputElement>(".remote-vtep-ip").forEach((el) => (el.value = ""));
    table
        .querySelectorAll<HTMLSelectElement>(".out-interface")
        .forEach((el) => (el.selectedIndex = 0));
}

function restoreVxlanFormData(tableId: string) {
    clearClientFields(tableId);
    clearNetworkFields(tableId);
}

function showAlert(message: string, type: string = "info", modalId: string) {
    const modal = document.getElementById(modalId);
    const alertContainer = modal?.querySelector(".vxlanAlertContainer");
    if (!alertContainer) return;
    const alertId = `alert-${Date.now()}`;

    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Закрыть"></button>
        </div>
    `;

    alertContainer.insertAdjacentHTML("beforeend", alertHTML);

    setTimeout(() => {
        const alertEl = document.getElementById(alertId);
        if (alertEl) window.bootstrap.Alert.getOrCreateInstance(alertEl).close();
    }, 5000);
}

function removeDevice(iface: any, tableId: string) {
    iface.vxlan_vni = null;
    iface.vxlan_connection_type = null;
    iface.vxlan_vni_to_target_ip = null;

    const table = document.getElementById(tableId);
    const deviceList = table?.querySelector(".devices-list");
    if (!deviceList) return;
    const deviceItems = deviceList.getElementsByClassName("client-interface");

    for (const item of Array.from(deviceItems)) {
        if ((item as HTMLElement).dataset.id === iface.id) {
            deviceList.removeChild(item);
            break;
        }
    }
}

function removeInterface(iface: any, vni: any, targetIp: any, tableId: string) {
    const table = document.getElementById(tableId);
    const interfaceList = table?.querySelector(".interfaces-list");
    if (!interfaceList) return;
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
    for (let i = 0; i < state.edges.length; i++) {
        edgesMap.set(state.edges[i].data.id, state.edges[i]);
    }

    const nodesMap = new Map<string, any>();
    for (let i = 0; i < state.nodes.length; i++) {
        nodesMap.set(state.nodes[i].data.id, state.nodes[i].data.label);
    }

    for (let i = 0; i < currentDevice.interface.length; i++) {
        const interfaceInfo = currentDevice.interface[i];
        const connectedEdge = edgesMap.get(interfaceInfo.connect);
        if (connectedEdge !== undefined) {
            const targetDeviceId =
                connectedEdge.data.source === currentDevice.data.id
                    ? connectedEdge.data.target
                    : connectedEdge.data.source;
            const connectedNode = nodesMap.get(targetDeviceId);
            result.push([interfaceInfo, connectedNode]);
        }
    }

    return result;
}

function generateDropdownMenues(tableId: string, ifaceToDeviseList: Array<[any, any]>) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const select_client_link = table.querySelector(".client-device") as HTMLSelectElement | null;
    const select_out_link = table.querySelector(".out-interface") as HTMLSelectElement | null;
    if (!select_client_link || !select_out_link) return;
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
    const table = document.getElementById(tableId);
    const devices_list = table?.querySelector(".devices-list");
    if (!devices_list) return;
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
    const table = document.getElementById(tableId);
    const interfaces_list = table?.querySelector(".interfaces-list");
    if (!interfaces_list) return;

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
    const table = document.getElementById(tableId);
    if (!table) return;
    const vni = (table.querySelector(".client-vni") as HTMLInputElement | null)?.value;
    const select = table.querySelector(".client-device") as HTMLSelectElement | null;
    const deviceEntry = select?.value;

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
    const iface = currentDevice.interface.find((item: any) => item.id === deviceEntry);
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
    const table = document.getElementById(tableId);
    if (!table) return;
    const vni = (table.querySelector(".network-vni") as HTMLInputElement | null)?.value;
    const targetIp = (table.querySelector(".remote-vtep-ip") as HTMLInputElement | null)?.value;
    const select = table.querySelector(".out-interface") as HTMLSelectElement | null;
    const deviceEntry = select?.value;

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
    const iface = currentDevice.interface.find((item: any) => item.id === deviceEntry);
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
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);

    const switchEl = modalEl.querySelector("#config_vxlan_switch") as HTMLInputElement | null;
    if (switchEl) {
        const fresh = switchEl.cloneNode(true) as HTMLInputElement;
        switchEl.parentNode?.replaceChild(fresh, switchEl);
        fresh.addEventListener("click", () => {
            const table = document.getElementById(tableId);
            if (!table) return;
            if (fresh.checked) {
                table.style.display = "";
                const ifaceToDeviseList = getInterfaceAndConnectedNodes(currentDevice);
                generateDropdownMenues(tableId, ifaceToDeviseList);
                generateNetworkInterfacesContent(tableId, ifaceToDeviseList);
                generateClientsContent(tableId, ifaceToDeviseList);
            } else {
                resetVxlanInterfaceFields(currentDevice);
                restoreVxlanFormData(tableId);
                table.style.display = "none";
            }
        });
    }

    const cancelIcon = modalEl.querySelector("#vxlanConfigurationCancelIcon");
    cancelIcon?.addEventListener("click", () => modal.hide());

    // Stash the hidden.bs.modal listener on the element so shared/read-only
    // mode can remove it (DisableVXLANInputs) without firing the network
    // mutation callbacks.
    const hiddenHandler = () => {
        updateVxlanButtonStyle(currentDevice);
        SetNetworkPlayerState(-1);
        DrawGraph();
        PostNodesEdges();
    };
    modalEl.addEventListener("hidden.bs.modal", hiddenHandler);
    (modalEl as any).__vxlanHiddenHandler = hiddenHandler;

    const submitBtn = modalEl.querySelector("#vxlanConfigurationSubmit");
    submitBtn?.addEventListener("click", () => modal.hide());

    const openBtn = document.getElementById("config_button_vxlan");
    if (openBtn) {
        const fresh = openBtn.cloneNode(true) as HTMLElement;
        openBtn.parentNode?.replaceChild(fresh, openBtn);
        fresh.addEventListener("click", () => {
            const checkbox = modalEl.querySelector(
                "#config_vxlan_switch"
            ) as HTMLInputElement | null;
            const table = document.getElementById(tableId);
            if (areVxlanInterfaceFieldsFilled(currentDevice)) {
                if (checkbox) checkbox.checked = true;
                if (table) table.style.display = "";
                const ifaceToDeviseList = getInterfaceAndConnectedNodes(currentDevice);
                generateDropdownMenues(tableId, ifaceToDeviseList);
                generateNetworkInterfacesContent(tableId, ifaceToDeviseList);
                generateClientsContent(tableId, ifaceToDeviseList);
            } else {
                if (checkbox) checkbox.checked = false;
                if (table) table.style.display = "none";
            }
            modal.show();
        });
    }

    const table = document.getElementById(tableId);
    if (table) {
        const addClient = table.querySelector(".add-client-vxlan-interface");
        if (addClient) {
            const fresh = addClient.cloneNode(true) as HTMLElement;
            addClient.parentNode?.replaceChild(fresh, addClient);
            fresh.addEventListener("click", () => {
                addClientVxlanInterface(currentDevice, tableId, modalId);
                const ifaceToDeviseList = getInterfaceAndConnectedNodes(currentDevice);
                generateClientsContent(tableId, ifaceToDeviseList);
            });
        }
        const addNet = table.querySelector(".add-network-vxlan-interface");
        if (addNet) {
            const fresh = addNet.cloneNode(true) as HTMLElement;
            addNet.parentNode?.replaceChild(fresh, addNet);
            fresh.addEventListener("click", () => {
                addNetworkVxlanInterface(currentDevice, tableId, modalId);
                const ifaceToDeviseList = getInterfaceAndConnectedNodes(currentDevice);
                generateNetworkInterfacesContent(tableId, ifaceToDeviseList);
            });
        }
    }

    updateVxlanButtonStyle(currentDevice);
}

export const ConfigVxlan = function (currentDevice: any) {
    const modalId = "VxlanConfigModal" + currentDevice.data.id;
    const tableId = "VxlanConfigTable" + currentDevice.data.id;

    document.getElementById(modalId)?.remove();

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

    const nameAnchor = document.getElementById("config_router_name");
    if (nameAnchor?.parentNode) {
        const tmpl = document.createElement("template");
        tmpl.innerHTML = buttonHTML;
        nameAnchor.parentNode.insertBefore(tmpl.content, nameAnchor.nextSibling);
        const btn = document.getElementById("config_button_vxlan");
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
    setupVxlanEventHandlers(currentDevice, modalId, tableId);
};
