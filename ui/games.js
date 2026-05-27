export class GamesView {

  constructor(root) {

    this.root = root;
  }

  render(games) {

    this.root.innerHTML = games
      .map((game, index) => {

        return `
          <div class="game" data-index="${index}">
            ${game.title}
          </div>
        `;
      })
      .join('');
  }
}
