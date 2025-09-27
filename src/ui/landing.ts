export function render(root: HTMLElement, onStart?: () => void) {
    root.innerHTML = `
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

    const btn = root.querySelector('#get-started') as HTMLButtonElement | null;
    btn?.addEventListener('click', () => {
        if (onStart) onStart();
    });
}
