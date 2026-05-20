import { DeleteAndSaveJob, updateGridForConfigPanel } from "../netfront/runtime";
import { UpdateHostConfiguration } from "../netfront/update_config";

// Lazy-load the per-device config-form templates. Equivalent to jQuery's
// `$(...).load(url)`: GET the URL, drop the response HTML into the
// container, and ignore failures (matches the prior fire-and-forget
// behavior).
const loadFragment = (containerId: string, url: string): void => {
    const container = document.getElementById(containerId);
    if (!container) return;
    fetch(url, { credentials: "include" })
        .then((res) => (res.ok ? res.text() : Promise.reject(res.statusText)))
        .then((html) => {
            container.innerHTML = html;
        })
        .catch((err) => console.warn(`Failed to load ${url}:`, err));
};

loadFragment("config_host", ExternalUrlFor("/config_host.html"));
loadFragment("config_hub", ExternalUrlFor("/config_hub.html"));
loadFragment("config_switch", ExternalUrlFor("/config_switch.html"));
loadFragment("config_edge", ExternalUrlFor("/config_edge.html"));
loadFragment("config_router", ExternalUrlFor("/config_router.html"));
loadFragment("config_server", ExternalUrlFor("/config_server.html"));
loadFragment("config_vlan", ExternalUrlFor("/config_vlan.html"));
loadFragment("config_vxlan", ExternalUrlFor("/config_vxlan.html"));

export const config_content_id = "#config_content";
export const config_main_form_id = "#config_main_form";
export const config_router_main_form_id = "#config_router_main_form";
export const config_server_main_form_id = "#config_server_main_form";
export const config_hub_main_form_id = "#config_hub_main_form";
export const config_switch_main_form_id = "#config_switch_main_form";
export const config_edge_main_form_id = "#config_edge_main_form";
export const config_content_save_tag = "#config_content_save";
export const config_content_save_id = "config_content_save";

const WARNING_TEMPLATE = (msg: string) =>
    '<div class="alert alert-info alert-dismissible fade show" role="alert">' +
    msg +
    '<button class="btn-close" type="button" data-bs-dismiss="alert" aria-label="Close"></button></div>';

const prependHtml = (containerSelector: string, html: string): void => {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const tmpl = document.createElement("template");
    tmpl.innerHTML = html;
    container.prepend(tmpl.content);
};

export const ClearConfigForm = function (text: string) {
    let txt = text;

    if (!text) {
        txt = "Тут будут настройки устройств. Выделите любое на схеме.";
    }

    const content = document.querySelector(config_content_id);
    const saveTag = document.querySelector(config_content_save_tag);
    if (content) {
        content.replaceChildren();
        const span = document.createElement("span");
        span.textContent = txt;
        content.appendChild(span);
    }
    if (saveTag) saveTag.replaceChildren();
    document.getElementById(config_content_save_id)!.style.display = "none";

    if (typeof updateGridForConfigPanel === "function") {
        updateGridForConfigPanel();
    }
};

export const HostWarningMsg = function (msg: string) {
    prependHtml(config_content_id, WARNING_TEMPLATE(msg));
};
export const SwitchWarningMsg = function (msg: string) {
    prependHtml(config_content_id, WARNING_TEMPLATE(msg));
};
export const ServerWarningMsg = function (msg: string) {
    prependHtml(config_content_id, WARNING_TEMPLATE(msg));
};

export const HostErrorMsg = function (msg: string) {
    const content = document.querySelector(config_content_id);
    if (content) {
        content.querySelectorAll(".alert-info, .alert-danger").forEach((el) => el.remove());
    }

    prependHtml(config_content_id, WARNING_TEMPLATE(msg));

    const reEnableInputs = (selector: string) => {
        document
            .querySelectorAll<HTMLInputElement>(
                selector + " input, " + selector + " select, " + selector + " textarea"
            )
            .forEach((input) => {
                input.disabled = false;
            });
    };
    reEnableInputs("#config_main_form");
    reEnableInputs("#config_router_main_form");
    reEnableInputs("#config_server_main_form");
    // Original selector was missing the `#` (typo in legacy code) — kept
    // intentionally as a no-op to preserve behavior.
    reEnableInputs("config_switch_main_form");

    [
        "config_host_main_form_submit_button",
        "config_router_main_form_submit_button",
        "config_server_main_form_submit_button",
        "config_switch_main_form_submit_button",
    ].forEach((id) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.textContent = "Сохранить";
        btn.classList.remove("disabled");
    });
};

export const UpdateJobCounter = function (counterId: string, _deviceId: string | null = null) {
    const counter = document.getElementById(counterId);
    if (!counter) {
        return;
    }

    counter.style.display = "none";
};

export const UpdateHostConfigurationForm = function (host_id: string) {
    const form = document.getElementById("config_main_form") as HTMLFormElement | null;
    if (!form) return;
    const data = new URLSearchParams(
        new FormData(form) as unknown as Record<string, string>
    ).toString();

    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea"
    ).forEach((input) => {
        input.disabled = true;
    });

    const submit = document.getElementById("config_host_main_form_submit_button");
    if (submit) {
        submit.textContent = "";
        submit.insertAdjacentHTML(
            "beforeend",
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="ps-3">Сохранение...</span>'
        );
    }

    DeleteAndSaveJob("host", UpdateHostConfiguration, data, host_id);
};
