import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EdgeEndpoints } from "../../src/components/EdgeEndpoints";

describe("EdgeEndpoints", () => {
    it("renders source and target as disabled inputs with the expected ids", () => {
        render(<EdgeEndpoints source="host_1" target="host_2" />);

        const source = screen.getByLabelText("Из") as HTMLInputElement;
        const target = screen.getByLabelText("В") as HTMLInputElement;

        expect(source.id).toBe("edge_source");
        expect(source.value).toBe("host_1");
        expect(source.disabled).toBe(true);

        expect(target.id).toBe("edge_target");
        expect(target.value).toBe("host_2");
        expect(target.disabled).toBe(true);
    });
});
