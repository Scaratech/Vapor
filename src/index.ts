import { FileSystem, dlGame } from "./fs";
import { render as renderLanding } from "./ui/landing";

declare global {
    interface Window {
        $fs: FileSystem;
        $dl: typeof dlGame
    }
}

async function setup() {
    try { await navigator.serviceWorker.register('/sw.js'); } catch {}

    const fs = new FileSystem();
    await fs.init();

    window.$fs = fs;
    window.$dl = dlGame;

    const app = document.getElementById('app')!;
    renderLanding(app);
}

setup();
