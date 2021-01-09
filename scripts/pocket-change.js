import log from './logger.js';

export default class PocketChange {
  populateTreasureForToken(tokenData) {
    const actor = game.actors.get(tokenData.actorId);

    if (!this._validate(tokenData, actor)) return;

    log('Generating treasure');

    setProperty(
      tokenData,
      'actorData.data.currency',
      this.generateCurrency(actor)
    );
  }

  generateCurrency(actor) {
    let currencyData;

    if (this._isWithinChallengeRating(actor, 0, 4)) {
      currencyData = this._treasureForChallengeRating0to4(actor);
    } else if (this._isWithinChallengeRating(actor, 5, 10)) {
      currencyData = this._treasureForChallengeRating5to10(actor);
    } else if (this._isWithinChallengeRating(actor, 11, 16)) {
      currencyData = this._treasureForChallengeRating11to16(actor);
    } else if (this._isWithinChallengeRating(actor, 17, 100)) {
      currencyData = this._treasureForChallengeRating17andUp(actor);
    }

    this._replaceCurrencyBasedOnStandard(currencyData);

    return currencyData;
  }

  _validate(tokenData, actor) {
    if (!actor) return false;

    if (!this._isEnabled()) {
      log("Refuse to generate treasure because you don't want me to");
      return false;
    }

    if (this._isPercentageLower()) {
      log(
        'Refuse to generate treasure because it did not pass the percent threshold'
      );
      return false;
    }

    if (this._isLootSheetNpc5e(actor)) {
      log('Refuse to generate treasure for existing loot sheets');
      return false;
    }

    if (this._isLinked(tokenData)) {
      log('Refuse to generate treasure for linked characters');
      return false;
    }

    if (!this._isMatchingType(actor)) {
      log('Refuse to generate treasure for non-matching type');
      return false;
    }

    if (!this._isActorNpc(actor)) {
      log('Refuse to generate treasure for non-npc actors');
      return false;
    }

    if (this._hasPlayerOwner(actor)) {
      log('Refuse to generate treasure for player owned actors');
    }

    if (!this._isGm()) {
      log('Refuse to generate treasure on the behest of mere players');
      return false;
    }

    return true;
  }

  _isEnabled() {
    return game.settings.get('dfreds-pocket-change', 'enabled');
  }

  _isPercentageLower() {
    const randomChance = Math.random();
    const chanceOfNoCurrency = game.settings.get(
      'dfreds-pocket-change',
      'chanceOfNoCurrency'
    );
    return randomChance < chanceOfNoCurrency;
  }

  _isLootSheetNpc5e(actor) {
    return actor.sheet.template.includes('lootsheetnpc5e');
  }

  _isLinked(tokenData) {
    return tokenData.actorLink;
  }

  _isMatchingType(actor) {
    const creatureTypes = game.settings
      .get('dfreds-pocket-change', 'creatureTypes')
      .split(';')
      .map((type) => type.toLowerCase().trim())
      .filter((type) => type);

    if (creatureTypes.length == 0) return true;

    let actorType = actor.data.data.details.type.toLowerCase().trim();
    return actorType && creatureTypes.includes(actorType);
  }

  _isActorNpc(actor) {
    return actor.data.type == 'npc';
  }

  _hasPlayerOwner(actor) {
    return actor.data.hasPlayerOwner;
  }

  _isGm() {
    return game.user.isGM;
  }

  _isWithinChallengeRating(actor, lowerCr, upperCr) {
    let cr = actor.data.data.details.cr;
    return cr >= lowerCr && cr <= upperCr;
  }

  _treasureForChallengeRating0to4(actor) {
    let currency = this._buildCurrencyObject(actor);
    let roll = this._rollDice('1d100');

    if (roll >= 1 && roll <= 30) {
      this._addCopper(currency, '5d6');
    } else if (roll >= 31 && roll <= 60) {
      this._addSilver(currency, '4d6');
    } else if (roll >= 61 && roll <= 70) {
      this._addElectrum(currency, '3d6');
    } else if (roll >= 71 && roll <= 95) {
      this._addGold(currency, '3d6');
    } else {
      this._addPlatinum(currency, '1d6');
    }

    return currency;
  }

  _treasureForChallengeRating5to10(actor) {
    let currency = this._buildCurrencyObject(actor);
    let roll = this._rollDice('1d100');

    if (roll >= 1 && roll <= 30) {
      this._addCopper(currency, '4d6*100');
      this._addElectrum(currency, '1d6*10');
    } else if (roll >= 31 && roll <= 60) {
      this._addSilver(currency, '6d6*10');
      this._addGold(currency, '2d6*10');
    } else if (roll >= 61 && roll <= 70) {
      this._addElectrum(currency, '3d6*10');
      this._addGold(currency, '2d6*10');
    } else if (roll >= 71 && roll <= 95) {
      this._addGold(currency, '4d6*10');
    } else {
      this._addGold(currency, '2d6*10');
      this._addPlatinum(currency, '3d6');
    }

    return currency;
  }

  _treasureForChallengeRating11to16(actor) {
    let currency = this._buildCurrencyObject(actor);
    let roll = this._rollDice('1d100');

    if (roll >= 1 && roll <= 20) {
      this._addSilver(currency, '4d6*100');
      this._addGold(currency, '1d6*100');
    } else if (roll >= 21 && roll <= 35) {
      this._addElectrum(currency, '1d6*100');
      this._addGold(currency, '1d6*100');
    } else if (roll >= 36 && roll <= 75) {
      this._addGold(currency, '2d6*100');
      this._addPlatinum(currency, '1d6*10');
    } else {
      this._addGold(currency, '2d6*100');
      this._addPlatinum(currency, '2d6*10');
    }

    return currency;
  }

