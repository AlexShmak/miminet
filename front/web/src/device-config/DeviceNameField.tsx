// Generic device-name input shared by host, router, server, hub, switch
// config panels. Each device's helpers.ts/tsx mounts this with the
// per-device id/name/label that the existing markup used, so jQuery
// selectors and form serialization keep working unchanged.

import { useRef } from "react";

export interface DeviceNameFieldProps {
    inputId: string;
    inputName: string;
    label: string;
    initialValue: string;
    maxLength?: number;
}

// Just label + input. The form-group wrapper is the caller's
// responsibility because legacy code (ConfigRSTP/ConfigVLAN) needs to
// append modal-trigger buttons to that wrapper, which means it can't
// be owned by React.
export function DeviceNameField({
    inputId,
    inputName,
    label,
    initialValue,
    maxLength = 32,
}: DeviceNameFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <>
            <label htmlFor={inputId} className="text-sm">
                {label}
            </label>
            <input
                ref={inputRef}
                type="text"
                className="form-control form-control-sm"
                id={inputId}
                name={inputName}
                defaultValue={initialValue}
                maxLength={maxLength}
            />
        </>
    );
}
