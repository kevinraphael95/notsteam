let focusIdx = 0;
let isPlaying = false;
const items = document.querySelectorAll('[data-focusable="true"]');

// Horloge temps réel
const tick = () => document.getElementById('clock').innerText = new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
setInterval(tick, 1000); tick();

function updateFocus() {
    items.forEach((el, i) => {
        el.classList.toggle('focused', i === focusIdx);
        if (i === focusIdx) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
}

// Fonction de lancement NotSteam
function launch() {
    const target = items[focusIdx];
    const core = target.dataset.core;
    const path = target.dataset.path; // Chemin vers ton dossier GitHub
    const name = target.dataset.name;

    isPlaying = true;
    document.getElementById('library-screen').classList.add('hidden');
    document.getElementById('player-screen').classList.remove('hidden');
    document.getElementById('target-name').innerText = name;

    // Configuration EmulatorJS
    window.EJS_player = '#emu-box';
    window.EJS_core = core;
    window.EJS_gameUrl = path; // Le dossier correspondant dans ton dépôt
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';

    const s = document.createElement('script');
    s.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    document.head.appendChild(s);
}

// Contrôles
document.addEventListener('keydown', (e) => {
    if (isPlaying) return;
    if (e.key === "ArrowRight" && focusIdx < items.length - 1) focusIdx++;
    if (e.key === "ArrowLeft" && focusIdx > 0) focusIdx--;
    if (e.key === "Enter") launch();
    updateFocus();
});

// Support Manette
window.addEventListener("gamepadconnected", () => {
    setInterval(() => {
        const gp = navigator.getGamepads()[0];
        if (!gp || isPlaying) return;
        if (gp.buttons[15].pressed) { focusIdx++; updateFocus(); } 
        if (gp.buttons[14].pressed) { focusIdx--; updateFocus(); }
        if (gp.buttons[0].pressed) launch();
    }, 150);
});

updateFocus();
