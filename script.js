// 1. LISTE DES ROMS (Ajoute tes noms de fichiers ici)
const ROMS = [
    { title: "Hollow Knight Nes", core: "nes", path: "nes/All Hell Unleashed.nes", featured: true },
    { title: "Backwards Quest", core: "nes", path: "nes/BackwardsQuest v18.nes" },
    { title: "Mario Poker", core: "nes", path: "nes/Mario's Poker War.nes" }
];

let currentIndex = 0;

// 2. INITIALISATION DE LA BIBLIOTHÈQUE
const gameList = document.getElementById('game-list');

function initLibrary() {
    ROMS.forEach((game, index) => {
        const card = document.createElement('div');
        card.className = `game-card ${game.featured ? 'featured' : ''}`;
        card.tabIndex = 0;
        card.innerHTML = `<div class="title">${game.title}</div>`;
        card.onclick = () => launch(game);
        gameList.appendChild(card);
    });
    updateFocus();
}

function updateFocus() {
    const cards = document.querySelectorAll('.game-card');
    cards.forEach((c, i) => c.classList.toggle('active', i === currentIndex));
    cards[currentIndex].focus();
}

// 3. LOGIQUE MANETTE (Gamepad API)
function checkGamepad() {
    const gp = navigator.getGamepads()[0];
    if (!gp) return;

    // Navigation (Croix directionnelle ou Joystick)
    if (gp.axes[0] > 0.5 || gp.buttons[15].pressed) { // Droite
        if (currentIndex < ROMS.length - 1) { currentIndex++; updateFocus(); }
    }
    if (gp.axes[0] < -0.5 || gp.buttons[14].pressed) { // Gauche
        if (currentIndex > 0) { currentIndex--; updateFocus(); }
    }
    
    // Bouton A (Bouton 0 sur la plupart des manettes)
    if (gp.buttons[0].pressed) {
        launch(ROMS[currentIndex]);
    }
}
setInterval(checkGamepad, 150); // Scan de la manette 10 fois par seconde

// 4. LANCEMENT
function launch(game) {
    document.getElementById('emulator-overlay').classList.remove('hidden');
    document.getElementById('playing-title').innerText = game.title;

    window.EJS_player = '#display';
    window.EJS_core = game.core;
    window.EJS_gameUrl = game.path;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';

    const s = document.createElement('script');
    s.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    document.head.appendChild(s);
}

// Horloge
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
}, 1000);

initLibrary();
