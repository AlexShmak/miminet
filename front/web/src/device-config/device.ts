import { state } from "../shared/state";
import { addIpFieldHandlers } from "./helpers";
import { DeleteAndSaveJob, updateGridForConfigPanel } from "../network-editor/runtime";
import {
    UpdateHostConfigurationForm,
    config_content_id,
    config_content_save_id,
    config_content_save_tag,
} from "./common";
import {
    UpdateRouterConfiguration,
    UpdateServerConfiguration,
    UpdateHubConfiguration,
    UpdateSwitchConfiguration,
} from "./update_config";
import { UpdateEdgeConfiguration } from "../simulation/simulation";

const setInputValue = (id: string, value: string) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = value;
};

const setSaveContent = (display: "" | "block" | "none") => {
    const saveEl = document.getElementById(config_content_save_id);
    if (saveEl) saveEl.style.display = display === "" ? "block" : display;
};

const appendHtml = (selector: string, html: string) => {
    const target = document.querySelector(selector);
    if (!target) return;
    const tmpl = document.createElement("template");
    tmpl.innerHTML = html;
    target.append(tmpl.content);
};

const clearContainer = (selector: string) => {
    const el = document.querySelector(selector);
    if (el) el.replaceChildren();
};

const insertHtmlBeforeSelector = (html: string, targetSelector: string) => {
    const target = document.querySelector(targetSelector);
    if (!target || !target.parentNode) return;
    const tmpl = document.createElement("template");
    tmpl.innerHTML = html;
    target.parentNode.insertBefore(tmpl.content, target);
};

const disableForm = (formSelector: string) => {
    const form = document.querySelector(formSelector);
    if (!form) return;
    form.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement
    >("input, select, textarea, button").forEach((el) => {
        el.disabled = true;
    });
};

const serializeForm = (formSelector: string): string => {
    const form = document.querySelector(formSelector) as HTMLFormElement | null;
    if (!form) return "";
    return new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
};

const swapSubmitButtonToSpinner = (id: string) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.textContent = "";
    btn.insertAdjacentHTML(
        "beforeend",
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="ps-3">Сохранение...</span>'
    );
};

const bindClick = (selectorList: string, handler: (e: Event) => void) => {
    selectorList.split(",").forEach((sel) => {
        const target = document.querySelector(sel.trim());
        if (target) target.addEventListener("click", handler);
    });
};

export const ConfigHostForm = function (host_id: string) {
    const form = document.getElementById("config_host_main_form_script")!.innerHTML;
    const button = document.getElementById("config_host_save_script")!.innerHTML;
    const banner = document.getElementById("config_host_edit_banner_script")!.innerHTML;

    clearContainer(config_content_id);
    clearContainer(config_content_save_tag);
    setSaveContent("block");

    appendHtml(config_content_id, form);
    appendHtml(config_content_id, banner);
    appendHtml(config_content_save_tag, button);

    addIpFieldHandlers();

    setInputValue("host_id", host_id);
    setInputValue("net_guid", state.network_guid);

    function handleHostClick(event: Event) {
        event.preventDefault();
        UpdateHostConfigurationForm(host_id);
    }

    bindClick("#config_host_main_form_submit_button, #config_host_end_form", handleHostClick);

    if (typeof updateGridForConfigPanel === "function") {
        updateGridForConfigPanel();
    }
};

export const ConfigRouterForm = function (router_id: string) {
    const form = document.getElementById("config_router_main_form_script")!.innerHTML;
    const button = document.getElementById("config_router_save_script")!.innerHTML;
    const banner = document.getElementById("config_router_edit_banner_script")!.innerHTML;

    clearContainer(config_content_id);
    clearContainer(config_content_save_tag);
    setSaveContent("block");

    appendHtml(config_content_id, form);
    appendHtml(config_content_id, banner);
    appendHtml(config_content_save_tag, button);

    addIpFieldHandlers();

    setInputValue("router_id", router_id);
    setInputValue("net_guid", state.network_guid);

    function handleRouterClick(event: Event) {
        event.preventDefault();
        const data = serializeForm("#config_main_form");
        disableForm("#config_main_form");
        swapSubmitButtonToSpinner("config_router_main_form_submit_button");
        DeleteAndSaveJob("router", UpdateRouterConfiguration, data, router_id);
    }

    bindClick("#config_router_main_form_submit_button, #config_router_end_form", handleRouterClick);

    if (typeof updateGridForConfigPanel === "function") {
        updateGridForConfigPanel();
    }
};

