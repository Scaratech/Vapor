import { FileSystem } from "./fs";

declare global {
    interface Window {
        $fs: FileSystem;
    }
}

async function setup() {
    await navigator.serviceWorker.register('/sw.js');

    const fs = new FileSystem();
    await fs.init();
    window.$fs = fs;
}

setup();