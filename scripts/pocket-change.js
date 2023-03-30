import Currency from './currency.js';
import log from './logger.js';
import { itemPilesActive, lootSheetSimpleActive } from './main.js';
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
   * Takes the provided token and adds currency to it if it is valid
   *
   * @param {TokenDocument5e} tokenDocument - The token document for the dropped actor
   */
  populateTreasureForToken(tokenDocument, ignoreRating) {
    if (!this._validator.shouldAutoGenerateCurrency(tokenDocument)) {
      return;
    }
    log('Generating treasure');

    tokenDocument.updateSource({
      actorData: {
        system: {
          currency: this.generateCurrency(tokenDocument.actor, ignoreRating),
        },
      },
    });
  }

  /**
   * Generates currency for the provided actor based on its challenge rating
   *
   * @param {Actor5e} actor - The actor to base the coin generation off of
   * @param {boolean} ignoreRating - If true to generate a random number of coins independent of NPC rating for anyone would like to take something truly random
   */
  generateCurrency(actor, ignoreRating) {
    let currency;

    if (ignoreRating) {
      this._treasureNoChallengeRating([actor]);
    } else {
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

      const converted = currency.convertToStandardCurrency();
      if (this._settings.showChatMessage) {
        this._showChatMessage(actor, converted);
      }
  
      return converted;
    }
  }

  _isWithinChallengeRating(actor, lowerCr, upperCr) {
    let cr = actor.system.details.cr;
    return cr >= lowerCr && cr <= upperCr;
  }

  _treasureNoChallengeRating(actorsToUpdate) {
    if (!actorsToUpdate || actorsToUpdate.length == 0) { 
      ui.notifications.info("No actors to update"); 
      return; 
    }

    new Dialog({
      title: "Apply Currency to Selected Tokens",
      content: `<style>.loot-sheet-currency td:first-child{text-align:right;padding-right:0.75em}</style>
    <p>Enter the amounts or roll expressions to be added to each selected token's currency.</p>
    <table class="loot-sheet-currency">
    <tr><td>Platinum</td><td><input name="pp" type="text" placeholder="ex. 2d6 or 42" /></td></tr>
    <tr><td>    Gold</td><td><input name="gp" type="text" placeholder="ex. 2d6 or 42" /></td></tr>
    <tr><td>Electrum</td><td><input name="ep" type="text" placeholder="ex. 2d6 or 42" /></td></tr>
    <tr><td>  Silver</td><td><input name="sp" type="text" placeholder="ex. 2d6 or 42" /></td></tr>
    <tr><td>  Copper</td><td><input name="cp" type="text" placeholder="ex. 2d6 or 42" /></td></tr>
    <tr><td>Function</td><td><select>
    <option value="rep" selected>Replace values</option>
    <option value="add">Add Values</option>
    <option value="sub">Subtract Values</option>
    <option value="mul">Multiply Values</option>
    <option value="div">Divide Values</option>
    </select></td></tr>
    </table>`,
      buttons: {
        cancel: { label: "Cancel", icon: '<i class="fas fa-times"></i>' },
        submit: {
          label: "Submit", icon: '<i class="fas fa-save"></i>',
          callback: async html => {
            const roll = x => x.length > 0 ? Roll.create(x) : Roll.create('0');
            const curr = {
              pp: roll(html.find('input[name="pp"]').val()),
              gp: roll(html.find('input[name="gp"]').val()),
              ep: roll(html.find('input[name="ep"]').val()),
              sp: roll(html.find('input[name="sp"]').val()),
              cp: roll(html.find('input[name="cp"]').val())
            };
            const op = html.find('select').val();
            for(const actorToUpdate of actorsToUpdate) {
              const currency = duplicate(actorToUpdate.system.currency);
              var current = 0;
              var rollTotal = 0;
              var result = 0;
              for (let key of Object.keys(currency)) {
                current = currency[key].value !== undefined ? parseInt(currency[key].value) : parseInt(currency[key]);
                rollTotal = (await curr[key].reroll({async:true})).total;
                if (isNaN(current)) current = 0;
                if(op === 'rep') result = rollTotal;
                else if(op === 'add') result = current + rollTotal;
                else if(op === 'sub') result = current - rollTotal;
                else if(op === 'mul') result = current * rollTotal;
                else if(op === 'div') result = current / rollTotal;
                if (currency[key] === undefined) currency[key] = result.toString();
                else currency[key] = result;
              }
              if (this._settings.showChatMessage) {
                this._showChatMessage(actorToUpdate, currency);
              }
              await actorToUpdate.update({ system: { currency } });
            }
          }
        }
      }, default: "submit"
    }).render(true);
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

  _showChatMessage(actor, currency) {
    ChatMessage.create({
      user: game.userId,
      whisper: game.users.filter((user) => user.isGM).map((gm) => gm.id),
      flavor: `Currency generated for ${actor.name}`,
      content: this._currencyToString(currency),
    });
  }

  _currencyToString(currency) {
    return `
    <table>
      <tr>
        <th>PP</th>
        <th>GP</th>
        <th>EP</th>
        <th>SP</th>
        <th>CP</th>
      </tr>
      <tr>
        <td>${currency.pp}</td>
        <td>${currency.gp}</td>
        <td>${currency.ep}</td>
        <td>${currency.sp}</td>
        <td>${currency.cp}</td>
    </table>
    `;
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
  async _convertToLootSheet({
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

    let newActorData = {
      flags: {
        core: {
          sheetClass: 'dnd5e.LootSheetNPC5e',
        },
        lootsheetnpc5e: {
          lootsheettype: 'Loot',
        },
      },
    };
    newActorData.items = this._getLootableItems({
      token,
      chanceOfDamagedItems,
      damagedItemsMultiplier,
      removeDamagedItems,
    });

    // Delete all items first
    await token.document.actor.deleteEmbeddedDocuments(
      'Item',
      Array.from(token.actor.items.keys())
    );

    // Update actor with the new sheet and items
    await token.document.actor.update(newActorData);

    // Update the document with the overlay icon and new permissions
    await token.document.update({
      overlayEffect: this._settings.lootIcon,
      vision: false,
      actorData: {
        actor: {
          flags: {
            loot: {
              playersPermission: CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER,
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

  // Remove natural weapons, natural armor, class features, spells, and feats.
  _getLootableItems({
    token,
    chanceOfDamagedItems,
    damagedItemsMultiplier,
    removeDamagedItems,
  }) {
    return token.actor.items
      .map((item) => {
        return item.toObject();
      })
      .filter((item) => {
        if (item.type == 'weapon') {
          return item.system.weaponType != 'natural';
        }

        if (item.type == 'equipment') {
          if (!item.system.armor) return true;
          return item.system.armor.type != 'natural';
        }

        return !['class', 'spell', 'feat'].includes(item.type);
      })
      .filter((item) => {
        if (this._isItemDamaged(item, chanceOfDamagedItems)) {
          if (removeDamagedItems) return false;

          item.name += ' (Damaged)';
          item.system.price *= damagedItemsMultiplier;
        }

        return true;
      })
      .map((item) => {
        item.system.equipped = false;
        return item;
      });
  }

  _isItemDamaged(item, chanceOfDamagedItems) {
    const rarity = item.system.rarity;
    if (!rarity) return false;

    // Never consider items above common rarity breakable
    if (rarity.toLowerCase() !== 'common' && rarity.toLowerCase() !== 'none') {
      return false;
    }

    return Math.random() < chanceOfDamagedItems;
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
    Object.assign(permissions, token.actor.permission);

    lootingUsers.forEach((user) => {
      permissions[user.id] = CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER;
    });

    return permissions;
  }

  /**
   * Converts the provided token from a lootable sheet
   *
   * @param {Token5e} token - the token to convert
   */
  async convertFromLoot(token) {
    const sheet = token.actor.sheet;

    // -1 for opened before but now closed
    // 0 for closed and never opened
    // 1 for currently open
    const priorState = sheet._state;

    // Close the old sheet if it's open
    await sheet.close();

    // Set back to default class
    await token.document.actor.setFlag('core', 'sheetClass', 'Default');

    // Update the document without the overlay icon and remove permissions
    await token.document.update({
      overlayEffect: '',
      vision: false,
      actorData: {
        actor: {
          flags: {
            loot: {
              playersPermission: CONST.DOCUMENT_PERMISSION_LEVELS.NONE,
            },
          },
        },
        permission: CONST.DOCUMENT_PERMISSION_LEVELS.NONE,
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

  /**
   * Converts the provided token to a item piles lootable sheet
   * check out the documentation from the itempiles page https://fantasycomputer.works/FoundryVTT-ItemPiles/#/api?id=turntokensintoitempiles
   * @param {object} options	object	Options to pass to the function
   * @param {Token5e} options.token - the token to convert
   * @param {object} options.pileSettings	object	Overriding settings to be put on the item piles’ settings - see pile flag defaults
   * @param {object} options.tokenSettings	object/Function	Overriding settings that will update the tokens’ settings
   * @param {boolean} options.applyDefaultLight little utility for lazy people apply a default light
   * @param {boolean} options.applyDefaultImage little utility for lazy people apply a default image
   */
  async _convertToItemPiles({
    token,
    pileSettings,
    tokenSettings,
    applyDefaultLight,
    applyDefaultImage
  }) {
    applyDefaultLight ??= true;
    applyDefaultImage ??= true;
    tokenSettings ??= {rotation: 0};
    pileSettings ??={}

    if (applyDefaultImage) {
      let imgPath = new Settings().lootIcon;
      mergeObject(tokenSettings, 
        { 
          texture: { 
            src: imgPath 
          },
          document:{ 
            texture: { 
              src: imgPath 
            }
          }
        }
      );
    }
    if (applyDefaultLight) {
      let light = {
        dim: 0.2,
        bright: 0.2,
        luminosity: 0,
        alpha: 1,
        color: '#ad8800',
        coloration: 6,
        animation: {
          // type:"sunburst",
          type: 'radialrainbow',
          speed: 3,
          intensity: 10,
        },
      };
      mergeObject(tokenSettings, { light: light});
    }
    await game.itempiles.API.turnTokensIntoItemPiles(
      token,
      {
        pileSettings: pileSettings,
        tokenSettings: tokenSettings
      }
    );
  }
}
