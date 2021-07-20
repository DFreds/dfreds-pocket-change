import PocketChange from './pocket-change.js';
import MacroSupport from './macro-support.js';
import NpcSheetCurrency from './npc-sheet-currency.js';
import Settings from './settings.js';

Hooks.once('init', () => {
  new Settings().registerSettings();

  game.dfreds = game.dfreds || {};
  game.dfreds.PocketChange = PocketChange;
  game.dfreds.MacroSupport = MacroSupport;
});

Hooks.on('preCreateToken', (tokenDocument, _tokenData, _options, _userId) => {
  const pocketChange = new game.dfreds.PocketChange();
  pocketChange.populateTreasureForToken(tokenDocument);
});

Hooks.on('renderActorSheet5eNPC', async (app, html, data) => {
  if (app.template !== 'systems/dnd5e/templates/actors/npc-sheet.html') return; // TODO support tidy

  const npcSheetCurrency = new NpcSheetCurrency({ app, html, data });
  npcSheetCurrency.injectCurrencyRow();
});
