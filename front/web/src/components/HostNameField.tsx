// First React component in the codebase — a pilot.
//
// Replaces the `config_host_name_script` Jinja template fragment that
// helpers.ts used to clone via jQuery `.innerHTML` injection. The
// surrounding host form is still jQuery-driven; submit serializes via
// `$('#config_main_form').serialize()` so the input name + value must
// match exactly. Using `defaultValue` (uncontrolled) keeps Selenium's
// `send_keys` interactions working without React reasserting state.

import { useRef } from "react";

interface Props {
    initialValue: string;
}

export function HostNameField({ initialValue }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="form-group pb-2">
            <label htmlFor="config_host_name" className="text-sm">
                Имя хоста
            </label>
            <input
                ref={inputRef}
                type="text"
                className="form-control form-control-sm"
                id="config_host_name"
                name="config_host_name"
                defaultValue={initialValue}
                maxLength={32}
            />
        </div>
    );
}
