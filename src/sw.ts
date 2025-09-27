declare let self: ServiceWorkerGlobalScope & {
    opfs: FileSystemDirectoryHandle
};

import * as mime from "mime";

const PRECACHE_ASSETS = [
    '/', 
    '/index.html', 
    '/index.css', '/styles/global.css', '/styles/landing.css', '/styles/browse.css', '/styles/player.css',
    '/index.js'
];

(async () => { self.opfs = await navigator.storage.getDirectory() })();

// Creates file & directory structure in OPFS for a given path
async function createInOPFS(
    root: FileSystemDirectoryHandle,
    path: string
): Promise<FileSystemFileHandle> {
    const parts = path.split("/").filter((p) => p.length > 0);
    const fileName = parts.pop();
    let currentDir = root;

    for (const part of parts) {
        try {
            currentDir = await currentDir.getDirectoryHandle(part, {
                create: true
            });
        } catch (err) {
            if (err.name === "TypeMismatchError") {
                await currentDir.removeEntry(part, { recursive: true });

                currentDir = await currentDir.getDirectoryHandle(part, {
                    create: true
                });
            } else {
                throw err;
            }
        }
    }

    try {
        return await currentDir.getFileHandle(fileName, { create: true });
    } catch (err) {
        if (err.name === "TypeMismatchError") {
            await currentDir.removeEntry(fileName, { recursive: true });
            return await currentDir.getFileHandle(fileName, { create: true });
        }

        throw err;
    }
}

// Downloads all files in PRECACHE_ASSETS to OPFS
async function preCache() {
    for (const resource of PRECACHE_ASSETS) {
        try {
            const parts = `app${resource}`
                .split("/")
                .filter((p) => p.length > 0);
            const fileName = parts.pop();
            let currentDir = self.opfs;

            for (const part of parts) {
                try {
                    currentDir = await currentDir.getDirectoryHandle(part, {
                        create: true
                    });
                } catch (err) {
                    if (err.name === "TypeMismatchError") {
                        await currentDir.removeEntry(part, { recursive: true });
                        currentDir = await currentDir.getDirectoryHandle(part, {
                            create: true
                        });
                    } else {
                        throw err;
                    }
                }
            }

            let exists = true;

            try {
                await currentDir.getFileHandle(fileName);
            } catch {
                exists = false;
            }

            if (!exists) {
                const res = await fetch(resource);

                if (res.ok) {
                    const fileHandle = await createInOPFS(self.opfs, `app${resource}`);
                    const writable = await fileHandle.createWritable();

                    await writable.write(await res.arrayBuffer());
                    await writable.close();
                }
            }
        } catch (err) {
            console.error("Precache failed for", resource, err);
        }
    }
}

// OPFS "middleware", Will serve a file from OPFS given a path 
async function serveOPFS(url: string): Promise<Response> {
    const path = new URL(url).pathname.replace(/^\/fs/, "");

    try {
        const parts = path.split("/").filter((p) => p.length > 0);
        const fileName = parts.pop();
        let currentDir = self.opfs;

        for (const part of parts) {
            currentDir = await currentDir.getDirectoryHandle(part);
        }

        const fileHandle = await currentDir.getFileHandle(fileName);
        const file = await fileHandle.getFile();

        let mimeType =
            file.type ||
            mime.default.getType(fileName.split(".").pop() || "") ||
            "application/octet-stream";

        return new Response(file, {
            status: 200,
            headers: { "Content-Type": mimeType }
        });
    } catch {
        return new Response(`File not found: ${path}`, {
            status: 404,
            statusText: "Not Found"
        });
    }
}

// Saves a response in OPFS at given path
async function resToOPFS(path: string, res: Response) {
    const handle = await createInOPFS(self.opfs, `app${path}`);
    const writable = await handle.createWritable();

    await writable.write(await res.arrayBuffer());
    await writable.close();
}

self.addEventListener("install", (ev) => {
    ev.waitUntil(
        (async () => {
            try {
                await preCache();
            } catch (err) {
                console.warn('[sw] failed to precache:', err);
            }
        })()
    );

    self.skipWaiting();
});

self.addEventListener("activate", () => { self.clients.claim(); });

/*
    1. Defines the /fs/ route which can be used to get files from OPFS
    2. Attempts to serve from OPFS first, then falls back to network, and downloads it (if same origin) for next request
*/
self.addEventListener("fetch", (ev) => {
    const url = new URL(ev.request.url);
    const pathname = url.pathname;

    if (pathname.startsWith("/fs/")) {
        ev.respondWith(serveOPFS(ev.request.url));
        return;
    }
    if (url.origin !== self.location.origin) {
        ev.respondWith(fetch(ev.request));
        return;
    }

    const promise = (async () => {
        const path = `app${pathname === "/" ? "/index.html" : pathname}`;

        try {
            const parts = path.split("/").filter(p => p.length > 0);
            const fileName = parts.pop();

            let current = self.opfs;

            for (const part of parts) {
                current = await current.getDirectoryHandle(part);
            }

            const handle = await current.getFileHandle(fileName);
            const file = await handle.getFile();

            return new Response(file, {
                status: 200,
                headers: {
                    "Content-Type": mime.default.getType(file.name) || "application/octet-stream",
                }
            });
        } catch (err) {
            const res = await fetch(ev.request);
            
            if (res.ok) {
                try {
                    await resToOPFS(pathname === "/" ? "/index.html" : pathname, res.clone());
                } catch (err) {
                    console.warn('[sw] failed to cache:', err);
                }
            }

            return res;
        }
    })();

    ev.respondWith(promise);
});
