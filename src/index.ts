import { FileSystem, dlGame } from "./fs";

declare global {
    interface Window {
        $fs: FileSystem;
        $dl: typeof dlGame
    }
}

async function setup() {
    await navigator.serviceWorker.register('/sw.js');

    const fs = new FileSystem();
    await fs.init();

    window.$fs = fs;
    window.$dl = dlGame;
}

setup();