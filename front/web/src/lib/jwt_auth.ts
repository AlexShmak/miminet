// JWT auth wrapper for ajax + fetch.
//
// Migrated from front/src/static/jwt_auth.js. The `ajaxWithAuth` helper
// wraps $.ajax with `credentials: include` and transparently retries the
// request once after refreshing the access token on 401. `fetchWithAuth`
// is the equivalent for the native fetch API.
//
// Both helpers are exposed on `window` via attachGlobals so any
// remaining inline scripts/handlers can still call them by bare name.

type QueuedPromise = {
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
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

function refreshTokens(): Promise<unknown> {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: "/refresh_access",
            method: "POST",
            xhrFields: { withCredentials: true },
        })
            .done(resolve)
            .fail(reject);
    });
}

export function ajaxWithAuth(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
        $.ajax({
            ...options,
            xhrFields: { withCredentials: true },
            headers: {
                ...options.headers,
                "X-Requested-With": "XMLHttpRequest",
            },
        })
            .done(resolve)
            .fail((xhr: any) => {
                if (xhr.status !== 401) {
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
                    failedQueue.push({ resolve, reject });
                    return;
                }

                isRefreshing = true;

                refreshTokens()
                    .then(() => {
                        processQueue(null);
                        return $.ajax({
                            ...options,
                            xhrFields: { withCredentials: true },
                            headers: {
                                ...options.headers,
                                "X-Requested-With": "XMLHttpRequest",
                            },
                        })
                            .done(resolve)
                            .fail(reject);
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
            });
    });
}

export function fetchWithAuth(url: string, options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        fetch(url, {
            ...options,
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
                ...(options.headers || {}),
            },
        })
            .then((response): any => {
                if (response.status !== 401) {
                    return response;
                }

                if (isRefreshing) {
                    return new Promise<void>((res, rej) => {
                        failedQueue.push({ resolve: res as () => void, reject: rej });
                    })
                        .then(() => fetch(url, options))
                        .then(resolve)
                        .catch(reject);
                }

                isRefreshing = true;

                return refreshTokens()
                    .then(() => {
                        processQueue(null);
                        return fetch(url, {
                            ...options,
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json",
                                "X-Requested-With": "XMLHttpRequest",
                                ...(options.headers || {}),
                            },
                        });
                    })
                    .then(resolve)
                    .catch((err: unknown) => {
                        processQueue(err);
                        const next_url = document.URL;
                        window.location.href = "/auth/login.html?next=" + next_url;
                        throw err;
                    })
                    .finally(() => {
                        isRefreshing = false;
                    });
            })
            .then(resolve)
            .catch(reject);
    });
}
