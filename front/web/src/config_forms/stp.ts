import { state } from "../lib/state";
// STP / RSTP modal config wiring for L2 switches.
// Migrated from front/src/static/config_stp.js.

import { UpdateSwitchConfiguration } from "../netfront/update_config";

function updateRstpButtonStyle(_currentDevice: any, rstp_stp_config: any) {
    $("#config_button_rstp").val(rstp_stp_config);
    if (rstp_stp_config > 0) {
        if (rstp_stp_config == 1) {
            $("#config_button_rstp_text").text("STP");
        }
        if (rstp_stp_config == 2) {
            $("#config_button_rstp_text").text("RSTP");
        }
        $("#config_button_rstp")
            .addClass("btn-outline-primary")
            .removeClass("btn-outline-secondary");
    } else {
        $("#config_button_rstp")
            .removeClass("btn-outline-primary")
            .addClass("btn-outline-secondary");
        $("#config_button_rstp_text").text("STP");
    }
}

function eventHandlers(currentDevice: any, modalId: string) {
    $("#" + modalId)
        .find("#rstpConfigurationCancelIcon, #rstpConfigurationCancel")
        .on("click", function () {
            ($("#" + modalId) as any).modal("hide");
        });
    const modalRadios = "#" + modalId + " input[type='radio'][name='config_rstp_stp']";
    $(modalRadios + '[value="' + currentDevice.config.stp + '"]').attr("checked", "checked");
    $("#" + modalId)
        .find("#config_stp_priority")
        .val(currentDevice.config.priority);

    $("#" + modalId)
        .find("#rstpConfigurationSubmit")
        .on("click", function () {
            const rstp_stp_config = $(modalRadios + ":checked").val();
            ($("#" + modalId) as any).modal("hide");
            updateRstpButtonStyle(currentDevice, rstp_stp_config);

            const switch_id = currentDevice.data.id;
            $("#" + modalId + " #modal_switch_id").val(switch_id);
            $("#" + modalId + " #modal_net_guid").val(state.network_guid);

            const data = $("#" + modalId)
                .find("#form_config_rstp_stp")
                .serialize();
            UpdateSwitchConfiguration(data, switch_id);
        });

    const priorityInput = $("#" + modalId + " #input_priority_form")[0];

    document.querySelectorAll(modalRadios).forEach((radio) => {
        radio.addEventListener("change", function (this: any) {
            if (this.value === "0") {
                priorityInput.style.display = "none";
            } else {
                priorityInput.style.display = "block";
            }
        });
    });

    if (currentDevice.config.stp > 0) {
        priorityInput.style.display = "block";
    } else {
        priorityInput.style.display = "none";
    }
    updateRstpButtonStyle(currentDevice, currentDevice.config.stp);
}

export const ConfigRSTP = function (currentDevice: any) {
    const modalId = "RstpModal_" + currentDevice.data.id;

    const buttonHTML = document.getElementById("config_button_rstp_script")!.innerHTML;
    const buttonElem = $(buttonHTML).appendTo("#config_switch_name");
    buttonElem.val(currentDevice.config.stp);
    buttonElem.attr("data-bs-target", "#" + modalId);

    $("#" + modalId).remove();
    let modalHTML = document.getElementById("config_modal_rstp_script")!.innerHTML;
    modalHTML = modalHTML.replace('id="RstpModal"', 'id="' + modalId + '"');
    $(modalHTML).appendTo("body");

    $(function () {
        ($('[data-bs-toggle="tooltip"]') as any).tooltip();
        eventHandlers(currentDevice, modalId);
    });
};
