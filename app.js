import { State }        from './core/state.js';
import { Emitter }      from './core/emitter.js';
import { CONSOLES }     from './core/constants.js';
import { GithubService }   from './services/github.service.js';
import { EmulatorService } from './services/emulator.service.js';
import { GamepadManager }  from './managers/gamepad.manager.js';

const state   = new State();
const emitter = new Emitter();
const github  = new GithubService();
const emulator = new EmulatorService();
const gamepad  = new GamepadManager();

class App {

  constructor() {
    this.selectedGame    = null;
    this.currentConsole  = null;
    this.allGames        = [];
  }

  async boot() {
    this.renderSidebar();
    this.bindSearch();
    await this.loadConsole(CONSOLES[0]);
  }

  /* ---- SIDEBAR ---- */
  renderSidebar() {
    const list = document.getElementById('console-list');
    list.innerHTML = CONSOLES.map((c, i) => `
      <div class="console-item ${i === 0 ? 'active' : ''}" data-id="${c.id}">
        <div class="console-icon">${c.icon}</div>
        <div>
          <div class="console-name">${c.name}</div>
          <div class="console-count" id="count-${c.id}">—</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.console-item').forEach(el => {
      el.addEventListener('click', () => {
        const c = CONSOLES.find(c => c.id === el.dataset.id);
        if (c) this.loadConsole(c);
      });
    });
  }

  /* ---- LOAD CONSOLE ---- */
  async loadConsole(consoleData) {
    this.currentConsole = consoleData;
    this.selectedGame   = null;

    document.querySelectorAll('.console-item').forEach(el =>
      el.classList.toggle('active', el.dataset.id === consoleData.id)
    );

    document.getElementById('games-console-label').textContent = consoleData.name;
    document.getElementById('games-count').textContent = '';
    document.getElementById('hero').classList.remove('visible');
    document.getElementById('status-launch').style.display = 'none';
    document.getElementById('search').value = '';

    const list = document.getElementById('games-list');
    list.innerHTML = `<div class="state-message"><div class="spinner"></div><span>Chargement…</span></div>`;

    try {
      const games = await github.fetchGames(consoleData);
      this.allGames = games;
      state.set('games', games);

      const countEl = document.getElementById(`count-${consoleData.id}`);
      if (countEl) countEl.textContent = `${games.length} ROMs`;
      document.getElementById('games-count').textContent = `${games.length} jeux`;

      this.renderGames(games, consoleData);
    } catch (err) {
      list.innerHTML = `<div class="state-message">⚠ Erreur de chargement</div>`;
      console.error(err);
    }
  }

  /* ---- RENDER GAMES ---- */
  renderGames(games, consoleData) {
    const list = document.getElementById('games-list');

    if (!games.length) {
      list.innerHTML = `<div class="state-message">Aucun jeu trouvé</div>`;
      return;
    }

    list.innerHTML = games.map((game, i) => `
      <div class="game-row" data-index="${i}">
        <div class="game-row-icon">▼</div>
        <div class="game-row-info">
          <div class="game-row-title">${this.escapeHtml(game.title)}</div>
          <div class="game-row-sub">${consoleData.name} · ${this.escapeHtml(game.file)}</div>
        </div>
        <div class="game-row-size">${this.formatSize(game.size)}</div>
      </div>
    `).join('');

    list.querySelectorAll('.game-row').forEach(el => {
      el.addEventListener('click', () => {
        this.selectGame(games[+el.dataset.index], el);
      });
    });
  }

  /* ---- SELECT GAME ---- */
  selectGame(game, el) {
    this.selectedGame = game;

    document.querySelectorAll('.game-row').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');

    const hero = document.getElementById('hero');
    hero.classList.add('visible');
    document.getElementById('hero-console').textContent = this.currentConsole.name;
    document.getElementById('hero-title').textContent   = game.title;
    document.getElementById('hero-meta').innerHTML =
      `<span>📦 ${this.formatSize(game.size)}</span><span>🗂 ${this.escapeHtml(game.file)}</span>`;

    document.getElementById('status-launch').style.display = 'flex';
    document.getElementById('btn-launch').onclick = () => this.launchGame(game, this.currentConsole);
  }

  /* ---- LAUNCH GAME ---- */
  async launchGame(game, consoleData) {
    const gameUrl =
      `https://raw.githubusercontent.com/kevinraphael95/notsteam/main/` +
      `${consoleData.folder}/${encodeURIComponent(game.file)}`;

    const display = document.getElementById('display');
    display.innerHTML = `<button id="btn-quit">✕ QUITTER</button>`;
    display.style.display = 'block';
    document.getElementById('btn-quit').onclick = () => this.quitGame();

    await emulator.launch({ core: consoleData.core, gameUrl, mount: '#display' });
  }

  /* ---- QUIT GAME ---- */
  quitGame() {
    emulator.destroy();
    const display = document.getElementById('display');
    display.style.display = 'none';
    display.innerHTML = '';
  }

  /* ---- SEARCH ---- */
  bindSearch() {
    document.getElementById('search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.game-row').forEach(row => {
        const title = row.querySelector('.game-row-title').textContent.toLowerCase();
        row.style.display = title.includes(q) ? '' : 'none';
      });
    });
  }

  /* ---- UTILS ---- */
  formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1048576)     return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}

const app = new App();
app.boot();
