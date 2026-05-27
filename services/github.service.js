import { CONFIG } from '../core/constants.js';

export class GithubService {

  async fetchGames(consoleData) {

    const url =
      `https://api.github.com/repos/${CONFIG.githubUser}/${CONFIG.githubRepo}/contents/${consoleData.folder}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('GitHub API error');
    }

    const data = await response.json();

    return data
      .filter(file => file.type === 'file')
      .filter(file => file.name.endsWith(consoleData.ext))
      .map(file => ({
        title: file.name.replace(consoleData.ext, ''),
        file: file.name,
        size: file.size
      }));
  }
}
