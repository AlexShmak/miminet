import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeviceNameField } from "../../src/device-config/DeviceNameField";

describe("DeviceNameField", () => {
    it("renders the label, id and name from props", () => {
        render(
            <DeviceNameField
                inputId="config_host_name"
                inputName="config_host_name"
                label="Имя хоста"
                initialValue="host_1"
            />
        );
        const input = screen.getByLabelText("Имя хоста") as HTMLInputElement;
        expect(input).toBeInTheDocument();
        expect(input.id).toBe("config_host_name");
        expect(input.name).toBe("config_host_name");
        expect(input.value).toBe("host_1");
    });

    it("defaults maxLength to 32", () => {
        render(<DeviceNameField inputId="x" inputName="x" label="x" initialValue="" />);
        const input = screen.getByLabelText("x") as HTMLInputElement;
        expect(input.maxLength).toBe(32);
    });

    it("respects custom maxLength", () => {
        render(
            <DeviceNameField inputId="x" inputName="x" label="x" initialValue="" maxLength={8} />
        );
        const input = screen.getByLabelText("x") as HTMLInputElement;
        expect(input.maxLength).toBe(8);
    });

    it("is uncontrolled — user typing changes the value without parent re-render", async () => {
        const user = userEvent.setup();
        render(<DeviceNameField inputId="x" inputName="x" label="x" initialValue="abc" />);
        const input = screen.getByLabelText("x") as HTMLInputElement;
        await user.clear(input);
        await user.type(input, "new name");
        expect(input.value).toBe("new name");
    });
});
