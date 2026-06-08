import { State }           from './core/state.js';
import { Emitter }         from './core/emitter.js';
import { CONSOLES }        from './core/constants.js';
import { GithubService }   from './services/github.service.js';
import { EmulatorService } from './services/emulator.service.js';
import { GamepadManager }  from './managers/gamepad.manager.js';

const state    = new State();
const github   = new GithubService();
const emulator = new EmulatorService();

class App {
  constructor() {
    this.currentConsole = null;
    this.allGames       = [];
    this.filteredGames  = [];
    this.focusedIdx     = 0;
    this.consoleIdx     = 0;
    this.launching      = false;
    this.screen         = 'consoles';
    this.gpLast         = 0;
    this.gpConnected    = false;
  }

  async boot() {
    this.renderConsoles();
    this.bindKeyboard();
    this.bindQuit();
    this.startGamepad();
    this.updateStatusBar();
  }

  /* ── STATUS BAR hints selon écran ── */
  updateStatusBar() {
    const isGames = this.screen === 'games';
    document.getElementById('hint-nav').innerHTML     = isGames ? '<kbd>↑↓</kbd> Naviguer' : '<kbd>↑↓←→</kbd> Naviguer';
    document.getElementById('hint-console').style.display = isGames ? 'none' : '';
    document.getElementById('hint-launch').innerHTML  = isGames ? '<kbd>↵</kbd> Lancer' : '<kbd>↵</kbd> Ouvrir';
    document.getElementById('hint-console').innerHTML = '<kbd>←→</kbd> Console';
  }

  /* ── CONSOLES ── */
  renderConsoles() {
    const grid = document.getElementById('console-grid');
    grid.innerHTML = CONSOLES.map((c, i) => `
      <div class="console-card ${i === 0 ? 'active' : ''}" data-id="${c.id}" data-idx="${i}">
        ${c.thumb
          ? `<img class="card-img" src="https://raw.githubusercontent.com/kevinraphael95/notsteam/main/${c.thumb}" alt="${c.name}" onerror="this.style.display='none'">`
          : `<div class="card-icon">${c.icon}</div>`
        }
        <div class="card-name">${c.name}</div>
        <div class="card-count" id="card-count-${c.id}">—</div>
      </div>
    `).join('');

    grid.querySelectorAll('.console-card').forEach((el, i) => {
      el.addEventListener('click', () => {
        this.consoleIdx = i;
        this.updateConsoleActive();
        this.openConsole(CONSOLES[i]);
      });
      el.addEventListener('mouseenter', () => {
        this.consoleIdx = i;
        this.updateConsoleActive();
      });
    });

    CONSOLES.forEach(c => this.loadCount(c));
  }

  async loadCount(c) {
    try {
      const games = await github.fetchGames(c);
      const el = document.getElementById(`card-count-${c.id}`);
      if (el) el.textContent = `${games.length} ROMs`;
    } catch {}
  }

