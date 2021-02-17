import log from './logger.js';
import Settings from './settings.js';

export default class Validator {
  constructor(token, actor) {
    this._settings = new Settings();

    this._token = token;
    this._actor = actor;
  }

  /**
   * Checks if the provided token and actor can have currency generated for it
   * or can be converted to loot.
   *
   * @returns {Boolean} true if it can have currency genereated for it or be
   * converted to loot
   */
  isValid() {
    if (!this._actor) return false;

    if (!this._settings.enabled) {
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
      return false;
    }

    if (!this._isGm()) {
      log('Refuse to generate treasure on the behest of mere players');
      return false;
    }

    return true;
  }

  _isPercentageLower() {
    return Math.random() < this._settings.chanceOfNoCurrency;
  }

  _isLootSheetNpc5e() {
    return this._actor.sheet.template.includes('lootsheetnpc5e');
  }

  _isLinked() {
    return this._token.actorLink;
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
