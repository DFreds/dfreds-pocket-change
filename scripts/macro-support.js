import Settings from './settings.js';

export default class MacroSupport {
  constructor() {
    this._settings = new Settings();
  }

  /**
   * For all selected tokens, generate currency for them
   */
  generateCurrencyForSelectedTokens() {
    new Dialog({
      title: 'Currency Generator',
      content: `Generate currency for all selected tokens?`,
      buttons: {
        no: {
          icon: '<i class="fas fa-ban"></i>',
          label: 'Cancel',
        },
        yes: {
          icon: '<i class="fas fa-thumbs-up"></i>',
          label: 'Generate',
          callback: (html) => {
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
        },
      },
      default: 'no',
    }).render(true);
  }

  _isTokenValid(token) {
    if (token.actor.hasPlayerOwner) {
      ui.notifications.warn(`Cannot modify player owned token ${token.name}`);
      return false;
    }

    if (token.actor.data.token.actorLink) {
      ui.notifications.warn(`Cannot modify linked token ${token.name}`);
      return false;
    }

    if (token.actor.data.type != 'npc') {
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
    new Dialog({
      title: 'Loot Converter',
      content: `Convert all selected tokens to loot?`,
      buttons: {
        no: {
          icon: '<i class="fas fa-ban"></i>',
          label: 'Cancel',
        },
        yes: {
          icon: '<i class="fas fa-thumbs-up"></i>',
          label: 'Convert',
          callback: (html) => {
            // Notify if no tokens selected
            if (canvas.tokens.controlled.length == 0) {
              ui.notifications.error(
                'Tokens must be selected to convert to loot'
              );
              return;
            }

            // Only affect valid tokens
            const filtered = canvas.tokens.controlled.filter((token) =>
              this._isTokenValid(token)
            );
            filtered.forEach(
              async (token) =>
                await this._convertTokenToLoot(
                  token,
                  chanceOfDamagedItems,
                  damagedItemsMultiplier,
                  removeDamagedItems
                )
            );

            // Notify number of tokens that were effected
            ui.notifications.info(
              `Converted ${filtered.length} tokens to loot`
            );
          },
        },
      },
      default: 'no',
    }).render(true);
  }

  async _convertTokenToLoot(
    token,
    chanceOfDamagedItems,
    damagedItemsMultiplier,
    removeDamagedItems
  ) {
    let newActorData = this._getLootSheetData();
    newActorData.items = this._getLootableItems(
      token,
      chanceOfDamagedItems,
      damagedItemsMultiplier,
      removeDamagedItems
    );

    // Eventually, this might be removed when loot sheet supports regular schema
    this._handleCurrencySchemaChange(token, newActorData);

    // Delete all items first
    await token.document.actor.deleteEmbeddedDocuments(
      'Item',
      Array.from(token.actor.items.keys())
    );

    // Update actor with the new sheet and items
    await token.document.actor.update(newActorData);

    // Update the document with the overlay icon and new permissions
    await token.document.update({
      overlayEffect: 'icons/svg/chest.svg',
      actorData: {
        actor: {
          flags: {
            loot: {
              playersPermission: CONST.ENTITY_PERMISSIONS.OBSERVER,
            },
          },
        },
        permission: this._getUpdatedUserPermissions(token),
      },
    });
  }

  _getLootSheetData() {
    return {
      flags: {
        core: {
          sheetClass: 'dnd5e.LootSheet5eNPC',
        },
        lootsheetnpc5e: {
          lootsheettype: 'Loot',
        },
      },
    };
  }

  // Remove natural weapons, natural armor, class features, spells, and feats.
  _getLootableItems(
    token,
    chanceOfDamagedItems,
    damagedItemsMultiplier,
    removeDamagedItems
  ) {
    return token.actor.data.items
      .map((item) => {
        return item.toObject();
      })
      .filter((item) => {
        if (item.type == 'weapon') {
          return item.data.weaponType != 'natural';
        }

        if (item.type == 'equipment') {
          if (!item.data.armor) return true;
          return item.data.armor.type != 'natural';
        }

        return !['class', 'spell', 'feat'].includes(item.type);
      })
      .filter((item) => {
        if (this._isItemDamaged(item, chanceOfDamagedItems)) {
          if (removeDamagedItems) return false;

          item.name += ' (Damaged)';
          item.data.price *= damagedItemsMultiplier;
        }

        return true;
      })
      .map((item) => {
        item.data.equipped = false;
        return item;
      });
  }

  _isItemDamaged(item, chanceOfDamagedItems) {
    const rarity = item.data.rarity;
    if (!rarity) return false;

    // Never consider items above common rarity breakable
    if (rarity.toLowerCase() !== 'common' && rarity.toLowerCase() !== 'none')
      return false;

    return Math.random() < chanceOfDamagedItems;
  }

  // This is a workaround for the fact that the LootSheetNPC module
  // currently uses an older currency schema, compared to current 5e expectations.
  // Need to convert the actor's currency data to the LS schema here to avoid
  // breakage. If there is already currency on the actor, it is retained.
  _handleCurrencySchemaChange(token, newActorData) {
    if (typeof token.actor.data.data.currency.cp === 'number') {
      let oldCurrencyData = token.actor.data.data.currency;
      newActorData['data.currency'] = {
        cp: { value: oldCurrencyData.cp },
        ep: { value: oldCurrencyData.ep },
        gp: { value: oldCurrencyData.gp },
        pp: { value: oldCurrencyData.pp },
        sp: { value: oldCurrencyData.sp },
      };
    }
  }

  // Update permissions to observer level, so players can loot
  _getUpdatedUserPermissions(token) {
    let lootingUsers = game.users.filter((user) => {
      return (
        user.role == CONST.USER_ROLES.PLAYER ||
        user.role == CONST.USER_ROLES.TRUSTED
      );
    });

    let permissions = {};
    Object.assign(permissions, token.actor.data.permission);

    lootingUsers.forEach((user) => {
      permissions[user.data._id] = CONST.ENTITY_PERMISSIONS.OBSERVER;
    });

    return permissions;
  }
}
