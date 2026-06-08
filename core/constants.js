export const CONFIG = {
  githubUser: 'kevinraphael95',
  githubRepo: 'notsteam',
  emulatorDataPath: 'https://cdn.emulatorjs.org/stable/data/'
};

export const CONSOLES = [
  {
    id: 'nes',
    name: 'NES',
    short: 'NES',
    ext: '.nes',
    core: 'nes',
    folder: 'nes',
    icon: '🕹️',
    color: '#e8192c'
  },
  {
    id: 'snes',
    name: 'Super NES',
    short: 'SNES',
    ext: '.sfc',
    core: 'snes9x',
    folder: 'snes',
    icon: '🎮',
    color: '#7b5ea7'
  },
  {
    id: 'gb',
    name: 'Game Boy',
    short: 'GB',
    ext: '.gb',
    core: 'gambatte',
    folder: 'gb',
    icon: '📺',
    color: '#8bac0f'
  },
  {
    id: 'gba',
    name: 'Game Boy Adv.',
    short: 'GBA',
    ext: '.gba',
    core: 'gba',
    folder: 'gba',
    icon: '🎯',
    color: '#1a1fd4'
  },
  {
    id: 'n64',
    name: 'Nintendo 64',
    short: 'N64',
    ext: '.z64',
    core: 'n64',
    folder: 'n64',
    icon: '🌀',
    color: '#009ac7'
  },
  {
    id: 'ps1',
    name: 'PlayStation 1',
    short: 'PS1',
    ext: '.bin',
    core: 'psx',
    folder: 'ps1',
    icon: '🔵',
    color: '#003087'
  }
];