  updateConsoleActive() {
    document.querySelectorAll('.console-card').forEach((el, i) => {
      el.classList.toggle('active', i === this.consoleIdx);
    });
    // scroll visible
    const active = document.querySelector('.console-card.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  /* ── OPEN CONSOLE ── */
  async openConsole(c) {
    this.currentConsole = c;
    this.allGames       = [];
    this.filteredGames  = [];
    this.focusedIdx     = 0;

    document.getElementById('screen-consoles').classList.add('hidden');
    document.getElementById('screen-games').classList.remove('hidden');
    document.getElementById('games-title').textContent = c.name;
    document.getElementById('games-count').textContent = '';
    document.getElementById('search').value = '';
    this.screen = 'games';
    this.updateStatusBar();

    const list = document.getElementById('game-list');
    list.innerHTML = `<div class="state-msg"><div class="spinner"></div><span>Chargement…</span></div>`;

    try {
      const games = await github.fetchGames(c);
      this.allGames      = games;
      this.filteredGames = [...games];
      state.set('games', games);
      document.getElementById('games-count').textContent = `${games.length} jeux`;
      const cc = document.getElementById(`card-count-${c.id}`);
      if (cc) cc.textContent = `${games.length} ROMs`;
      this.renderGames();
    } catch (err) {
      list.innerHTML = `<div class="state-msg">⚠ Erreur de chargement</div>`;
      console.error(err);
    }
  }

  goBack() {
    document.getElementById('screen-games').classList.add('hidden');
    document.getElementById('screen-consoles').classList.remove('hidden');
    this.screen = 'consoles';
    this.updateStatusBar();
  }

  /* ── RENDER GAMES ── */
  renderGames() {
    const c    = this.currentConsole;
    const list = document.getElementById('game-list');
    document.getElementById('games-count').textContent = `${this.filteredGames.length} jeux`;

    if (!this.filteredGames.length) {
      list.innerHTML = `<div class="state-msg">Aucun jeu trouvé</div>`;
      return;
    }

    list.innerHTML = this.filteredGames.map((g, i) => `
      <div class="game-row ${i === this.focusedIdx ? 'focused' : ''}" id="gr-${i}" data-index="${i}">
        <div class="gr-icon" style="background:${c.color}18;color:${c.color}">${c.icon}</div>
        <div class="gr-name">${this.escapeHtml(g.title)}</div>
        <div class="gr-size">${this.formatSize(g.size)}</div>
        <span class="gr-arrow">›</span>
      </div>
    `).join('');

    list.querySelectorAll('.game-row').forEach(el => {
      el.addEventListener('click',      () => this.launchGame(+el.dataset.index));
      el.addEventListener('mouseenter', () => { this.focusedIdx = +el.dataset.index; this.updateGameFocus(); });
    });

    document.getElementById('btn-back').onclick = () => this.goBack();
    document.getElementById('search').oninput = e => {
      const q = e.target.value.toLowerCase().trim();
      this.filteredGames = q
        ? this.allGames.filter(g => g.title.toLowerCase().includes(q))
        : [...this.allGames];
      this.focusedIdx = 0;
      this.renderGames();
    };
  }

  updateGameFocus() {
    document.querySelectorAll('.game-row').forEach((el, i) =>
      el.classList.toggle('focused', i === this.focusedIdx)
    );
  }

  scrollToFocused() {
    document.getElementById(`gr-${this.focusedIdx}`)?.scrollIntoView({ block: 'nearest' });
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

    document.getElementById('emu-title').textContent = g.title;
    const badge = document.getElementById('emu-badge');
    badge.textContent = c.short || c.name;
    badge.style.cssText = `background:${c.color}28;color:${c.color};border:1px solid ${c.color}55`;
    document.getElementById('emulator-overlay').classList.remove('hidden');
    await emulator.launch({ core: c.core, gameUrl });
  }

  bindQuit() {
    document.getElementById('quit-btn').addEventListener('click', () => {
      emulator.destroy();
      document.getElementById('emulator-overlay').classList.add('hidden');
      this.launching = false;
    });
  }

  /* ── KEYBOARD ── */
  bindKeyboard() {
    document.addEventListener('keydown', e => {
      const emuOpen = !document.getElementById('emulator-overlay').classList.contains('hidden');
      if (emuOpen) { if (e.key === 'Escape') document.getElementById('quit-btn').click(); return; }

      const search = document.getElementById('search');
      if (document.activeElement === search) {
        if (e.key === 'Escape') { search.blur(); search.value = ''; search.dispatchEvent(new Event('input')); }
        return;
      }

      if (this.screen === 'consoles') {
        const cols = this.getGridCols();
        const map = {
          ArrowRight: () => { if (this.consoleIdx < CONSOLES.length - 1) { this.consoleIdx++; this.updateConsoleActive(); } },
          ArrowLeft:  () => { if (this.consoleIdx > 0) { this.consoleIdx--; this.updateConsoleActive(); } },
          ArrowDown:  () => { if (this.consoleIdx + cols < CONSOLES.length) { this.consoleIdx += cols; this.updateConsoleActive(); } },
          ArrowUp:    () => { if (this.consoleIdx - cols >= 0) { this.consoleIdx -= cols; this.updateConsoleActive(); } },
          Enter:      () => this.openConsole(CONSOLES[this.consoleIdx]),
        };
        if (map[e.key]) { e.preventDefault(); map[e.key](); }
      } else {
        const map = {
          ArrowUp:   () => { if (this.focusedIdx > 0) { this.focusedIdx--; this.updateGameFocus(); this.scrollToFocused(); } },
          ArrowDown: () => { if (this.focusedIdx < this.filteredGames.length - 1) { this.focusedIdx++; this.updateGameFocus(); this.scrollToFocused(); } },
          Enter:     () => this.launchGame(this.focusedIdx),
          Escape:    () => this.goBack(),
          '/':       () => { document.getElementById('search').focus(); return; },
        };
        if (map[e.key]) { if (e.key !== '/') e.preventDefault(); map[e.key](); }
      }
    });
  }

  getGridCols() {
    const grid = document.getElementById('console-grid');
    if (!grid) return 3;
    const style = window.getComputedStyle(grid);
    return style.getPropertyValue('grid-template-columns').split(' ').length || 3;
  }

  /* ── GAMEPAD ── */
  startGamepad() {
    window.addEventListener('gamepadconnected', () => {
      this.gpConnected = true;
      document.getElementById('gp-indicator').classList.add('connected');
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gpConnected = false;
      document.getElementById('gp-indicator').classList.remove('connected');
    });

    setInterval(() => {
      const gp = navigator.getGamepads?.()[0];
      if (!gp) return;
      const emuOpen = !document.getElementById('emulator-overlay').classList.contains('hidden');
      if (emuOpen) return;

      const now = Date.now();
      if (now - this.gpLast < 180) return;

      const up    = gp.axes[1] < -0.5 || gp.buttons[12]?.pressed;
      const down  = gp.axes[1] >  0.5 || gp.buttons[13]?.pressed;
      const left  = gp.axes[0] < -0.5 || gp.buttons[14]?.pressed;
      const right = gp.axes[0] >  0.5 || gp.buttons[15]?.pressed;
      const a     = gp.buttons[0]?.pressed;
      const b     = gp.buttons[1]?.pressed;
      const lb    = gp.buttons[4]?.pressed;
      const rb    = gp.buttons[5]?.pressed;

      if (this.screen === 'consoles') {
        const cols = this.getGridCols();
        if (right && this.consoleIdx < CONSOLES.length - 1)           { this.consoleIdx++; this.updateConsoleActive(); this.gpLast = now; }
        else if (left && this.consoleIdx > 0)                          { this.consoleIdx--; this.updateConsoleActive(); this.gpLast = now; }
        else if (down && this.consoleIdx + cols < CONSOLES.length)     { this.consoleIdx += cols; this.updateConsoleActive(); this.gpLast = now; }
        else if (up && this.consoleIdx - cols >= 0)                    { this.consoleIdx -= cols; this.updateConsoleActive(); this.gpLast = now; }
        else if (rb && this.consoleIdx < CONSOLES.length - 1)          { this.consoleIdx++; this.updateConsoleActive(); this.gpLast = now; }
        else if (lb && this.consoleIdx > 0)                            { this.consoleIdx--; this.updateConsoleActive(); this.gpLast = now; }
        else if (a) { this.openConsole(CONSOLES[this.consoleIdx]); this.gpLast = now; }
      } else {
        if (up   && this.focusedIdx > 0)                               { this.focusedIdx--; this.updateGameFocus(); this.scrollToFocused(); this.gpLast = now; }
        if (down && this.focusedIdx < this.filteredGames.length - 1)   { this.focusedIdx++; this.updateGameFocus(); this.scrollToFocused(); this.gpLast = now; }
        if (a)   { this.launchGame(this.focusedIdx); this.gpLast = now; }
        if (b)   { this.goBack(); this.gpLast = now; }
      }
    }, 16);
  }

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
