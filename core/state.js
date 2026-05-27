export class State {

  #state = {
    consoleId: 'nes',
    games: [],
    filteredGames: [],
    loading: false,
    search: ''
  };

  get() {
    return structuredClone(this.#state);
  }

  set(key, value) {
    this.#state[key] = value;
  }
}