export const ConfigServerForm = function (server_id: string) {
    const form = document.getElementById("config_server_main_form_script")!.innerHTML;
    const button = document.getElementById("config_server_save_script")!.innerHTML;
    const banner = document.getElementById("config_server_edit_banner_script")!.innerHTML;

    clearContainer(config_content_id);
    clearContainer(config_content_save_tag);
    setSaveContent("block");

    appendHtml(config_content_id, form);
    appendHtml(config_content_id, banner);
    appendHtml(config_content_save_tag, button);

    addIpFieldHandlers();

    setInputValue("server_id", server_id);
    setInputValue("net_guid", state.network_guid);

    function handleServerClick(event: Event) {
        event.preventDefault();
        const data = serializeForm("#config_main_form");
        disableForm("#config_main_form");
        swapSubmitButtonToSpinner("config_server_main_form_submit_button");
        DeleteAndSaveJob("server", UpdateServerConfiguration, data, server_id);
    }

    bindClick("#config_server_main_form_submit_button, #config_server_end_form", handleServerClick);

    if (typeof updateGridForConfigPanel === "function") {
        updateGridForConfigPanel();
    }
};

export const ConfigHubForm = function (hub_id: string) {
    const form = document.getElementById("config_hub_main_form_script")!.innerHTML;
    const button = document.getElementById("config_hub_save_script")!.innerHTML;

    clearContainer(config_content_id);
    clearContainer(config_content_save_tag);
    setSaveContent("block");

    appendHtml(config_content_id, form);
    appendHtml(config_content_save_tag, button);

    addIpFieldHandlers();

    setInputValue("hub_id", hub_id);
    setInputValue("net_guid", state.network_guid);

    function handleHubClick(event: Event) {
        event.preventDefault();
        const data = serializeForm("#config_hub_main_form");
        disableForm("#config_hub_main_form");
        swapSubmitButtonToSpinner("config_hub_main_form_submit_button");
        UpdateHubConfiguration(data, hub_id);
    }

    bindClick("#config_hub_main_form_submit_button, #config_hub_end_form", handleHubClick);

    if (typeof updateGridForConfigPanel === "function") {
        updateGridForConfigPanel();
    }
};

export const ConfigSwitchForm = function (switch_id: string) {
    const form = document.getElementById("config_switch_main_form_script")!.innerHTML;
    const button = document.getElementById("config_switch_save_script")!.innerHTML;

    clearContainer(config_content_id);
    clearContainer(config_content_save_tag);
    setSaveContent("block");

    appendHtml(config_content_id, form);
    appendHtml(config_content_save_tag, button);

    addIpFieldHandlers();

    setInputValue("switch_id", switch_id);
    setInputValue("net_guid", state.network_guid);

    function handleSwitchClick(event: Event) {
        const rstpBtn = document.getElementById("config_button_rstp") as HTMLInputElement | null;
        const rstpField = document.querySelector(
            "#config_switch_main_form [name='config_rstp_stp']"
        ) as HTMLInputElement | null;
        if (rstpField) rstpField.value = rstpBtn?.value ?? "";

        event.preventDefault();
        const data = serializeForm("#config_switch_main_form");
        disableForm("#config_switch_main_form");
        swapSubmitButtonToSpinner("config_switch_main_form_submit_button");
        DeleteAndSaveJob("switch", UpdateSwitchConfiguration, data, switch_id);
    }

    bindClick("#config_switch_main_form_submit_button, #config_switch_end_form", handleSwitchClick);

    if (typeof updateGridForConfigPanel === "function") {
        updateGridForConfigPanel();
    }
};

