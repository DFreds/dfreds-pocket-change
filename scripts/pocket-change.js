import log from './logger.js';

export default class PocketChange {
  populateTreasureForActor(data, actor) {
    if (!this._validate(data, actor)) return;

    log('Generating treasure');

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

    setProperty(data, 'actorData.data.currency', currencyData);
  }

  _validate(data, actor) {
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

    if (this._isLinked(data)) {
      log('Refuse to generate treasure for linked characters');
      return false;
    }

    if (this._isHumanoidsOnly() && !this._isHumanoid(actor)) {
      log('Refuse to generate treasure for non-humanoid');
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

  _isLinked(data) {
    return data.actorLink;
  }

  _isHumanoidsOnly() {
    return game.settings.get('dfreds-pocket-change', 'humanoidsOnly');
  }

  _isHumanoid(actor) {
    let type = actor.data.data.details.type;
    return type && type.toLowerCase().includes('humanoid');
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
    currencyObject.cp.value += this._rollDice(formula);
  }

  _addSilver(currencyObject, formula) {
    currencyObject.sp.value += this._rollDice(formula);
  }

  _addElectrum(currencyObject, formula) {
    const shouldReplace = game.settings.get(
      'dfreds-pocket-change',
      'replaceElectrumWithSilver'
    );

    const electrum = this._rollDice(formula);

    if (shouldReplace) {
      currencyObject.sp.value += electrum * 5;
    } else {
      currencyObject.ep.value += this._rollDice(formula);
    }
  }

  _addGold(currencyObject, formula) {
    currencyObject.gp.value += this._rollDice(formula);
  }

  _addPlatinum(currencyObject, formula) {
    currencyObject.pp.value += this._rollDice(formula);
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
}
