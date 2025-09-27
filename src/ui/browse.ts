export type GameMeta = {
    title: string;
    id: string;
    image?: string;
};

type BrowseState = {
    games: GameMeta[];
    filtered: GameMeta[];
    query: string;
};

async function loadMetadata(): Promise<GameMeta[]> {
    try {
        const res = await fetch('/metadata.json');
        if (!res.ok) throw new Error('Failed to load metadata.json');

        const data = await res.json();
        return Array.isArray(data.games) ? data.games : [];
    } catch (err) {
        console.error('[browse] metadata error', err);
        return [];
    }
}

function gameCard(g: GameMeta) {
    const thumb = g.image ? `<img src="${g.image}" alt="${g.title} cover"/>` :
        `<span style="color:var(--ctp-subtext0);">No image</span>`;

    return `
    <article class="card" data-id="${g.id}" data-title="${g.title.toLowerCase()}" tabindex="0" aria-label="${g.title}">
      <div class="thumb">${thumb}</div>
      <div class="meta"><div class="title">${g.title}</div></div>
    </article>
  `;
}

function suggestionsHTML(items: GameMeta[]) {
    if (!items.length) return '';

    return `
    <div class="suggest" role="listbox">
      ${items.slice(0, 6).map(g => `
        <div class="suggest-item" data-id="${g.id}" role="option">
          ${g.image ? `<img src="${g.image}" alt=""/>` : ''}
          <span>${g.title}</span>
        </div>`).join('')}
    </div>
  `;
}

import { render as renderPlayer } from './player';

export async function render(root: HTMLElement) {
    const games = (await loadMetadata()).slice().sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
    );

    const state: BrowseState = { games, filtered: [], query: '' };
    state.filtered = state.games;

    root.innerHTML = `
    <section class="browse">
      <div class="sparkle" aria-hidden="true"></div>
      <div class="top">
        <div class="search">
          <input id="search" type="search" placeholder="Search games..." autocomplete="off" aria-label="Search games" />
        </div>
      </div>

      <div class="grid" id="grid" aria-live="polite"></div>
      <div class="site-footer">© Scaratek 2025 · <a href="https://github.com/scaratech/ama2" target="_blank" rel="noreferrer noopener">Repo</a></div>
    </section>
  `;

    const grid = root.querySelector('#grid') as HTMLElement;
    const search = root.querySelector('#search') as HTMLInputElement;
    const searchBox = search.parentElement as HTMLElement;

    const onSelectGame = (id: string) => {
        try {
            history.pushState({ game: id }, '', `?id=${encodeURIComponent(id)}`);
        } catch { }

        const mount = root.closest('#app') as HTMLElement || root;
        mount.classList.remove('view-enter');
        mount.classList.add('view-exit');

        const done = () => {
            mount.classList.remove('view-exit');

            renderPlayer(mount, id, () => {
                try { 
                    history.pushState({ page: 'browse' }, '', `?page=browse`); 
                } catch { }

                mount.classList.remove('view-enter');
                mount.classList.add('view-exit');

                const backDone = () => {
                    mount.classList.remove('view-exit');
                    render(mount);

                    requestAnimationFrame(() => mount.classList.add('view-enter'));
                    mount.removeEventListener('animationend', backDone);
                };

                mount.addEventListener('animationend', backDone, { once: true });
            });

            requestAnimationFrame(() => mount.classList.add('view-enter'));
            mount.removeEventListener('animationend', done);
        };

        mount.addEventListener('animationend', done, { once: true });
    };

    const updateSuggestions = (termRaw: string) => {
        const term = termRaw.trim().toLowerCase();
        const sugg = state.games.filter(g => g.title.toLowerCase().includes(term)).slice(0, 6);
        const existing = searchBox.querySelector('.suggest');

        if (existing) existing.remove();

        if (term && sugg.length) {
            searchBox.insertAdjacentHTML('beforeend', suggestionsHTML(sugg));
            attachSuggestionHandlers();
        }
    };

    const applyFilter = (q: string) => {
        const term = q.trim().toLowerCase();
        state.query = term;

        const cards = Array.from(grid.querySelectorAll<HTMLElement>('.card'));

        cards.forEach((card) => {
            const title = card.dataset.title || '';
            const id = card.dataset.id || '';
            const match = !term || title.includes(term) || id.includes(term);

            card.classList.toggle('hidden', !match);
            if (match) card.classList.add('show');
        });

        updateSuggestions(term);
    };

    function attachCardHandlers() {
        grid.querySelectorAll('.card').forEach(el => {
            el.addEventListener('click', () => {
                const id = (el as HTMLElement).dataset.id!;
                onSelectGame(id);
            });

            el.addEventListener('keydown', (ev: KeyboardEvent) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    (ev.currentTarget as HTMLElement).click();
                    ev.preventDefault();
                }
            })
        });
    }

    function attachSuggestionHandlers() {
        root.querySelectorAll('.suggest-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = (el as HTMLElement).dataset.id!;
                const picked = state.games.find(g => g.id === id);

                if (picked) {
                    search.value = picked.title;
                    applyFilter(picked.title);
                    onSelectGame(id);
                }

                const exist = searchBox.querySelector('.suggest');
                exist?.remove();
            })
        });
    }

    grid.innerHTML = state.games.map(gameCard).join('');
    attachCardHandlers();

    Array.from(grid.querySelectorAll<HTMLElement>('.card')).forEach((el, i) => {
        requestAnimationFrame(() => setTimeout(() => el.classList.add('show'), i * 20));
    });


    search.addEventListener('input', (e) => applyFilter((e.target as HTMLInputElement).value));
    search.addEventListener('focus', () => updateSuggestions(search.value));

    document.addEventListener('click', (ev) => {
        if (!searchBox.contains(ev.target as Node)) {
            searchBox.querySelector('.suggest')?.remove();
        }
    });
}
