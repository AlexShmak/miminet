import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EdgeNetworkIssues } from "../../src/components/EdgeNetworkIssues";

describe("EdgeNetworkIssues", () => {
    it("renders loss and duplicate inputs with initial values", () => {
        render(<EdgeNetworkIssues loss={25} duplicate={10} />);

        const loss = screen.getByLabelText("Потери пакетов (%)") as HTMLInputElement;
        const dup = screen.getByLabelText("Дублирование пакетов (%)") as HTMLInputElement;

        expect(loss.value).toBe("25");
        expect(dup.value).toBe("10");
        expect(loss.min).toBe("0");
        expect(loss.max).toBe("100");
    });

    // The legacy template's `oninput` clamps values to [0,100] and
    // strips non-digits — we ported that logic into a React handler.
    // The clamp mutates the event target's `.value` directly (matching
    // the original behaviour), and the input is uncontrolled, so the
    // mutated value sticks in the DOM.
    it("clamps values above 100 down to 100 on input", () => {
        render(<EdgeNetworkIssues loss={0} duplicate={0} />);
        const loss = screen.getByLabelText("Потери пакетов (%)") as HTMLInputElement;

        fireEvent.input(loss, { target: { value: "150" } });
        expect(loss.value).toBe("100");
    });

    // type="number" inputs in real browsers reject non-digits at the
    // DOM level, so the handler usually sees only digits. The legacy
    // `oninput` regex was defensive for older browsers; the React
    // handler keeps that defence — non-numeric input clamps to 0.
    it("treats empty / non-numeric input as 0", () => {
        render(<EdgeNetworkIssues loss={50} duplicate={0} />);
        const loss = screen.getByLabelText("Потери пакетов (%)") as HTMLInputElement;

        fireEvent.input(loss, { target: { value: "abc" } });
        expect(loss.value).toBe("0");
    });
});
