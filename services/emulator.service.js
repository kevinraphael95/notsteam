import { CONFIG } from '../core/constants.js';

export class EmulatorService {
  constructor() {
    this._frame = null;
  }

  async launch({ core, gameUrl }) {
    this.destroy();

    const display = document.getElementById('display');
    if (!display) return;

    /* On crée un iframe sandboxé — EmulatorJS tourne dans son propre contexte.
       Quitter = supprimer l'iframe → tous les workers/AudioContext meurent avec. */
    const frame = document.createElement('iframe');
    frame.id = 'ejs-frame';
    frame.allow = 'autoplay; fullscreen; gamepad';
    frame.setAttribute('allowfullscreen', '');
    frame.style.cssText = 'width:100%;height:100%;border:none;display:block;background:#000';

    /* Page HTML injectée dans l'iframe via srcdoc */
    const pathtodata = CONFIG.emulatorDataPath;
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#000;width:100vw;height:100vh;overflow:hidden}
  #game{width:100%;height:100%}
</style>
</head>
<body>
<div id="game"></div>
<script>
  window.EJS_player        = '#game';
  window.EJS_core          = ${JSON.stringify(core)};
  window.EJS_gameUrl       = ${JSON.stringify(gameUrl)};
  window.EJS_pathtodata    = ${JSON.stringify(pathtodata)};
  window.EJS_startOnLoaded = true;
  window.EJS_gamepadEnabled = true;
<\/script>
<script src="${pathtodata}loader.js"><\/script>
</body>
</html>`;

    frame.srcdoc = html;
    display.appendChild(frame);
    this._frame = frame;
  }

  destroy() {
    if (this._frame) {
      /* Vider le srcdoc coupe l'AudioContext et les workers immédiatement */
      try { this._frame.srcdoc = ''; } catch {}
      try { this._frame.src = 'about:blank'; } catch {}
      this._frame.remove();
      this._frame = null;
    }

    /* Nettoyage défensif au cas où quelque chose aurait fuitté dans le parent */
    document.querySelectorAll('#ejs-frame,#ejs-loader,#ejs-container,[id^="emulatorjs"]')
      .forEach(el => el.remove());

    ['EJS_player','EJS_core','EJS_gameUrl','EJS_pathtodata',
     'EJS_startOnLoaded','EJS_gamepadEnabled','EJS_emulator']
      .forEach(k => { try { delete window[k]; } catch {} });
  }
}
