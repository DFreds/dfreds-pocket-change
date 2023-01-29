import PocketChange from './pocket-change.js';
import MacroSupport from './macro-support.js';
import NpcSheetCurrency from './npc-sheet-currency.js';
import Settings from './settings.js';
import API from './api.js';

Hooks.once('init', () => {
  new Settings().registerSettings();

  // Is better o use the API setting as standard
  // game.dfreds = game.dfreds || {};
  // game.dfreds.PocketChange = PocketChange;
  // game.dfreds.MacroSupport = MacroSupport;
});

Hooks.once("setup", async function () {
  API = API || {};
  API.PocketChange = PocketChange;
  API.MacroSupport = MacroSupport;
  setApi(API);
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

/**
 * Initialization helper, to set API.
 * @param api to set to game module.
 */
export function setApi(api) {
	const data = game.modules.get(Settings.PACKAGE_NAME);
	data.api = api;
}
/**
 * Returns the set API.
 * @returns Api from games module.
 */
export function getApi() {
	const data = game.modules.get(Settings.PACKAGE_NAME);
	return data.api;
}