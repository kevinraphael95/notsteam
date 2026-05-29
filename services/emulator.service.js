import { CONFIG } from '../core/constants.js';

export class EmulatorService {

  constructor() {
    this.active = false;
  }

  async launch({ core, gameUrl, mount }) {
    // Full cleanup avant tout
    this.destroy();

    // Reset toutes les vars EJS
    window.EJS_player        = mount;
    window.EJS_core          = core;
    window.EJS_gameUrl       = gameUrl;
    window.EJS_pathtodata    = CONFIG.emulatorDataPath;
    window.EJS_startOnLoaded = true;
    window.EJS_emulator      = undefined;
    window.EJS_ready         = () => this.focusCanvas();

    const script = document.createElement('script');
    script.id  = 'ejs-loader';
    script.src = `${CONFIG.emulatorDataPath}loader.js?t=${Date.now()}`;
    document.body.appendChild(script);

    this.active = true;
  }

  focusCanvas() {
    requestAnimationFrame(() => {
      const canvas = document.querySelector('#display canvas');
      if (!canvas) return;
      canvas.focus();
      canvas.click();
    });
  }

  destroy() {
    // Stop emulateur
    try { if (window.EJS_emulator) window.EJS_emulator.exit(); } catch {}

    // Retire le script loader
    document.getElementById('ejs-loader')?.remove();

    // Vide #display complètement
    const display = document.getElementById('display');
    if (display) display.innerHTML = '';

    // Nettoie les éventuels iframes/divs injectés par EJS hors #display
    document.querySelectorAll('[id^="emulator"]').forEach(el => el.remove());

    window.EJS_emulator = undefined;
    this.active = false;
  }
}
