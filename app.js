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

  async boot() {

    console.log('Booting NotSteam OS');

    await this.loadConsole(
      CONSOLES[0]
    );
  }

  async loadConsole(consoleData) {

    try {

      const games =
        await github.fetchGames(consoleData);

      state.set('games', games);

      console.log(games);

    } catch (error) {

      console.error(error);
    }
  }

  async launchGame(game, consoleData) {

    const gameUrl =
      `https://raw.githubusercontent.com/kevinraphael95/notsteam/main/${consoleData.folder}/${encodeURIComponent(game.file)}`;

    await emulator.launch({
      core: consoleData.core,
      gameUrl,
      mount: '#display'
    });
  }

  quitGame() {

    emulator.destroy();
  }
}

const app = new App();

app.boot();
