import { State }           from './core/state.js';
import { Emitter }         from './core/emitter.js';
import { CONSOLES }        from './core/constants.js';
import { GithubService }   from './services/github.service.js';
import { EmulatorService } from './services/emulator.service.js';
import { GamepadManager }  from './managers/gamepad.manager.js';

const state    = new State();
const emitter  = new Emitter();
const github   = new GithubService();
const emulator = new EmulatorService();
const gamepad  = new GamepadManager();

class App {
  constructor() {
    this.selectedGame   = null;
    this.currentConsole = null;
    this.allGames       = [];
    this.filteredGames  = [];
    this.focusedIdx     = -1;
    this.consoleIdx     = 0;
    this.launching      = false;
    this.gpLast         = 0;
  }

  async boot() {
    this.renderSidebar();
    this.bindSearch();
    this.bindKeyboard();
    this.bindQuit();
    this.startGamepad();
    await this.loadConsole(CONSOLES[0]);
  }

  /* ── SIDEBAR ── */
  renderSidebar() {
    const list = document.getElementById('console-list');
    list.innerHTML = CONSOLES.map((c, i) => `
      <div class="console-item ${i === 0 ? 'active' : ''}" data-id="${c.id}" style="--ci-color:${c.color}">
        <div class="ci-icon" style="background:${c.color}1c;color:${c.color}">${c.icon}</div>
        <div class="ci-name-wrap">
          <div class="console-name">${c.name}</div>
          <div class="console-count" id="count-${c.id}">—</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.console-item').forEach((el, i) => {
      el.addEventListener('click', () => {
        this.consoleIdx = i;
        const c = CONSOLES.find(c => c.id === el.dataset.id);
        if (c) this.loadConsole(c);
        /* ferme sidebar mobile */
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('open');
      });
    });
  }

  updateSidebarActive() {
    document.querySelectorAll('.console-item').forEach((el, i) =>
      el.classList.toggle('active', i === this.consoleIdx)
    );
  }

  /* ── LOAD CONSOLE ── */
  async loadConsole(consoleData) {
    this.currentConsole = consoleData;
    this.selectedGame   = null;
    this.focusedIdx     = -1;
    this.allGames       = [];
    this.filteredGames  = [];

    this.updateSidebarActive();
    document.documentElement.style.setProperty('--acc', consoleData.color);

    document.getElementById('tb-title').textContent  = consoleData.name;
    document.getElementById('tb-count').textContent  = '';
    document.getElementById('hero-title').textContent = 'Scan en cours…';
    document.getElementById('hero-badge').textContent = consoleData.name.toUpperCase();
    document.getElementById('hero-badge').style.color  = consoleData.color;
    document.getElementById('hero-badge').style.background = consoleData.color + '20';
    document.getElementById('hero-badge').style.borderColor = consoleData.color + '40';
    document.getElementById('hero-meta').style.display = 'none';
    document.getElementById('btn-launch').classList.remove('show');
    document.getElementById('search').value = '';

    const list = document.getElementById('game-list');
    list.innerHTML = `<div class="state-loading"><div class="spinner"></div><span>Chargement…</span></div>`;

    this.setLoadbar(true);

    try {
      const games = await github.fetchGames(consoleData);
      this.allGames      = games;
      this.filteredGames = [...games];
      state.set('games', games);

      const countEl = document.getElementById(`count-${consoleData.id}`);
      if (countEl) countEl.textContent = `${games.length} ROM${games.length !== 1 ? 's' : ''}`;
      document.getElementById('tb-count').textContent = `${games.length} jeu${games.length !== 1 ? 'x' : ''}`;
    } catch (err) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-icon">⚠</div>
        <div class="empty-title">Erreur de chargement</div>
        <div class="empty-sub">Vérifie ta connexion</div>
      </div>`;
      console.error(err);
      this.setLoadbar(false);
      return;
    }

    this.setLoadbar(false);
    this.renderGames();
    if (this.filteredGames.length > 0) this.focusGame(0, false);
    else document.getElementById('hero-title').textContent = 'Aucun jeu';
  }

