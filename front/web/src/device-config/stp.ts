import { state } from "../shared/state";
// STP / RSTP modal config wiring for L2 switches.

import { UpdateSwitchConfiguration } from "./update_config";

function updateRstpButtonStyle(_currentDevice: any, rstp_stp_config: any) {
    const btn = document.getElementById("config_button_rstp") as HTMLButtonElement | null;
    const btnText = document.getElementById("config_button_rstp_text");
    if (!btn) return;

    (btn as any).value = rstp_stp_config;

    if (rstp_stp_config > 0) {
        if (btnText) {
            btnText.textContent =
                rstp_stp_config == 1 ? "STP" : rstp_stp_config == 2 ? "RSTP" : "STP";
        }
        btn.classList.add("btn-outline-primary");
        btn.classList.remove("btn-outline-secondary");
    } else {
        btn.classList.remove("btn-outline-primary");
        btn.classList.add("btn-outline-secondary");
        if (btnText) btnText.textContent = "STP";
    }
}

function eventHandlers(currentDevice: any, modalId: string) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl) return;
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);

    modalEl
        .querySelectorAll("#rstpConfigurationCancelIcon, #rstpConfigurationCancel")
        .forEach((el) => {
            el.addEventListener("click", () => modal.hide());
        });

    const modalRadiosSelector = `#${modalId} input[type='radio'][name='config_rstp_stp']`;
    const presetRadio = modalEl.querySelector(
        `input[type='radio'][name='config_rstp_stp'][value="${currentDevice.config.stp}"]`
    ) as HTMLInputElement | null;
    if (presetRadio) presetRadio.checked = true;

    const priorityField = modalEl.querySelector("#config_stp_priority") as HTMLInputElement | null;
    if (priorityField) priorityField.value = currentDevice.config.priority;

    const submitBtn = modalEl.querySelector("#rstpConfigurationSubmit");
    if (submitBtn) {
        submitBtn.addEventListener("click", () => {
            const checked = document.querySelector(
                `${modalRadiosSelector}:checked`
            ) as HTMLInputElement | null;
            const rstp_stp_config = checked ? checked.value : "0";
            modal.hide();
            updateRstpButtonStyle(currentDevice, rstp_stp_config);

            const switch_id = currentDevice.data.id;
            const switchIdField = modalEl.querySelector(
                "#modal_switch_id"
            ) as HTMLInputElement | null;
            if (switchIdField) switchIdField.value = switch_id;
            const netGuidField = modalEl.querySelector(
                "#modal_net_guid"
            ) as HTMLInputElement | null;
            if (netGuidField) netGuidField.value = state.network_guid;

            const form = modalEl.querySelector("#form_config_rstp_stp") as HTMLFormElement | null;
            if (!form) return;
            const data = new URLSearchParams(
                new FormData(form) as unknown as Record<string, string>
            ).toString();
            UpdateSwitchConfiguration(data, switch_id);
        });
    }

    const priorityInput = modalEl.querySelector("#input_priority_form") as HTMLElement | null;

    document.querySelectorAll(modalRadiosSelector).forEach((radio) => {
        radio.addEventListener("change", function (this: any) {
            if (!priorityInput) return;
            priorityInput.style.display = this.value === "0" ? "none" : "block";
        });
    });

    if (priorityInput) {
        priorityInput.style.display = currentDevice.config.stp > 0 ? "block" : "none";
    }
    updateRstpButtonStyle(currentDevice, currentDevice.config.stp);
}

export const ConfigRSTP = function (currentDevice: any) {
    const modalId = "RstpModal_" + currentDevice.data.id;

    const buttonHTML = document.getElementById("config_button_rstp_script")!.innerHTML;
    const nameWrap = document.getElementById("config_switch_name");
    if (nameWrap) {
        const tmpl = document.createElement("template");
        tmpl.innerHTML = buttonHTML;
        nameWrap.append(tmpl.content);
    }
    const buttonElem = document.getElementById("config_button_rstp") as HTMLButtonElement | null;
    if (buttonElem) {
        (buttonElem as any).value = currentDevice.config.stp;
        buttonElem.setAttribute("data-bs-target", "#" + modalId);
    }

    document.getElementById(modalId)?.remove();
    let modalHTML = document.getElementById("config_modal_rstp_script")!.innerHTML;
    modalHTML = modalHTML.replace('id="RstpModal"', 'id="' + modalId + '"');
    const modalTmpl = document.createElement("template");
    modalTmpl.innerHTML = modalHTML;
    document.body.append(modalTmpl.content);

    // Initialize Bootstrap tooltips for any [data-bs-toggle="tooltip"]
    // elements that were just inserted. The legacy code used the jQuery
    // plugin equivalent; the native API is identical.
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
        new (window.bootstrap as any).Tooltip(el);
    });
    eventHandlers(currentDevice, modalId);
};