export const ConfigEdgeForm = function (edge_id: string) {
    let edgeSaveXHR: any = null;
    const form = document.getElementById("config_edge_main_form_script")!.innerHTML;
    const button = document.getElementById("config_edge_save_script")!.innerHTML;

    clearContainer(config_content_id);
    clearContainer(config_content_save_tag);
    setSaveContent("block");

    appendHtml(config_content_id, form);
    appendHtml(config_content_save_tag, button);

    setInputValue("edge_id", edge_id);
    setInputValue("net_guid", state.network_guid);

    function handleEdgeClick(event: Event) {
        event.preventDefault();

        if (edgeSaveXHR && typeof edgeSaveXHR.abort === "function") {
            edgeSaveXHR.abort();
        }

        const data = serializeForm("#config_edge_main_form");
        const edge = state.edges.find((e: any) => e.data.id === edge_id);
        console.log(edge);
        const lossValue = (document.getElementById("edge_loss") as HTMLInputElement | null)?.value;
        const duplicateValue = (
            document.getElementById("edge_duplicate") as HTMLInputElement | null
        )?.value;

        if (edge) {
            edge.data.loss_percentage = lossValue;
            edge.data.duplicate_percentage = duplicateValue;
        }
        const disableIds = ["edge_loss", "edge_duplicate", "config_edge_main_form_submit_button"];
        disableIds.forEach((id) => {
            const el = document.getElementById(id) as HTMLInputElement | HTMLButtonElement | null;
            if (el) el.disabled = true;
        });

        const submit = document.getElementById("config_edge_main_form_submit_button");
        if (submit) {
            submit.innerHTML =
                '<span class="spinner-border spinner-border-sm" role="status"></span> Сохранение...';
        }

        edgeSaveXHR = UpdateEdgeConfiguration(data);
        disableIds.forEach((id) => {
            const el = document.getElementById(id) as HTMLInputElement | HTMLButtonElement | null;
            if (el) el.disabled = false;
        });
    }

    // Replace any prior click handlers by cloning each button: cheaper
    // than tracking refs across form re-renders.
    ["config_edge_main_form_submit_button", "config_edge_end_form"].forEach((id) => {
        const orig = document.getElementById(id);
        if (!orig) return;
        const fresh = orig.cloneNode(true) as HTMLElement;
        orig.parentNode?.replaceChild(fresh, orig);
        fresh.addEventListener("click", handleEdgeClick);
    });

    if (typeof updateGridForConfigPanel === "function") {
        updateGridForConfigPanel();
    }
};

export const ConfigSwtichSTP = function (stp: number) {
    const elem = document.getElementById("config_switch_checkbox_stp_script");
    if (!elem) return;
    insertHtmlBeforeSelector(elem.innerHTML, "#config_switch_end_form");

    const stpCheckbox = document.getElementById("config_switch_stp") as HTMLInputElement | null;
    if (stp === 1 && stpCheckbox) stpCheckbox.checked = true;

    const warning_text = document.getElementById("config_switch_warning_stp_script")!.innerHTML;
    if (stpCheckbox) {
        stpCheckbox.addEventListener("click", () => {
            if (stpCheckbox.checked) {
                insertHtmlBeforeSelector(warning_text, "#config_switch_end_form");
            } else {
                document.getElementById("config_warning_stp")?.remove();
            }
        });
    }
};

export const ConfigSwtichRSTP = function (rstp: number) {
    const elem = document.getElementById("config_switch_checkbox_rstp_script");
    if (!elem) return;
    insertHtmlBeforeSelector(elem.innerHTML, "#config_switch_end_form");

    const rstpCheckbox = document.getElementById("config_switch_rstp") as HTMLInputElement | null;
    if (rstp === 1 && rstpCheckbox) rstpCheckbox.checked = true;

    const warning_text = document.getElementById("config_switch_warning_rstp_script")!.innerHTML;
    if (rstpCheckbox) {
        rstpCheckbox.addEventListener("click", () => {
            if (rstpCheckbox.checked) {
                insertHtmlBeforeSelector(warning_text, "#config_switch_end_form");
            } else {
                document.getElementById("config_warning_rstp")?.remove();
            }
        });
    }
};
