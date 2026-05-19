// Migrated from front/src/static/config_forms/shared.js
//
// Each function is exposed as an ES-module export. main.ts re-attaches
// them to `window` via `attachGlobals` so existing inline HTML handlers
// keep working. Bare references like `$`, `network_guid`,
// `config_content_id` still resolve via the global scope — they are
// owned by the remaining classic scripts and inline <script> tags.

export const SharedConfigHostForm = function (host_id: string) {
    const form = document.getElementById("config_host_main_form_script")!.innerHTML;

    // Clear all child
    $(config_content_id).empty();
    $(config_content_save_tag).empty();
    document.getElementById(config_content_save_id)!.style.display = "none";

    // Add new form
    $(config_content_id).append(form);

    // Set host_id
    $("#host_id").val(host_id);
    $("#net_guid").val(network_guid);
    $("#config_host_main_form_submit_button").prop("disabled", true);
};

export const SharedConfigRouterForm = function (router_id: string) {
    const form = document.getElementById("config_router_main_form_script")!.innerHTML;

    // Clear all child
    $(config_content_id).empty();
    $(config_content_save_tag).empty();
    document.getElementById(config_content_save_id)!.style.display = "none";

    // Add new form
    $(config_content_id).append(form);

    // Set host_id
    $("#router_id").val(router_id);
    $("#net_guid").val(network_guid);

    $("#config_router_main_form_submit_button").prop("disabled", true);
};

export const SharedConfigServerForm = function (router_id: string) {
    const form = document.getElementById("config_server_main_form_script")!.innerHTML;

    // Clear all child
    $(config_content_id).empty();
    $(config_content_save_tag).empty();
    document.getElementById(config_content_save_id)!.style.display = "none";

    // Add new form
    $(config_content_id).append(form);

    // Set host_id
    $("#router_id").val(router_id);
    $("#net_guid").val(network_guid);

    $("#config_server_main_form_submit_button").prop("disabled", true);
};

export const SharedConfigHubForm = function (_hub_id: string) {
    const form = document.getElementById("config_hub_main_form_script")!.innerHTML;

    // Clear all child
    $(config_content_id).empty();
    $(config_content_save_tag).empty();
    document.getElementById(config_content_save_id)!.style.display = "none";

    // Add new form
    $(config_content_id).append(form);
    $("#config_hub_main_form_submit_button").prop("disabled", true);
};

export const SharedConfigSwitchForm = function (_switch_id: string) {
    const form = document.getElementById("config_switch_main_form_script")!.innerHTML;

    // Clear all child
    $(config_content_id).empty();
    $(config_content_save_tag).empty();
    document.getElementById(config_content_save_id)!.style.display = "none";

    // Add new form
    $(config_content_id).append(form);
    $("#config_switch_main_form_submit_button").prop("disabled", true);
};

export const SharedConfigEdgeForm = function (_edge_id: string) {
    const form = document.getElementById("config_edge_main_form_script")!.innerHTML;

    // Clear all child
    $(config_content_id).empty();
    $(config_content_save_tag).empty();
    document.getElementById(config_content_save_id)!.style.display = "block";

    // Add new form
    $(config_content_id).append(form);
    $("#config_edge_main_form_submit_button").prop("disabled", true);
};
