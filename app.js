import { State } from './core/state.js';
import { Emitter } from './core/emitter.js';
import { CONSOLES } from './core/constants.js';

import { GithubService } from './services/github.service.js';
import { EmulatorService } from './services/emulator.service.js';

import { GamepadManager } from './managers/gamepad.manager.js';

const state = new State();
const emitter = new Emitter();

const github = new GithubService();
const emulator = new EmulatorService();
const gamepad = new GamepadManager();

class App {

  constructor() {
    this.selectedGame = null;
    this.currentConsole = null;
    this.allGames = [];
  }

  async boot() {
    this.renderSidebar();
    await this.loadConsole(CONSOLES[0]);
  }

  renderSidebar() {
    const list = document.getElementById('console-list');
    list.innerHTML = CONSOLES.map((c, i) => `
      <div class="console-item ${i === 0 ? 'active' : ''}" data-id="${c.id}">
        <div class="console-icon">${c.icon}</div>
        <div class="console-info">
          <div class="console-name">${c.name}</div>
          <div class="console-count" id="count-${c.id}">—</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.console-item').forEach(el => {
      el.addEventListener('click', () => {
        const consoleData = CONSOLES.find(c => c.id === el.dataset.id);
        if (consoleData) this.loadConsole(consoleData);
      });
    });
  }

  async loadConsole(consoleData) {
    this.currentConsole = consoleData;
    this.selectedGame = null;

    // Sidebar active
    document.querySelectorAll('.console-item').forEach(el => {
      el.classList.toggle('active', el.dataset.id === consoleData.id);
    });

    // Toolbar label
    document.getElementById('games-console-label').textContent = consoleData.name;
    document.getElementById('games-count').textContent = '';

    // Hide hero
    document.getElementById('hero').classList.remove('visible');
    document.getElementById('status-launch').style.display = 'none';

    // Loading
    const list = document.getElementById('games-list');
    list.innerHTML = `<div id="loading"><div class="spinner"></div> Chargement...</div>`;

    try {
      const games = await github.fetchGames(consoleData);
      this.allGames = games;
      state.set('games', games);

      document.getElementById(`count-${consoleData.id}`).textContent = `${games.length} ROMs`;
      document.getElementById('games-count').textContent = `  ·  ${games.length} jeux`;

      this.renderGames(games, consoleData);
    } catch (error) {
      list.innerHTML = `<div id="loading">Erreur de chargement</div>`;
      console.error(error);
    }
  }

  renderGames(games, consoleData) {
    const list = document.getElementById('games-list');

    if (!games.length) {
      list.innerHTML = `<div id="loading">Aucun jeu trouvé</div>`;
      return;
    }

    list.innerHTML = games.map((game, i) => `
      <div class="game-row" data-index="${i}">
        <div class="game-row-icon">▼</div>
        <div class="game-row-info">
          <div class="game-row-title">${game.title}</div>
          <div class="game-row-sub">${consoleData.name} · ${game.file}</div>
        </div>
        <div class="game-row-size">${this.formatSize(game.size)}</div>
      </div>
    `).join('');

    list.querySelectorAll('.game-row').forEach(el => {
      el.addEventListener('click', () => {
        const game = games[parseInt(el.dataset.index)];
        this.selectGame(game, el);
      });
    });
  }

  selectGame(game, el) {
    this.selectedGame = game;

    document.querySelectorAll('.game-row').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');

    // Hero
    const hero = document.getElementById('hero');
    hero.classList.add('visible');
    document.getElementById('hero-console').textContent = this.currentConsole.name;
    document.getElementById('hero-title').textContent = game.title;
    document.getElementById('hero-meta').textContent =
      `${this.formatSize(game.size)}  ·  ${game.file}`;

    document.getElementById('status-launch').style.display = 'flex';

    document.getElementById('btn-launch').onclick = () => this.launchGame(game, this.currentConsole);
  }

  async launchGame(game, consoleData) {
    const gameUrl =
      `https://raw.githubusercontent.com/kevinraphael95/notsteam/main/${consoleData.folder}/${encodeURIComponent(game.file)}`;

    document.getElementById('games-area').style.display = 'none';
    document.getElementById('hero').classList.remove('visible');
    const display = document.getElementById('display');
    display.style.display = 'block';

    await emulator.launch({ core: consoleData.core, gameUrl, mount: '#display' });
  }

  quitGame() {
    emulator.destroy();
    document.getElementById('display').style.display = 'none';
    document.getElementById('games-area').style.display = 'flex';
  }

  formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}

// Search
document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.game-row').forEach(row => {
    const title = row.querySelector('.game-row-title').textContent.toLowerCase();
    row.style.display = title.includes(q) ? '' : 'none';
  });
});

const app = new App();
app.boot();
