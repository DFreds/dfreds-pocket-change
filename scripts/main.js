import PocketChange from './pocket-change.js';
import NpcSheetCurrency from './npc-sheet-currency.js';
import Settings from './settings.js';

Hooks.once('init', () => {
  new Settings().registerSettings();

  game.dfreds = game.dfreds || {};
  game.dfreds.PocketChange = PocketChange;
});

Hooks.on('preCreateToken', (tokenDocument, _tokenData, _options, _userId) => {
  const pocketChange = new game.dfreds.PocketChange();
  pocketChange.populateTreasureForToken(tokenDocument);
});

Hooks.on('renderActorSheet5eNPC', async (app, html, data) => {
  const supportedTemplates = [
    'systems/dnd5e/templates/actors/npc-sheet.hbs',
    'modules/tidy5e-sheet/templates/actors/tidy5e-npc.html',
  ];

  if (!supportedTemplates.includes(app.template)) return;

  const npcSheetCurrency = new NpcSheetCurrency({ app, html, data });
  await npcSheetCurrency.injectCurrencyRow();
});
