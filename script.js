document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader');
    const clock = document.getElementById('clock');
    const cards = document.querySelectorAll('.card');
    const libraryView = document.getElementById('library-view');
    const playerView = document.getElementById('player-view');
    const exitBtn = document.getElementById('exit-btn');

    // 1. Mise à jour Horloge
    const updateTime = () => {
        const now = new Date();
        clock.innerText = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };
    setInterval(updateTime, 1000);
    updateTime();

    // 2. Gestion du chargement
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }, 1000);

    // 3. Fonction de lancement de jeu
    const launchGame = (core, path, name) => {
        libraryView.classList.add('hidden');
        playerView.classList.remove('hidden');
        document.getElementById('active-game-info').innerText = `SESSION EN COURS : ${name}`;

        // EmulatorJS Configuration
        window.EJS_player = '#emulator-target';
        window.EJS_core = core;
        window.EJS_gameUrl = path; 
        window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';

        const script = document.createElement('script');
        script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
        document.head.appendChild(script);
    };

    // 4. Événements Clic / Tactile
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const core = card.getAttribute('data-core');
            const path = card.getAttribute('data-path');
            const name = card.querySelector('h3').innerText;
            launchGame(core, path, name);
        });

        // Gestion Entrée au clavier pour accessibilité PC
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') card.click();
        });
    });

    // 5. Bouton Quitter
    exitBtn.addEventListener('click', () => {
        window.location.reload(); // Recharge pour vider la mémoire de l'émulateur
    });
});
