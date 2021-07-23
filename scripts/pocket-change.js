import Currency from './currency.js';
import log from './logger.js';
import Settings from './settings.js';
import Validator from './validator.js';

/**
 * Handles generating coin and converting to loot
 */
export default class PocketChange {
  /**
   * Initializes dependencies
   */
  constructor() {
    this._settings = new Settings();
    this._validator = new Validator();
  }

  /**
   * Converts the provided token to a lootable sheet
   *
   * @param {object} options
   * @param {Token5e} options.token - the token to convert
   * @param {number} options.chanceOfDamagedItems - (optional) the chance an item is considered damaged from 0 to 1. Uses the setting if undefined
   * @param {number} options.damagedItemsMultiplier - (optional) the amount to reduce the value of a damaged item by. Uses the setting if undefined
   * @param {boolean} options.removeDamagedItems - (optional) if true, removes items that are damaged of common rarity
   */
  async convertToLoot({
    token,
    chanceOfDamagedItems,
    damagedItemsMultiplier,
    removeDamagedItems,
  }) {
    chanceOfDamagedItems ??= this._settings.chanceOfDamagedItems;
    damagedItemsMultiplier ??= this._settings.damagedItemsMultiplier;
    removeDamagedItems ??= this._settings.removeDamagedItems;

    const sheet = token.actor.sheet;

    // -1 for opened before but now closed
    // 0 for closed and never opened
    // 1 for currently open
    const priorState = sheet._state;

    // Close the old sheet if it's open
    await sheet.close();

    let newActorData = this._getLootSheetData();
    newActorData.items = this._getLootableItems({
      token,
      chanceOfDamagedItems,
      damagedItemsMultiplier,
      removeDamagedItems,
    });

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

    // Deregister the old sheet class
    token.actor._sheet = null;
    delete token.actor.apps[sheet.appId];

    if (priorState > 0) {
      // Re-draw the updated sheet if it was open
      token.actor.sheet.render(true);
    }
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
  _getLootableItems({
    token,
    chanceOfDamagedItems,
    damagedItemsMultiplier,
    removeDamagedItems,
  }) {
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

  /**
   * Takes the provided token and adds currency to it if it is valid
   *
   * @param {TokenDocument5e} tokenDocument - The token document for the dropped actor
   */
  populateTreasureForToken(tokenDocument) {
    const actor = tokenDocument.actor;

    if (!this._validator.shouldAutoGenerateCurrency(actor)) return;

    log('Generating treasure');

    tokenDocument.data.update({
      actorData: {
        data: {
          currency: this.generateCurrency(actor),
        },
      },
    });
  }

  /**
   * Generates currency for the provided actor based on its challenge rating
   *
   * @param {Actor5e} actor - The actor to base the coin generation off of
   */
  generateCurrency(actor) {
    let currency;

    if (this._isWithinChallengeRating(actor, 0, 4)) {
      currency = this._treasureForChallengeRating0to4(actor);
    } else if (this._isWithinChallengeRating(actor, 5, 10)) {
      currency = this._treasureForChallengeRating5to10(actor);
    } else if (this._isWithinChallengeRating(actor, 11, 16)) {
      currency = this._treasureForChallengeRating11to16(actor);
    } else if (this._isWithinChallengeRating(actor, 17, 100)) {
      currency = this._treasureForChallengeRating17andUp(actor);
    }

    currency.convertCurrencies();

    return currency.convertToStandardCurrency();
  }

  _isWithinChallengeRating(actor, lowerCr, upperCr) {
    let cr = actor.data.data.details.cr;
    return cr >= lowerCr && cr <= upperCr;
  }

  _treasureForChallengeRating0to4(actor) {
    let currency = new Currency(actor);
    let roll = this._rollDice('1d100');

    if (roll >= 1 && roll <= 30) {
      currency.addCopper(this._rollDice('5d6'));
    } else if (roll >= 31 && roll <= 60) {
      currency.addSilver(this._rollDice('4d6'));
    } else if (roll >= 61 && roll <= 70) {
      currency.addElectrum(this._rollDice('3d6'));
    } else if (roll >= 71 && roll <= 95) {
      currency.addGold(this._rollDice('3d6'));
    } else {
      currency.addPlatinum(this._rollDice('1d6'));
    }

    return currency;
  }

  _treasureForChallengeRating5to10(actor) {
    let currency = new Currency(actor);
    let roll = this._rollDice('1d100');

    if (roll >= 1 && roll <= 30) {
      currency.addCopper(this._rollDice('4d6*100'));
      currency.addElectrum(this._rollDice('1d6*10'));
    } else if (roll >= 31 && roll <= 60) {
      currency.addSilver(this._rollDice('6d6*10'));
      currency.addGold(this._rollDice('2d6*10'));
    } else if (roll >= 61 && roll <= 70) {
      currency.addElectrum(this._rollDice('3d6*10'));
      currency.addGold(this._rollDice('2d6*10'));
    } else if (roll >= 71 && roll <= 95) {
      currency.addGold(this._rollDice('4d6*10'));
    } else {
      currency.addGold(this._rollDice('2d6*10'));
      currency.addPlatinum(this._rollDice('3d6'));
    }

    return currency;
  }

  _treasureForChallengeRating11to16(actor) {
    let currency = new Currency(actor);
    let roll = this._rollDice('1d100');

    if (roll >= 1 && roll <= 20) {
      currency.addSilver(this._rollDice('4d6*100'));
      currency.addGold(this._rollDice('1d6*100'));
    } else if (roll >= 21 && roll <= 35) {
      currency.addElectrum(this._rollDice('1d6*100'));
      currency.addGold(this._rollDice('1d6*100'));
    } else if (roll >= 36 && roll <= 75) {
      currency.addGold(this._rollDice('2d6*100'));
      currency.addPlatinum(this._rollDice('1d6*10'));
    } else {
      currency.addGold(this._rollDice('2d6*100'));
      currency.addPlatinum(this._rollDice('2d6*10'));
    }

    return currency;
  }

  _treasureForChallengeRating17andUp(actor) {
    let currency = new Currency(actor);
    let roll = this._rollDice('1d100');

    if (roll >= 1 && roll <= 15) {
      currency.addElectrum(this._rollDice('2d6*1000'));
      currency.addGold(this._rollDice('8d6*100'));
    } else if (roll >= 16 && roll <= 55) {
      currency.addGold(this._rollDice('1d6*1000'));
      currency.addPlatinum(this._rollDice('1d6*100'));
    } else {
      currency.addGold(this._rollDice('1d6*1000'));
      currency.addPlatinum(this._rollDice('2d6*100'));
    }

    return currency;
  }

  _rollDice(formula) {
    const roll = new Roll(formula);
    roll.evaluate({
      async: false, // TODO eventually, this will be asynchronous and will need to handle it
    });
    return roll.total;
  }
}