  /* ── RENDER GAMES ── */
  renderGames() {
    const c    = this.currentConsole;
    const list = document.getElementById('game-list');
    const count = this.filteredGames.length;

    document.getElementById('tb-count').textContent = `${count} jeu${count !== 1 ? 'x' : ''}`;

    if (!count) {
      list.innerHTML = `<div class="empty-state">
        <div class="empty-icon">${this.allGames.length ? '🔍' : '📦'}</div>
        <div class="empty-title">${this.allGames.length ? 'Aucun résultat' : 'Dossier vide'}</div>
        <div class="empty-sub">${this.allGames.length ? 'Modifie ta recherche' : '/' + c.folder + '/ est vide'}</div>
      </div>`;
      return;
    }

    list.innerHTML = this.filteredGames.map((g, i) => `
      <div class="game-row ${i === this.focusedIdx ? 'focused' : ''}" id="gr-${i}"
           style="--gr-color:${c.color}" data-index="${i}">
        <span class="gr-num">${String(i + 1).padStart(2, '0')}</span>
        <div class="gr-thumb" style="background:${c.color}1a;color:${c.color}">${c.icon}</div>
        <div class="gr-info">
          <div class="gr-name">${this.escapeHtml(g.title)}</div>
          <div class="gr-sub">${c.short} · ${this.escapeHtml(g.file)}</div>
        </div>
        <div class="gr-size">${this.formatSize(g.size)}</div>
        <span class="gr-arrow">›</span>
      </div>
    `).join('');

    list.querySelectorAll('.game-row').forEach(el => {
      el.addEventListener('click',       () => this.launchGame(+el.dataset.index));
      el.addEventListener('mouseenter',  () => this.focusGame(+el.dataset.index, false));
    });
  }

  /* ── FOCUS ── */
  focusGame(i, scroll = true) {
    this.focusedIdx = i;
    const g = this.filteredGames[i];
    if (!g) return;
    const c = this.currentConsole;

    document.getElementById('hero-title').textContent  = g.title;
    document.getElementById('hero-badge').textContent  = c.name.toUpperCase();
    document.getElementById('hero-badge').style.color  = c.color;
    document.getElementById('hero-bg').style.background =
      `radial-gradient(ellipse at 75% 50%, ${c.color}22 0%, ${c.color}05 50%, transparent 70%)`;
    document.getElementById('hero-meta').style.display = 'flex';
    document.getElementById('hero-size').textContent   = this.formatSize(g.size);
    document.getElementById('hero-file').textContent   = g.file;
    document.getElementById('btn-launch').classList.add('show');
    document.getElementById('btn-launch').onclick = () => this.launchGame(i);

    document.querySelectorAll('.game-row').forEach((el, idx) =>
      el.classList.toggle('focused', idx === i)
    );

    if (scroll) {
      const row = document.getElementById(`gr-${i}`);
      if (row) row.scrollIntoView({ block: 'nearest' });
    }
  }

  /* ── LAUNCH ── */
  async launchGame(i) {
    if (this.launching) return;
    const g = this.filteredGames[i ?? this.focusedIdx];
    const c = this.currentConsole;
    if (!g || !c) return;

    this.launching = true;

    const gameUrl =
      `https://raw.githubusercontent.com/kevinraphael95/notsteam/main/` +
      `${c.folder}/${encodeURIComponent(g.file)}`;

    /* Mise à jour overlay */
    const overlay = document.getElementById('emulator-overlay');
    const badge   = document.getElementById('emu-badge-bar');
    document.getElementById('emu-title').textContent = g.title;
    badge.textContent = c.short;
    badge.style.background  = c.color + '28';
    badge.style.color       = c.color;
    badge.style.border      = `1px solid ${c.color}55`;
    overlay.classList.remove('hidden');

    await emulator.launch({ core: c.core, gameUrl });
  }

  /* ── QUIT ── */
  bindQuit() {
    document.getElementById('quit-btn').addEventListener('click', () => {
      emulator.destroy();
      document.getElementById('emulator-overlay').classList.add('hidden');
      this.launching = false;
    });
  }

