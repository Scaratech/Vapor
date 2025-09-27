import { FileSystem, dlGame } from "./fs";
import { obfuscator } from "./obfuscate";
import { render as renderLanding } from "./ui/landing";
import { render as renderBrowse } from "./ui/browse";
import { render as renderPlayer } from "./ui/player";

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

    try { 
        obfuscator(document); 
    } catch { }

    const transitionTo = (next: () => void) => {
        app.classList.remove('view-enter');
        app.classList.add('view-exit');

        const done = () => {
            app.classList.remove('view-exit');
            next();

            requestAnimationFrame(() => app.classList.add('view-enter'));
            app.removeEventListener('animationend', done);
        };

        app.addEventListener('animationend', done, { once: true });
    };

    const renderWithEnter = (next: () => void) => {
        app.classList.remove('view-enter');
        app.classList.remove('view-exit');

        next();
        requestAnimationFrame(() => app.classList.add('view-enter'));
    };

    const route = (animate = false) => {
        const params = new URLSearchParams(location.search);
        const game = params.get('id');
        const page = (params.get('page') || '').toLowerCase();

        if (game) {
            const go = () => renderPlayer(app, game, () => {
                history.pushState({ page: 'browse' }, '', `?page=browse`);
                transitionTo(() => renderBrowse(app));
            });

            return animate ? transitionTo(go) : renderWithEnter(go);
        }

        if (page === 'browse') {
            const go = () => renderBrowse(app);
            return animate ? transitionTo(go) : renderWithEnter(go);
        }

        const goLanding = () => renderLanding(app, () => {
            history.pushState({ page: 'browse' }, '', `?page=browse`);
            transitionTo(() => renderBrowse(app));
        });

        return animate ? transitionTo(goLanding) : renderWithEnter(goLanding);
    };

    route(false);
    window.addEventListener('popstate', () => route(true));
}

setup();
