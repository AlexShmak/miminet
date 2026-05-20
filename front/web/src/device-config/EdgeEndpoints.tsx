// Edge endpoint labels (source/target) shown in the edge config panel.
// Both inputs are disabled — they're informational only — but keep the
// `id`/`name` so form serialization and existing selectors still work.

interface Props {
    source: string;
    target: string;
}

export function EdgeEndpoints({ source, target }: Props) {
    return (
        <>
            <div className="form-group pb-2">
                <label htmlFor="edge_source" className="text-sm">
                    Из
                </label>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    id="edge_source"
                    name="edge_source"
                    defaultValue={source}
                    disabled
                />
            </div>
            <div className="form-group pb-2">
                <label htmlFor="edge_target" className="text-sm">
                    В
                </label>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    id="edge_target"
                    name="edge_target"
                    defaultValue={target}
                    disabled
                />
            </div>
        </>
    );
}
