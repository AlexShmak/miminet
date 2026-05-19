// Edge loss/duplicate percentage inputs. Originally the legacy template
// used inline `oninput="this.value = ..."` to clamp values to [0, 100].
// Here that logic moves to a React handler.

import type { ChangeEvent } from "react";

interface Props {
    loss: number | string;
    duplicate: number | string;
}

function clampPercentEvent(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value.replace(/[^0-9]/g, "");
    const clamped = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));
    event.target.value = String(clamped);
}

export function EdgeNetworkIssues({ loss, duplicate }: Props) {
    return (
        <div className="form-group pb-2">
            <label htmlFor="edge_loss" className="text-sm">
                Потери пакетов (%)
            </label>
            <input
                type="number"
                id="edge_loss"
                className="form-control form-control-sm"
                name="edge_loss"
                min={0}
                max={100}
                step={1}
                placeholder="0"
                onInput={clampPercentEvent}
                defaultValue={loss}
            />

            <label htmlFor="edge_duplicate" className="text-sm">
                Дублирование пакетов (%)
            </label>
            <input
                type="number"
                id="edge_duplicate"
                className="form-control form-control-sm"
                name="edge_duplicate"
                min={0}
                max={100}
                step={1}
                placeholder="0"
                onInput={clampPercentEvent}
                defaultValue={duplicate}
            />
        </div>
    );
}
