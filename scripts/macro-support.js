import Settings from './settings.js';

export default class MacroSupport {
  constructor() {
    this._settings = new Settings();
  }

  /**
   * For all selected tokens, generate currency for them
   */
  generateCurrencyForSelectedTokens() {
    return Dialog.confirm({
      title: 'Generate Currency',
      content: `<p>Generate currency for this NPC. Be wary, this will replace all current coins carried by the NPC and cannot be undone.</p>`,
      yes: async () => {
        // Notify if no tokens selected
        if (canvas.tokens.controlled.length == 0) {
          ui.notifications.error(
            'Tokens must be selected to generate currency'
          );
          return;
        }

        // Only affect valid tokens
        const filtered = canvas.tokens.controlled.filter((token) =>
          this._isTokenValid(token)
        );
        filtered.forEach(
          async (token) => await this._generateCurrencyForToken(token)
        );

        // Notify number of tokens that were effected
        ui.notifications.info(
          `Generated currency for ${filtered.length} tokens`
        );
      },
      defaultYes: false,
    });
  }

  _isTokenValid(token) {
    if (token.actor.hasPlayerOwner) {
      ui.notifications.warn(`Cannot modify player owned token ${token.name}`);
      return false;
    }

    if (token.actor.data.type !== 'npc') {
      ui.notifications.warn(`Cannot modify non-NPC token ${token.name}`);
      return false;
    }

    return true;
  }

  async _generateCurrencyForToken(token) {
    const actor = game.actors.get(token.data.actorId);

    const pocketChange = new game.dfreds.PocketChange();
    const currency = pocketChange.generateCurrency(actor);

    await token.actor.update({
      'data.currency': currency,
    });
  }

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
    return Dialog.confirm({
      title: 'Convert to Lootable',
      content: `<p>Convert this token to a lootable sheet. Be wary, this will only keep items and convert the token to a loot sheet that players can interact with. This cannot be undone.</p>`,
      yes: async () => {
        // Notify if no tokens selected
        if (canvas.tokens.controlled.length == 0) {
          ui.notifications.error(
            'Tokens must be selected to convert to lootable'
          );
          return;
        }

        // Only affect valid tokens
        const filtered = canvas.tokens.controlled.filter((token) =>
          this._isTokenValid(token)
        );
        filtered.forEach(async (token) => {
          const pocketChange = new game.dfreds.PocketChange();
          await pocketChange.convertToLoot({
            token,
            chanceOfDamagedItems,
            damagedItemsMultiplier,
            removeDamagedItems,
          });
        });

        // Notify number of tokens that were effected
        ui.notifications.info(`Converted ${filtered.length} tokens to loot`);
      },
      defaultYes: false,
    });
  }
}
