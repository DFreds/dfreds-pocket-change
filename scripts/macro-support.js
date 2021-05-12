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
            if (canvas.tokens.controlled.length == 0) {
              ui.notifications.error(
                'Tokens must be selected to generate currency'
              );
              return;
            }

            const filtered = canvas.tokens.controlled.filter((token) =>
              this._isTokenValid(token)
            );
            filtered.forEach(
              async (token) => await this._generateCurrencyForToken(token)
            );
            ui.notifications.info(
              `Generated currency for ${filtered.length} tokens`
            );
          },
        },
      },
      default: 'no',
    }).render(true);
  }

  /**
   * For all selected tokens, convert them to lootable sheets
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
            if (canvas.tokens.controlled.length == 0) {
              ui.notifications.error(
                'Tokens must be selected to convert to loot'
              );
              return;
            }

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
            ui.notifications.info(
              `Converted ${filtered.length} tokens to loot`
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
    let newCurrencyData = {};
    newCurrencyData['data.currency'] = currency;

    await token.actor.update(newCurrencyData);
  }

  async _convertTokenToLoot(
    token,
    chanceOfDamagedItems,
    damagedItemsMultiplier,
    removeDamagedItems
  ) {
    await this._removeCubConditions(token);

    const lootableItems = this._unequipItems(
      this._getLootableItems(
        token,
        chanceOfDamagedItems,
        damagedItemsMultiplier,
        removeDamagedItems
      )
    );

    // Force an update of all the items
    await token.actor.update({
      items: [],
    });
    await token.actor.update({
      items: lootableItems,
    });

    await token.actor.update(this._getNewActorData(token));
    await token.update({
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

  _unequipItems(items) {
    return items.map((item) => {
      item.data.equipped = false;
      return item;
    });
  }

  async _removeCubConditions(token) {
    if (game.modules.get('combat-utility-belt')?.active) {
      await game.cub.removeAllConditions(token);
    }
  }

  _getNewActorData(token) {
    let newActorData = {
      flags: {
        core: {
          sheetClass: 'dnd5e.LootSheet5eNPC',
        },
        lootsheetnpc5e: {
          lootsheettype: 'Loot',
        },
      },
    };

    // Handles if they already have currency set somehow
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

    return newActorData;
  }

  _getUpdatedUserPermissions(token) {
    let lootingUsers = game.users.entities.filter((user) => {
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
