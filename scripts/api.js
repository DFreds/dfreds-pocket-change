import PocketChange from './pocket-change.js';
import MacroSupport from './macro-support.js';
import Settings from './settings.js';
import { itemPilesActive, lootSheetSimpleActive } from './main.js';

const API = {
  PocketChange: undefined,
  MacroSupport: undefined,

  /**
   * For all selected tokens, generate currency for them
   *
   * @param {boolean} - (optional) if true it will generate a random currency without the rating check
   */
  generateCurrencyForSelectedTokens(ignoreRating = false) {
    if (!this.MacroSupport) {
      this.MacroSupport = new MacroSupport();
    }
    if (!this.PocketChange) {
      this.PocketChange = new PocketChange();
    }
    this.MacroSupport.prototype.generateCurrencyForSelectedTokens(ignoreRating);
  },

  /**
   * For all selected tokens, convert them to lootable sheets.
   *
   * Adapted from the convert-to-lootable.js by @unsoluble, @Akaito, @honeybadger, @kekilla, and @cole.
   *
   * @param {number} chanceOfDamagedItems (optional) A number between 0 and 1 that corresponds to the percent chance an item will be damaged
   * @param {number} damagedItemsMultiplier (optional) A number between 0 and 1 that will lower a damaged items value
   * @param {boolean} removeDamagedItems (optional) If true, damaged items will be removed from the token rather than marked as damaged
   */
  convertSelectedTokensToLootSheet(
    chanceOfDamagedItems,
    damagedItemsMultiplier,
    removeDamagedItems
  ) {
    if (!lootSheetSimpleActive) {
      let word = 'install and activate';
      if (game.modules.get('lootsheet-simple')) word = 'activate';
      const errorText =
        `${Settings.PACKAGE_NAME} | Requires the 'lootsheet-simple' module. Please ${word} it.`.replace(
          '<br>',
          '\n'
        );
      ui.notifications?.error(errorText);
      throw new Error(errorText);
    }
    if (!this.MacroSupport) {
      this.MacroSupport = new MacroSupport();
    }
    if (!this.PocketChange) {
      this.PocketChange = new PocketChange();
    }
    this.MacroSupport.prototype.convertSelectedTokensToLoot({
      chanceOfDamagedItems,
      damagedItemsMultiplier,
      removeDamagedItems,
      mode: 'lootsheet',
    });
  },

  /**
   * For all selected tokens, convert them back from lootable sheets.
   */
  revertSelectedTokensFromLootSheet() {
    if (!lootSheetSimpleActive) {
      let word = 'install and activate';
      if (game.modules.get('lootsheet-simple')) word = 'activate';
      const errorText =
        `${Settings.PACKAGE_NAME} | Requires the 'lootsheet-simple' module. Please ${word} it.`.replace(
          '<br>',
          '\n'
        );
      ui.notifications?.error(errorText);
      throw new Error(errorText);
    }
    if (!this.MacroSupport) {
      this.MacroSupport = new MacroSupport();
    }
    if (!this.PocketChange) {
      this.PocketChange = new PocketChange();
    }
    this.MacroSupport.prototype.revertSelectedTokensFromLootSheet();
  },

  /**
   * For all selected tokens, convert them to item piles.
   *
   * @param {number} userOption - (optional) the type of convertion by default is 1
   * You've got 4 options to choose from:
   * 0 = No Special Effect, Coin roll and -if enabled- Item Pile Transformation Only
   * 1 = Light Effect only
   * 2 = Change Image Only
   * 3 = Both Image Change and Light effect
   * @param {string} imgPath - (optional) the path to the image by default is the one set on the module setting
   * @param {Light} light (optional) explicit light effect to use if none is passed a default one is used
   */
  convertSelectedTokensToItemPiles(userOption, imgPath, light) {
    if (!itemPilesActive) {
      let word = 'install and activate';
      if (game.modules.get('item-piles')) word = 'activate';
      const errorText =
        `${Settings.PACKAGE_NAME} | Requires the 'item-piles' module. Please ${word} it.`.replace(
          '<br>',
          '\n'
        );
      ui.notifications?.error(errorText);
      throw new Error(errorText);
    }
    if (!this.MacroSupport) {
      this.MacroSupport = new MacroSupport();
    }
    if (!this.PocketChange) {
      this.PocketChange = new PocketChange();
    }
    this.MacroSupport.prototype.convertSelectedTokensToLoot({
      userOption,
      imgPath,
      light,
      mode: 'itempiles',
    });
  },
};
export default API;