  _treasureForChallengeRating17andUp(actor) {
    let currency = this._buildCurrencyObject(actor);
    let roll = this._rollDice('1d100');

    if (roll >= 1 && roll <= 15) {
      this._addElectrum(currency, '2d6*1000');
      this._addGold(currency, '8d6*100');
    } else if (roll >= 16 && roll <= 55) {
      this._addGold(currency, '1d6*1000');
      this._addPlatinum(currency, '1d6*100');
    } else {
      this._addGold(currency, '1d6*1000');
      this._addPlatinum(currency, '2d6*100');
    }

    return currency;
  }

  _addCopper(currencyObject, formula) {
    currencyObject.cp.value += this._multiplyByCurrencyMultiplier(formula);
  }

  _addSilver(currencyObject, formula) {
    currencyObject.sp.value += this._multiplyByCurrencyMultiplier(formula);
  }

  _addElectrum(currencyObject, formula) {
    currencyObject.ep.value += this._multiplyByCurrencyMultiplier(formula);
  }

  _addGold(currencyObject, formula) {
    currencyObject.gp.value += this._multiplyByCurrencyMultiplier(formula);
  }

  _addPlatinum(currencyObject, formula) {
    currencyObject.pp.value += this._multiplyByCurrencyMultiplier(formula);
  }

  _multiplyByCurrencyMultiplier(formula) {
    const currencyMultiplier = game.settings.get(
      'dfreds-pocket-change',
      'currencyMultiplier'
    );

    return Math.floor(this._rollDice(formula) * currencyMultiplier);
  }

  _buildCurrencyObject(actor) {
    return {
      cp: { value: actor.data.data.currency.cp.value || 0 },
      sp: { value: actor.data.data.currency.sp.value || 0 },
      ep: { value: actor.data.data.currency.ep.value || 0 },
      gp: { value: actor.data.data.currency.gp.value || 0 },
      pp: { value: actor.data.data.currency.pp.value || 0 },
    };
  }

  _rollDice(formula) {
    const roll = new Roll(formula);
    roll.roll();
    return roll.total;
  }

  _replaceCurrencyBasedOnStandard(currencyObject) {
    const currencyStandard = game.settings.get(
      'dfreds-pocket-change',
      'currencyStandard'
    );

    if (currencyStandard == 'normal') return;

    // Convert ep to sp
    currencyObject.sp.value += currencyObject.ep.value * 5;
    currencyObject.ep.value = 0;

    if (currencyStandard == 'silverStandard') {
      // Convert gp to sp
      currencyObject.sp.value += currencyObject.gp.value * 10;
      currencyObject.gp.value = 0;

      // Convert pp to sp
      currencyObject.sp.value += currencyObject.pp.value * 100;
      currencyObject.pp.value = 0;

      // Convert cp to sp, keep cp change
      currencyObject.sp.value += Math.floor(currencyObject.cp.value / 10);
      currencyObject.cp.value = currencyObject.cp.value % 10;
    }
  }

  /**
   * Macro support
   */
  generateCurrencyAndConvertToLootForSelectedTokens() {
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
              ui.notifications.error('Tokens must be selected to generate currency and convert to loot');
              return;
            }

            const filtered = canvas.tokens.controlled.filter((token) =>
              this._isTokenValid(token)
            );
            filtered.forEach(async (token) => {
              await this._generateCurrencyForToken(token);
              await this._convertTokenToLoot(token);
            });
            ui.notifications.info(
              `Generated currency for ${filtered.length} tokens`
            );
          },
        },
      },
      default: 'no',
    }).render(true);
  }

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
              ui.notifications.error('Tokens must be selected to generate currency');
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

  convertSelectedTokensToLoot() {
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
              ui.notifications.error('Tokens must be selected to convert to loot');
              return;
            }

            const filtered = canvas.tokens.controlled.filter((token) =>
              this._isTokenValid(token)
            );
            filtered.forEach(
              async (token) => await this._convertTokenToLoot(token)
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

  async _generateCurrencyForToken(token) {
    const actor = game.actors.get(token.data.actorId);

    const currency = this.generateCurrency(actor);
    let newCurrencyData = {};
    newCurrencyData['data.currency'] = currency;

    await token.actor.update(newCurrencyData);
  }

  async _convertTokenToLoot(token) {
    // Remove natural weapons, natural armor, class features, spells, and feats.
    let newItems = token.actor.data.items.filter((item) => {
      if (item.type == 'weapon') {
        return item.data.weaponType != 'natural';
      }
      if (item.type == 'equipment') {
        if (!item.data.armor) return true;
        return item.data.armor.type != 'natural';
      }
      return !['class', 'spell', 'feat'].includes(item.type);
    });

    let newCurrencyData = {};

    // Handles if they already have currency set somehow
    if (typeof token.actor.data.data.currency.cp === 'number') {
      newCurrencyData['data.currency'] = {
        cp: { value: token.actor.data.data.currency.cp },
        ep: { value: token.actor.data.data.currency.ep },
        gp: { value: token.actor.data.data.currency.gp },
        pp: { value: token.actor.data.data.currency.pp },
        sp: { value: token.actor.data.data.currency.sp },
      };
    }

    await token.actor.update(newCurrencyData);
    await token.actor.setFlag('core', 'sheetClass', 'dnd5e.LootSheet5eNPC');
    await token.update({
      'actorData.permission.default': ENTITY_PERMISSIONS.OBSERVER,
      overlayEffect: `icons/svg/chest.svg`,
    });
    await token.actor.update({ items: newItems });
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
}