  /* ── SEARCH ── */
  bindSearch() {
    document.getElementById('search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      this.filteredGames = q
        ? this.allGames.filter(g =>
            g.title.toLowerCase().includes(q) || g.file.toLowerCase().includes(q))
        : [...this.allGames];
      this.focusedIdx = -1;
      this.renderGames();
      if (this.filteredGames.length > 0) this.focusGame(0, false);
    });
  }

  /* ── KEYBOARD ── */
  bindKeyboard() {
    document.addEventListener('keydown', e => {
      if (!document.getElementById('emulator-overlay').classList.contains('hidden')) return;
      const search = document.getElementById('search');
      if (document.activeElement === search) {
        if (e.key === 'Escape') { search.blur(); search.value = ''; search.dispatchEvent(new Event('input')); }
        return;
      }
      const map = {
        ArrowUp:    () => { if (this.focusedIdx > 0) this.focusGame(this.focusedIdx - 1); },
        ArrowDown:  () => { if (this.focusedIdx < this.filteredGames.length - 1) this.focusGame(this.focusedIdx + 1); },
        ArrowLeft:  () => { if (this.consoleIdx > 0) { this.consoleIdx--; this.loadConsole(CONSOLES[this.consoleIdx]); } },
        ArrowRight: () => { if (this.consoleIdx < CONSOLES.length - 1) { this.consoleIdx++; this.loadConsole(CONSOLES[this.consoleIdx]); } },
        Enter:      () => { if (this.focusedIdx >= 0) this.launchGame(this.focusedIdx); },
        '/':        () => search.focus(),
      };
      if (map[e.key]) { if (e.key !== '/') e.preventDefault(); map[e.key](); }
    });
  }

  /* ── GAMEPAD ── */
  startGamepad() {
    setInterval(() => {
      const gp = navigator.getGamepads?.()[0];
      if (!gp || !document.getElementById('emulator-overlay').classList.contains('hidden')) return;
      const now = Date.now();
      if (now - this.gpLast < 160) return;
      const up    = gp.axes[1] < -0.5 || gp.buttons[12]?.pressed;
      const down  = gp.axes[1] >  0.5 || gp.buttons[13]?.pressed;
      const left  = gp.axes[0] < -0.5 || gp.buttons[14]?.pressed;
      const right = gp.axes[0] >  0.5 || gp.buttons[15]?.pressed;
      const lb    = gp.buttons[4]?.pressed;
      const rb    = gp.buttons[5]?.pressed;
      const a     = gp.buttons[0]?.pressed;
      if (up    && this.focusedIdx > 0)                       { this.focusGame(this.focusedIdx - 1); this.gpLast = now; }
      if (down  && this.focusedIdx < this.filteredGames.length - 1) { this.focusGame(this.focusedIdx + 1); this.gpLast = now; }
      if ((lb || left)  && this.consoleIdx > 0)               { this.consoleIdx--; this.loadConsole(CONSOLES[this.consoleIdx]); this.gpLast = now; }
      if ((rb || right) && this.consoleIdx < CONSOLES.length - 1) { this.consoleIdx++; this.loadConsole(CONSOLES[this.consoleIdx]); this.gpLast = now; }
      if (a && this.focusedIdx >= 0)                          { this.launchGame(this.focusedIdx); this.gpLast = now; }
    }, 16);
  }

  /* ── LOADBAR ── */
  setLoadbar(on) {
    const bar = document.getElementById('loadbar');
    if (!bar) return;
    clearInterval(this._lt);
    if (on) {
      let w = 0; bar.style.transition = 'width .2s ease'; bar.style.width = '0%';
      this._lt = setInterval(() => { w = Math.min(w + Math.random() * 14, 90); bar.style.width = w + '%'; }, 100);
    } else {
      bar.style.transition = 'width .3s ease'; bar.style.width = '100%';
      setTimeout(() => { bar.style.transition = 'none'; bar.style.width = '0%'; }, 350);
    }
  }

  /* ── UTILS ── */
  formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024)    return `${bytes} B`;
    if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}

const app = new App();
app.boot();
