import PocketChange from './pocket-change.js';
import Settings from './settings.js';
import { itemPilesActive, lootSheetSimpleActive } from './main.js';

const API = {
  PocketChange: undefined,

  /**
   * For all selected tokens, generate currency for them
   *
   * @param {boolean} - (optional) if true it will generate a random currency without the rating check
   */
  generateCurrencyForSelectedTokens(ignoreRating = false) {
    if (!this.PocketChange) {
      this.PocketChange = new PocketChange();
    }

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

          const isItemPiles = this._isItemPiles(token);

          if (isItemPiles) {
            let contentModifyWarn = game.i18n.format(
              'PocketChange.WarningModifyItemPilesToken',
              {
                name: token.name,
              }
            );
            ui.notifications.warn(contentModifyWarn);
          }

          return this._isTokenUnownedNpc(token) && !isTokenLootSheet;
        });
        filtered.forEach(
          async (token) =>
            await this._generateCurrencyForToken(token, ignoreRating)
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
  },

  _isTokenUnownedNpc(token) {
    if (token.actor.hasPlayerOwner) {
      ui.notifications.warn(
        game.i18n.format('PocketChange.WarningModifyPlayerOwnedToken', {
          name: token.name,
        })
      );
      return false;
    }

    if (token.actor.system.type !== 'npc') {
      ui.notifications.warn(
        game.i18n.format('PocketChange.WarningModifyNonNpcToken', {
          name: token.name,
        })
      );
      return false;
    }

    return true;
  },

  _isTokenLootSheet(token) {
    return token.actor.sheet.template.includes('lootsheetnpc5e');
  },

  _isItemPiles(token) {
    return game.itempiles.API.isItemPileContainer(token);
  },

  async _generateCurrencyForToken(token, ignoreRating) {
    const actor = game.actors.get(token.system.actorId);

    const pocketChange = new API.PocketChange();
    const currency = pocketChange.generateCurrency(actor, ignoreRating);

    await token.actor.update({
      'system.currency': currency,
    });
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
    if (!canvas.tokens.controlled.length) {
      ui.notifications.info(`${Settings.PACKAGE_NAME} | Please select tokens to convert to lootable.`)
      return;
    }
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

    if (!this.PocketChange) {
      this.PocketChange = new PocketChange();
    }

    return Dialog.confirm({
      title: game.i18n.localize('PocketChange.ConvertToLootable'),
      content: `<p>${game.i18n.localize(
        'PocketChange.ConvertToLootableWarning'
      )}</p>`,
      yes: async () => {
        // Notify if no tokens selected
        if (canvas.tokens.controlled.length == 0) {
          ui.notifications.error(game.i18n.localize(
            'PocketChange.ConvertToLootableErrorNoTokensSelected'
          ));
          return;
        }

        // Only affect valid tokens
        const filtered = canvas.tokens.controlled.filter((token) => {
          const isTokenLootSheet = this._isTokenLootSheet(token);

          if (isTokenLootSheet) {
            let contentModifyWarn = game.i18n.format(
              'PocketChange.WarningModifyLootSheetToken',
              {
                name: token.name,
              }
            );
            ui.notifications.warn(contentModifyWarn);
          }

          return this._isTokenUnownedNpc(token) && !isTokenLootSheet;
        });
        filtered.forEach(async (token) => {
          const pocketChange = new API.PocketChange();
          await pocketChange._convertToLootSheet({
            token,
            chanceOfDamagedItems,
            damagedItemsMultiplier,
            removeDamagedItems,
          });
        });

        // Notify number of tokens that were effected
        let contentInfoConfirmation = game.i18n.format(
          'PocketChange.ConvertToLootableConfirmation',
          {
            number: filtered.length,
          }
        );
        ui.notifications.info(contentInfoConfirmation);
      },
      defaultYes: false,
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

    if (!this.PocketChange) {
      this.PocketChange = new PocketChange();
    }

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
    if (!canvas.tokens.controlled.length) {
      ui.notifications.info(`${Settings.PACKAGE_NAME} | Please select tokens to convert to lootable.`)
      return;
    }
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

    if (!this.PocketChange) {
      this.PocketChange = new PocketChange();
    }

    return Dialog.confirm({
      title: game.i18n.localize('PocketChange.ConvertToItemPiles'),
      content: `<p>${game.i18n.localize(
        'PocketChange.ConvertToItemPilesWarning'
      )}</p>`,
      yes: async () => {
        // Notify if no tokens selected
        if (canvas.tokens.controlled.length == 0) {
          ui.notifications.error(game.i18n.localize(
            'PocketChange.ConvertToItemPilesErrorNoTokensSelected'
          ));
          return;
        }

        // Only affect valid tokens
        const filtered = canvas.tokens.controlled.filter((token) => {
          const isItemPiles = this._isItemPiles(token);

          if (isItemPiles) {
            let contentModifyWarn = game.i18n.format(
              'PocketChange.WarningModifyItemPilesToken',
              {
                name: token.name,
              }
            );
            ui.notifications.warn(contentModifyWarn);
          }

          return this._isTokenUnownedNpc(token) && !isItemPiles;
        });
        filtered.forEach(async (token) => {
          const pocketChange = new API.PocketChange();
          if(game.modules.get("warpgate")?.active) {
            await pocketChange._convertToItemPilesWithWarpgate({
              token,
              userOption,
              imgPath,
              light,
            });
          } else {
            await pocketChange._convertToItemPiles({
              token,
              userOption,
              imgPath,
              light,
            });
          }
        });

        // Notify number of tokens that were effected
        let contentInfoConfirmation = game.i18n.format(
          'PocketChange.ConvertToItemPilesConfirmation',
          {
            number: filtered.length,
          }
        );
        ui.notifications.info(contentInfoConfirmation);
      },
      defaultYes: false,
    });
  }
};
export default API;
