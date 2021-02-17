import log from './logger.js';

export default class Validator {
  constructor(tokenData, actor) {
    this._tokenData = tokenData;
    this._actor = actor;
  }

  isValid() {
    if (!this._actor) return false;

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

    if (this._isLootSheetNpc5e()) {
      log('Refuse to generate treasure for existing loot sheets');
      return false;
    }

    if (this._isLinked()) {
      log('Refuse to generate treasure for linked characters');
      return false;
    }

    if (!this._isActorNpc()) {
      log('Refuse to generate treasure for non-npc actors');
      return false;
    }

    if (!this._isMatchingType()) {
      log('Refuse to generate treasure for non-matching type');
      return false;
    }

    if (this._hasPlayerOwner()) {
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

  _isLootSheetNpc5e() {
    return this._actor.sheet.template.includes('lootsheetnpc5e');
  }

  _isLinked() {
    return this._tokenData.actorLink;
  }

  _isMatchingType() {
    const creatureTypes = game.settings
      .get('dfreds-pocket-change', 'creatureTypes')
      .split(';')
      .map((type) => type.toLowerCase().trim())
      .filter((type) => type);

    if (creatureTypes.length == 0) return true;

    let actorType = this._actor.data.data.details.type.toLowerCase().trim();
    return actorType && creatureTypes.includes(actorType);
  }

  _isActorNpc() {
    return this._actor.data.type == 'npc';
  }

  _hasPlayerOwner() {
    return this._actor.data.hasPlayerOwner;
  }

  _isGm() {
    return game.user.isGM;
  }
}