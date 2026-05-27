import { CONFIG } from '../core/constants.js';

export class EmulatorService {

  constructor() {

    this.script = null;
    this.active = false;
  }

  async launch({
    core,
    gameUrl,
    mount
  }) {

    this.destroy();

    window.EJS_player = mount;

    window.EJS_core = core;

    window.EJS_gameUrl = gameUrl;

    window.EJS_pathtodata =
      CONFIG.emulatorDataPath;

    window.EJS_startOnLoaded = true;

    window.EJS_ready = () => {

      this.focusCanvas();
    };

    this.script =
      document.createElement('script');

    this.script.src =
      `${CONFIG.emulatorDataPath}loader.js`;

    document.body.appendChild(this.script);

    this.active = true;
  }

  focusCanvas() {

    requestAnimationFrame(() => {

      const canvas =
        document.querySelector('canvas');

      if (!canvas) {
        return;
      }

      canvas.focus();
      canvas.click();
    });
  }

  destroy() {

    try {

      if (window.EJS_emulator) {

        try {
          window.EJS_emulator.exit();
        } catch {}

}
