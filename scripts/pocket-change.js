import Currency from './currency.js';
import log from './logger.js';
import Validator from './validator.js';

export default class PocketChange {
  constructor() {
    this._validator = new Validator();
  }

  /**
   * Takes the provided token and adds currency to it if it is valid
   *
   * @param {Token} tokenData - The token data
   */
  populateTreasureForToken(tokenDocument) {
    const tokenData = tokenDocument.data;
    const actor = tokenDocument.actor;

    if (!this._validator.isValid(tokenData, actor)) return;

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
   * @param {Actor} actor - The relevant actor for the token
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

    // return currency.convertToLootSheetCurrency();
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
