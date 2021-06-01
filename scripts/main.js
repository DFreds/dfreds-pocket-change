import PocketChange from './pocket-change.js';
import MacroSupport from './macro-support.js';
import Settings from './settings.js';

Hooks.once('init', () => {
  new Settings().registerSettings();

  game.dfreds = game.dfreds || {};
  game.dfreds.PocketChange = PocketChange;
  game.dfreds.MacroSupport = MacroSupport;
});

Hooks.on('preCreateToken', (tokenDocument, tokenData, options, userId) => {
  const pocketChange = new game.dfreds.PocketChange();
  pocketChange.populateTreasureForToken(tokenDocument);
});
