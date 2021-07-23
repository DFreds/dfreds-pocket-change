import log from './logger.js';
import Settings from './settings.js';

/**
 * Ensures a token is a valid candidate for converting to loot or generating currency
 */
export default class Validator {
  constructor() {
    this._settings = new Settings();
  }

  /**
   * Checks if the provided token and actor can have currency generated for it.
   *
   * @param {Actor5e} actor - the actor to check
   * @returns {Boolean} true if it can have currency genereated for it
   */
  async shouldAutoGenerateCurrency(actor) {
    if (!actor) return false;

    const tokenData = await actor.getTokenData();

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

    if (this._isLootSheetNpc5e(actor)) {
      log('Refuse to generate treasure for existing loot sheets');
      return false;
    }

    if (this._isLinked(tokenData)) {
      log('Refuse to generate treasure for linked characters');
      return false;
    }

    if (!this._isActorNpc(actor)) {
      log('Refuse to generate treasure for non-npc actors');
      return false;
    }

    if (!this._isMatchingType(actor)) {
      log('Refuse to generate treasure for non-matching type');
      return false;
    }

    if (this._hasPlayerOwner(actor)) {
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

  _isLootSheetNpc5e(actor) {
    return actor.sheet.template.includes('lootsheetnpc5e');
  }

  _isLinked(token) {
    return token.actorLink;
  }

  _isActorNpc(actor) {
    return actor.data.type == 'npc';
  }

  _isMatchingType(actor) {
    const creatureTypes = this._settings.creatureTypes
      .split(';')
      .map((type) => type.toLowerCase().trim())
      .filter((type) => type);

    // Handle blank creature types by always saying they are valid
    if (creatureTypes.length === 0) return true;

    let actorType = actor.data.data.details?.type?.value?.toLowerCase().trim();
    let actorSubtype = actor.data.data.details?.type?.subtype
      ?.toLowerCase()
      .trim();

    if (actorType === 'custom') {
      actorType = actor.data.data.details?.type?.custom?.toLowerCase().trim();
    }

    return creatureTypes.some(
      (type) => actorType.startsWith(type) || actorSubtype.startsWith(type)
    );
  }

  _hasPlayerOwner(actor) {
    return actor.data.hasPlayerOwner;
  }

  _isGm() {
    return game.user.isGM;
  }
}
