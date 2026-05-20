import { state } from "../lib/state";
import { config_content_id, config_content_save_id, config_content_save_tag } from "./common";

// Shared (read-only) versions of the device config forms.

const clearAndAppendForm = (formHtml: string, saveDisplay: "" | "none") => {
    const content = document.querySelector(config_content_id);
    const saveTag = document.querySelector(config_content_save_tag);
    if (content) content.replaceChildren();
    if (saveTag) saveTag.replaceChildren();
    const saveEl = document.getElementById(config_content_save_id);
    if (saveEl) saveEl.style.display = saveDisplay === "" ? "block" : "none";

    if (content) {
        const tmpl = document.createElement("template");
        tmpl.innerHTML = formHtml;
        content.append(tmpl.content);
    }
};

const setValue = (id: string, value: string) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = value;
};

const disableSubmit = (id: string) => {
    const btn = document.getElementById(id) as HTMLButtonElement | null;
    if (btn) btn.disabled = true;
};

export const SharedConfigHostForm = function (host_id: string) {
    const form = document.getElementById("config_host_main_form_script")!.innerHTML;
    clearAndAppendForm(form, "none");
    setValue("host_id", host_id);
    setValue("net_guid", state.network_guid);
    disableSubmit("config_host_main_form_submit_button");
};

export const SharedConfigRouterForm = function (router_id: string) {
    const form = document.getElementById("config_router_main_form_script")!.innerHTML;
    clearAndAppendForm(form, "none");
    setValue("router_id", router_id);
    setValue("net_guid", state.network_guid);
    disableSubmit("config_router_main_form_submit_button");
};

export const SharedConfigServerForm = function (router_id: string) {
    const form = document.getElementById("config_server_main_form_script")!.innerHTML;
    clearAndAppendForm(form, "none");
    setValue("router_id", router_id);
    setValue("net_guid", state.network_guid);
    disableSubmit("config_server_main_form_submit_button");
};

export const SharedConfigHubForm = function (_hub_id: string) {
    const form = document.getElementById("config_hub_main_form_script")!.innerHTML;
    clearAndAppendForm(form, "none");
    disableSubmit("config_hub_main_form_submit_button");
};

export const SharedConfigSwitchForm = function (_switch_id: string) {
    const form = document.getElementById("config_switch_main_form_script")!.innerHTML;
    clearAndAppendForm(form, "none");
    disableSubmit("config_switch_main_form_submit_button");
};

export const SharedConfigEdgeForm = function (_edge_id: string) {
    const form = document.getElementById("config_edge_main_form_script")!.innerHTML;
    clearAndAppendForm(form, "");
    disableSubmit("config_edge_main_form_submit_button");
};
