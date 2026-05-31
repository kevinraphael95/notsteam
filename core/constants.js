export const CONFIG = {
  githubUser: 'kevinraphael95',
  githubRepo: 'notsteam',
  emulatorDataPath: 'https://cdn.emulatorjs.org/stable/data/'
};

export const CONSOLES = [
  {
    id: 'nes',
    name: 'NES',
    ext: '.nes',
    core: 'nes',
    folder: 'nes',
    thumb: 'assets/consoles/NES.jpg'
  },
  {
    id: 'snes',
    name: 'Super NES',
    ext: '.sfc',
    core: 'snes9x',
    folder: 'snes',
    thumb: 'assets/consoles/SNES.jpg'
  },
  {
    id: 'gb',
    name: 'Game Boy',
    ext: '.gb',
    core: 'gambatte',
    folder: 'gb',
    thumb: 'assets/consoles/GAMEBOY.jpg'
  },
  {
    id: 'gba',
    name: 'Game Boy Adv.',
    ext: '.gba',
    core: 'gba',
    folder: 'gba',
    thumb: 'assets/consoles/GAMEBOYADV.jpg'
  },
  {
    id: 'n64',
    name: 'Nintendo 64',
    ext: '.z64',
    core: 'n64',
    folder: 'n64',
    thumb: 'assets/consoles/NINTENDO64.jpg'
  },
  {
    id: 'ps1',
    name: 'PlayStation 1',
    ext: '.bin',
    core: 'psx',
    folder: 'ps1',
    thumb: 'assets/consoles/PLAYSTATION.jpg'
  }
];
