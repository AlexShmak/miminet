// JWT auth wrappers around native fetch.
//
// `ajaxWithAuth` preserves the $.ajax-shaped option object (type, url,
// data, contentType, dataType, success(data, textStatus, xhr),
// error(xhr), complete()) that the existing call sites use, and
// transparently retries once after refreshing the access token on 401.
//
// The wrapper sends `credentials: "include"` so the access/refresh
// cookies travel with every request, and parses the response body once
// into a `jqXHR`-like object whose .status / .responseJSON / .responseText
// callers already rely on (e.g. the simulation poller checks
// xhr.status === 210 as a "still processing" sentinel).

type QueuedPromise = {
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
};

export type AjaxOptions = {
    url: string;
    type?: string;
    method?: string;
    data?: unknown;
    contentType?: string | false;
    processData?: boolean;
    dataType?: string;
    headers?: Record<string, string>;
    success?: (data: unknown, status: string, xhr: XhrLike) => void;
    error?: (xhr: XhrLike, status: string, err: string) => void;
    complete?: (xhr: XhrLike, status: string) => void;
};

export type XhrLike = {
    status: number;
    statusText: string;
    responseText: string;
    responseJSON?: unknown;
    response?: unknown;
    getResponseHeader: (name: string) => string | null;
};

let isRefreshing = false;
let failedQueue: QueuedPromise[] = [];

function processQueue(error: unknown) {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
}

function buildBody(opts: AjaxOptions): BodyInit | undefined {
    const { data, contentType, processData, type, method } = opts;
    if (data === undefined || data === null || data === "") return undefined;
    const verb = (method || type || "GET").toUpperCase();
    if (verb === "GET" || verb === "HEAD") return undefined;

    if (data instanceof FormData || data instanceof Blob || data instanceof URLSearchParams) {
        return data;
    }
    if (typeof data === "string") {
        return data;
    }
    if (contentType && /json/i.test(String(contentType))) {
        return JSON.stringify(data);
    }
    if (processData === false) {
        return data as BodyInit;
    }
    return new URLSearchParams(data as Record<string, string>).toString();
}

function buildUrl(opts: AjaxOptions): string {
    const { url, data, type, method } = opts;
    const verb = (method || type || "GET").toUpperCase();
    if ((verb !== "GET" && verb !== "HEAD") || data == null || data === "") return url;
    let qs = "";
    if (typeof data === "string") {
        qs = data;
    } else if (data instanceof URLSearchParams) {
        qs = data.toString();
    } else if (typeof data === "object") {
        qs = new URLSearchParams(data as Record<string, string>).toString();
    }
    if (!qs) return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${qs}`;
}

function buildHeaders(opts: AjaxOptions): Headers {
    const headers = new Headers();
    headers.set("X-Requested-With", "XMLHttpRequest");
    const { data, contentType, processData } = opts;
    const verb = (opts.method || opts.type || "GET").toUpperCase();
    const hasBody = verb !== "GET" && verb !== "HEAD" && data != null && data !== "";

    if (contentType === false) {
        // Caller will set its own (or let fetch infer from FormData).
    } else if (contentType) {
        headers.set("Content-Type", String(contentType));
    } else if (hasBody && !(data instanceof FormData) && processData !== false) {
        headers.set("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    }
    if (opts.headers) {
        Object.entries(opts.headers).forEach(([k, v]) => headers.set(k, v));
    }
    return headers;
}

async function toXhrLike(response: Response): Promise<XhrLike> {
    const text = await response.text();
    let json: unknown;
    try {
        json = text ? JSON.parse(text) : undefined;
    } catch {
        json = undefined;
    }
    return {
        status: response.status,
        statusText: response.statusText,
        responseText: text,
        responseJSON: json,
        response: json !== undefined ? json : text,
        getResponseHeader: (name: string) => response.headers.get(name),
    };
}

function parseBody(xhr: XhrLike, dataType?: string): unknown {
    if (dataType === "text") return xhr.responseText;
    if (xhr.responseJSON !== undefined) return xhr.responseJSON;
    return xhr.responseText;
}

function rawFetch(opts: AjaxOptions): Promise<Response> {
    const verb = (opts.method || opts.type || "GET").toUpperCase();
    return fetch(buildUrl(opts), {
        method: verb,
        headers: buildHeaders(opts),
        body: buildBody(opts),
        credentials: "include",
    });
}

function refreshTokens(): Promise<unknown> {
    return new Promise((resolve, reject) => {
        rawFetch({ url: "/refresh_access", method: "POST" })
            .then((res) => (res.ok ? resolve(undefined) : reject(res)))
            .catch(reject);
    });
}

export function ajaxWithAuth(options: AjaxOptions): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const dispatch = async () => {
            let response: Response;
            try {
                response = await rawFetch(options);
            } catch (err) {
                const xhr: XhrLike = {
                    status: 0,
                    statusText: "network error",
                    responseText: "",
                    getResponseHeader: () => null,
                };
                options.error?.(xhr, "error", String(err));
                options.complete?.(xhr, "error");
                reject(err);
                return;
            }

            const xhr = await toXhrLike(response);

            if (response.ok) {
                const body = parseBody(xhr, options.dataType);
                options.success?.(body, response.statusText, xhr);
                options.complete?.(xhr, response.statusText);
                resolve(body);
                return;
            }

            if (response.status !== 401) {
                options.error?.(xhr, "error", response.statusText);
                options.complete?.(xhr, response.statusText);
                reject(xhr);
                return;
            }

            if (options.url === "/refresh_access") {
                const next_url = document.URL;
                window.location.href = "/auth/login.html?next=" + next_url;
                reject(xhr);
                return;
            }

            if (isRefreshing) {
                failedQueue.push({ resolve: () => void dispatch(), reject });
                return;
            }

            isRefreshing = true;
            refreshTokens()
                .then(() => {
                    processQueue(null);
                    return dispatch();
                })
                .catch((err: unknown) => {
                    const next_url = document.URL;
                    processQueue(err);
                    window.location.href = "/auth/login.html?next=" + next_url;
                    reject(err);
                })
                .finally(() => {
                    isRefreshing = false;
                });
        };

        void dispatch();
    });
}

export function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const baseHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
    };
    const init: RequestInit = {
        ...options,
        credentials: "include",
        headers: { ...baseHeaders, ...((options.headers as Record<string, string>) || {}) },
    };

    const dispatch = (): Promise<Response> => fetch(url, init);

    return new Promise<Response>((resolve, reject) => {
        dispatch()
            .then((response) => {
                if (response.status !== 401) {
                    resolve(response);
                    return;
                }

                if (isRefreshing) {
                    failedQueue.push({
                        resolve: () => dispatch().then(resolve).catch(reject),
                        reject,
                    });
                    return;
                }

                isRefreshing = true;
                refreshTokens()
                    .then(() => {
                        processQueue(null);
                        return dispatch();
                    })
                    .then(resolve)
                    .catch((err: unknown) => {
                        processQueue(err);
                        const next_url = document.URL;
                        window.location.href = "/auth/login.html?next=" + next_url;
                        reject(err);
                    })
                    .finally(() => {
                        isRefreshing = false;
                    });
            })
            .catch(reject);
    });
}
