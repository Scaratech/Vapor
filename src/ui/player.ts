type GameMeta = {
    title: string;
    id: string;
    image?: string;
};

async function loadGameMeta(id: string): Promise<GameMeta | undefined> {
    try {
        const res = await fetch('/metadata.json');
        if (!res.ok) return undefined;

        const data = await res.json();
        const list: GameMeta[] = Array.isArray(data.games) ? data.games : [];

        return list.find(g => (g.id || '').toLowerCase() === id.toLowerCase());
    } catch {
        return undefined;
    }
}

function tpl(meta: GameMeta, installed: boolean) {
    const src = installed ? `/fs/core/${meta.id}/index.html` : `/core/${meta.id}/index.html`;

    return `
  <section class="player">
    <div class="sparkle" aria-hidden="true"></div>
    <div class="topbar">
      <button class="btn btn-ghost" id="back">\u2190 Go Back</button>
    </div>

    <div class="header">
      <div class="icon">${meta.image ? `<img src="${meta.image}" alt="${meta.title} icon">` : ''}</div>
      <h2 class="name">${meta.title}</h2>
    </div>

    <div class="stage">
      <div class="frame-wrap">
            <iframe id="game-frame" src="${src}" title="${meta.title}" allow="autoplay; fullscreen; gamepad; keyboard-map" allowfullscreen tabindex="0" loading="lazy"></iframe>
      </div>
    </div>

    <div class="actions">
      <div class="actions-left">
        <button class="btn" id="install">${installed ? 'Uninstall' : 'Install'}</button>
        <div class="progress" id="progress" hidden>
          <div class="bar" id="bar"></div>
        </div>
      </div>
      <div class="actions-right">
        <button class="btn btn-square" id="fs" aria-label="Fullscreen" title="Fullscreen">&#x26F6;</button>
      </div>
    </div>

    <div class="site-footer">© Scaratek 2025 · <a href="https://github.com/scaratech/ama2" target="_blank" rel="noreferrer noopener">Repo</a></div>
  </section>`;
}

async function isInstalled(id: string): Promise<boolean> {
    try {
        return await window.$fs.exists(`/core/${id}/index.html`);
    } catch {
        return false;
    }
}

export async function render(root: HTMLElement, id: string, onBack?: () => void) {
    const meta = await loadGameMeta(id) || { id, title: id } as GameMeta;
    const installed = await isInstalled(id);

    root.innerHTML = tpl(meta, installed);

    const back = root.querySelector<HTMLButtonElement>('#back')!;
    const fsBtn = root.querySelector<HTMLButtonElement>('#fs')!;
    const installBtn = root.querySelector<HTMLButtonElement>('#install')!;
    const frame = root.querySelector<HTMLIFrameElement>('#game-frame')!;
    const progress = root.querySelector<HTMLDivElement>('#progress')!;
    const bar = root.querySelector<HTMLDivElement>('#bar')!;
    const frameWrap = root.querySelector<HTMLDivElement>('.frame-wrap')!;

    const focusFrame = () => {
        try {
            frame.focus();
            frame.contentWindow?.focus?.();
        } catch {}
    };

    focusFrame();

    back.addEventListener('click', () => {
        try { 
            history.pushState({ page: 'browse' }, '', `?page=browse`); 
        } catch { }
        
        onBack?.();
    });

    fsBtn.addEventListener('click', async () => {
        const elem = frame as any as HTMLElement;
        const doc: any = document;

        try {
            if (!document.fullscreenElement) {
                await elem.requestFullscreen?.();
                focusFrame();
            } else {
                await doc.exitFullscreen?.();
            }
        } catch { }
    });

    const setInstalled = async (flag: boolean) => {
        installBtn.textContent = flag ? 'Uninstall' : 'Install';
        frame.src = flag ? `/fs/core/${id}/index.html` : `/core/${id}/index.html`;
    };

    installBtn.addEventListener('click', async () => {
        if (installBtn.disabled) return;

        const currentlyInstalled = await isInstalled(id);
        if (currentlyInstalled) {
            installBtn.disabled = true;

            try {
                await window.$fs.rm(`/core/${id}`);
                await setInstalled(false);
            } finally {
                installBtn.disabled = false;
            }
            return;
        }

        installBtn.disabled = true;
        installBtn.textContent = 'Installing...';
        progress.hidden = false;
        bar.classList.remove('ok');
        bar.style.width = '0%';
        bar.classList.add('indeterminate');

        try {
            let sawBytes = false;
            await window.$dl(id, ({ loaded, total, filesDone, filesTotal }) => {
                if (total && total > 0) {
                    if (!sawBytes) {
                        bar.classList.remove('indeterminate');
                        sawBytes = true;
                    }

                    const perFile = Math.min(loaded / total, 1);
                    const overall = (filesDone + perFile) / Math.max(filesTotal, 1);

                    bar.style.width = `${Math.floor(overall * 100)}%`;
                }
            });

            bar.classList.remove('indeterminate');
            bar.style.width = '100%';
            bar.classList.add('ok');

            await new Promise(r => setTimeout(r, 450));
            progress.hidden = true;
            await setInstalled(true);
            installBtn.textContent = 'Uninstall';
            focusFrame();
        } catch (e) {
            installBtn.textContent = 'Install';
        } finally {
            installBtn.disabled = false;
        }
    });

    frame.addEventListener('load', () => focusFrame());
    frameWrap.addEventListener('click', () => focusFrame());
    frameWrap.addEventListener('pointerdown', () => focusFrame(), { passive: true });
    frameWrap.addEventListener('mouseenter', () => focusFrame());
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement === frame) focusFrame();
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) focusFrame();
    });
}
