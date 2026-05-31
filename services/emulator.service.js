import { CONFIG } from '../core/constants.js';

export class EmulatorService {

  constructor() {
    this.active = false;
  }

  async launch({ core, gameUrl }) {
    this.destroy();

    window.EJS_player        = '#ejs-container';
    window.EJS_core          = core;
    window.EJS_gameUrl       = gameUrl;
    window.EJS_pathtodata    = CONFIG.emulatorDataPath;
    window.EJS_startOnLoaded = true;
    window.EJS_emulator      = undefined;
    window.EJS_ready         = () => this.focusCanvas();

    const container = document.createElement('div');
    container.id = 'ejs-container';
    document.body.appendChild(container);

    const script = document.createElement('script');
    script.id  = 'ejs-loader';
    script.src = `${CONFIG.emulatorDataPath}loader.js?t=${Date.now()}`;
    document.body.appendChild(script);

    this.active = true;
  }

  focusCanvas() {
    requestAnimationFrame(() => {
      const canvas = document.querySelector('#ejs-container canvas');
      if (!canvas) return;
      canvas.focus();
      canvas.click();
    });
  }

  destroy() {
    try { if (window.EJS_emulator) window.EJS_emulator.exit(); } catch {}
    document.getElementById('ejs-loader')?.remove();
    document.getElementById('ejs-container')?.remove();
    window.EJS_emulator = undefined;
    this.active = false;
  }
}
