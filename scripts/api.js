import PocketChange from './pocket-change.js';
import MacroSupport from './macro-support.js';

const API = {
	PocketChange,
    MacroSupport,

    /**
   * For all selected tokens, generate currency for them
   */
	generateCurrencyForSelectedTokens(ignoreRating = false) {
		this.MacroSupport.generateCurrencyForSelectedTokens(ignoreRating);
	},
	
	/**
	 * For all selected tokens, convert them to lootable sheets.
	 *
	 * Adapted from the convert-to-lootable.js by @unsoluble, @Akaito, @honeybadger, @kekilla, and @cole.
	 *
	 * @param {number} chanceOfDamagedItems A number between 0 and 1 that corresponds to the percent chance an item will be damaged
	 * @param {number} damagedItemsMultiplier A number between 0 and 1 that will lower a damaged items value
	 * @param {boolean} removeDamagedItems If true, damaged items will be removed from the token rather than marked as damaged
	 */
	convertSelectedTokensToLoot(
		chanceOfDamagedItems,
		damagedItemsMultiplier,
		removeDamagedItems
	) {
		this.MacroSupport.convertSelectedTokensToLoot(
			chanceOfDamagedItems,
			damagedItemsMultiplier,
			removeDamagedItems);
	},
	
	/**
	 * For all selected tokens, convert them back from lootable sheets.
	 */
	convertSelectedTokensFromLoot() {
		this.MacroSupport.convertSelectedTokensFromLoot();
	}
};
export default API;
