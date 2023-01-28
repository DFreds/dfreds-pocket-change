import API from './api.js';
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
      title: game.i18n.localize('PocketChange.GenerateCurrency'),
      content: `<p>${game.i18n.localize(
        'PocketChange.GenerateCurrencyWarning'
      )}</p>`,
      yes: async () => {
        // Notify if no tokens selected
        if (canvas.tokens.controlled.length == 0) {
          ui.notifications.error(
            game.i18n.localize(
              'PocketChange.GenerateCurrencyErrorNoTokensSelected'
            )
          );
          return;
        }

        // Only affect valid tokens
        const filtered = canvas.tokens.controlled.filter((token) => {
          const isTokenLootSheet = this._isTokenLootSheet(token);

          if (isTokenLootSheet) {
            ui.notifications.warn(
              game.i18n.format('PocketChange.WarningModifyLootSheetToken', {
                name: token.name,
              })
            );
          }

          return this._isTokenUnownedNpc(token) && !isTokenLootSheet;
        });
        filtered.forEach(
          async (token) => await this._generateCurrencyForToken(token)
        );

        // Notify number of tokens that were effected
        ui.notifications.info(
          game.i18n.format('PocketChange.GenerateCurrencyConfirmation', {
            number: filtered.length,
          })
        );
      },
      defaultYes: false,
    });
  }

  _isTokenUnownedNpc(token) {
    if (token.actor.hasPlayerOwner) {
      ui.notifications.warn(
        game.i18n.format('PocketChange.WarningModifyPlayerOwnedToken', {
          name: token.name,
        })
      );
      return false;
    }

    if (token.actor.data.type !== 'npc') {
      ui.notifications.warn(
        game.i18n.format('PocketChange.WarningModifyNonNpcToken', {
          name: token.name,
        })
      );
      return false;
    }

    return true;
  }

  _isTokenLootSheet(token) {
    return token.actor.sheet.template.includes('lootsheetnpc5e');
  }

  async _generateCurrencyForToken(token) {
    const actor = game.actors.get(token.data.actorId);

    const pocketChange = new API.PocketChange();
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
      title: game.i18n.localize('PocketChange.ConvertToLootable'),
      content: `<p>${game.i18n.localize(
        'PocketChange.ConvertToLootableWarning'
      )}</p>`,
      yes: async () => {
        // Notify if no tokens selected
        if (canvas.tokens.controlled.length == 0) {
          ui.notifications.error(
            game.i18n.localize(
              'PocketChange.ConvertToLootableErrorNoTokensSelected'
            )
          );
          return;
        }

        // Only affect valid tokens
        const filtered = canvas.tokens.controlled.filter((token) => {
          const isTokenLootSheet = this._isTokenLootSheet(token);

          if (isTokenLootSheet) {
            ui.notifications.warn(
              game.i18n.format('PocketChange.WarningModifyLootSheetToken', {
                name: token.name,
              })
            );
          }

          return this._isTokenUnownedNpc(token) && !isTokenLootSheet;
        });
        filtered.forEach(async (token) => {
          const pocketChange = new API.PocketChange();
          await pocketChange.convertToLoot({
            token,
            chanceOfDamagedItems,
            damagedItemsMultiplier,
            removeDamagedItems,
          });
        });

        // Notify number of tokens that were effected
        ui.notifications.info(
          game.i18n.format('PocketChange.ConvertToLootableConfirmation', {
            number: filtered.length,
          })
        );
      },
      defaultYes: false,
    });
  }

  /**
   * For all selected tokens, convert them back from lootable sheets.
   */
  convertSelectedTokensFromLoot() {
    return Dialog.confirm({
      title: game.i18n.localize('PocketChange.ConvertFromLootable'),
      content: `<p>${game.i18n.localize(
        'PocketChange.ConvertFromLootableWarning'
      )}</p>`,
      yes: async () => {
        // Notify if no tokens selected
        if (canvas.tokens.controlled.length == 0) {
          ui.notifications.error(
            game.i18n.localize(
              'PocketChange.ConvertFromLootableErrorNoTokensSelected'
            )
          );
          return;
        }

        // Only affect valid tokens
        const filtered = canvas.tokens.controlled.filter((token) => {
          const isTokenLootSheet = this._isTokenLootSheet(token);

          if (!isTokenLootSheet) {
            ui.notifications.warn(
              game.i18n.format('PocketChange.WarningModifyNonLootSheetToken', {
                name: token.name,
              })
            );
          }

          return this._isTokenUnownedNpc(token) && isTokenLootSheet;
        });
        filtered.forEach(async (token) => {
          const pocketChange = new API.PocketChange();
          await pocketChange.convertFromLoot(token);
        });

        // Notify number of tokens that were effected
        ui.notifications.info(
          game.i18n.format('PocketChange.ConvertFromLootableConfirmation', {
            number: filtered.length,
          })
        );
      },
      defaultYes: false,
    });
  }
}
