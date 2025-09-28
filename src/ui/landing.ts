export function render(root: HTMLElement, onStart?: () => void) {
    root.innerHTML = `
  <a id="updater" href="#" aria-label="Check for updates" style="position:fixed;bottom:12px;right:12px;z-index:1000">Check for updates</a>
    <main class="landing" role="main">
      <div class="sparkle" aria-hidden="true"></div>
      <div class="container">
        <h1 class="title">Vapor</h1>
        <p class="tagline">The unblocked games website for the rest of us</p>
        <div class="cta">
          <button class="btn" id="get-started">Get Started</button>
        </div>
      </div>
    </main>
  <div class="site-footer">© Scaratek 2025 · <a href="https://github.com/scaratech/ama2" target="_blank" rel="noreferrer noopener">Repo</a></div>
  `;

    const gsBtn = root.querySelector('#get-started') as HTMLButtonElement | null;
    const uBtn = root.querySelector('#updater') as HTMLButtonElement | null;

    uBtn?.addEventListener('click', async () => {
        try {
            if (window.$fs) {
                if (await window.$fs.exists('/app')) await window.$fs.rm('/app');
                if (await window.$fs.exists('/images')) await window.$fs.rm('/images');

                navigator.serviceWorker.getRegistrations().then(regs => {
                    for (const reg of regs) {
                        reg.unregister();
                    }
                });

                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        }
    });

    gsBtn?.addEventListener('click', () => {
        if (onStart) onStart();
    });
}
