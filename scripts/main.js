import PocketChange from './pocket-change.js';
import MacroSupport from './macro-support.js';
import NpcSheetCurrency from './npc-sheet-currency.js';
import Settings from './settings.js';
import API from './api.js';

export let lootSheetSimpleActive = false;
export let itemPilesActive = false;

Hooks.once('init', () => {
  new Settings().registerSettings();

  // Is better o use the API setting as standard
  // game.dfreds = game.dfreds || {};
  // game.dfreds.PocketChange = PocketChange;
  // game.dfreds.MacroSupport = MacroSupport;
  lootSheetSimpleActive = game.modules.get('lootsheet-simple')?.active;
  itemPilesActive = game.modules.get('item-piles')?.active
});

Hooks.once('setup', async function () {
  API.PocketChange = PocketChange;
  API.MacroSupport = MacroSupport;
  const data = game.modules.get(Settings.PACKAGE_NAME);
  data.api = api;
});

Hooks.on('preCreateToken', (tokenDocument, _tokenData, _options, _userId) => {
  const pocketChange = new API.PocketChange();
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
